from typing import Annotated, List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from bson import ObjectId

from database import SessionLocal
from models import Student, Team
from mongodb import get_team_invites_collection
from auth_utils import get_current_user, require_student
from cache import cache_delete

router = APIRouter(prefix="/teams", tags=["team-invites"])

CLUSTER_PARENT_MAP = {
    "AI": "CSE", "CD": "CSE", "CS": "CSE", "CY": "CSE", "IS": "CSE", "ISE": "CSE",
    "EC": "ECE", "EE": "ECE", "EI": "ECE", "ET": "ECE",
    "AS": "ME",  "IM": "ME",  "ME": "ME",
    "CV": "CV",  "BT": "CV",  "CH": "CV",
}
VALID_CLUSTERS = {"CSE", "ECE", "ME", "CV"}
INVITE_EXPIRY_HOURS = 24


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DB = Annotated[Session, Depends(get_db)]


def _cluster(dept_id: str) -> str | None:
    if not dept_id:
        return None
    return dept_id if dept_id in VALID_CLUSTERS else CLUSTER_PARENT_MAP.get(dept_id)


# ── schemas ────────────────────────────────────────────────────────────────────

class InviteCreate(BaseModel):
    team_name: str
    member_usns: List[str]


class InviteRespond(BaseModel):
    action: str  # "accept" | "reject"


# ── POST /teams/invite ──────────────────────────────────────────────────────────

@router.post("/invite", status_code=status.HTTP_201_CREATED)
def send_invite(payload: InviteCreate, db: DB, user: dict = Depends(require_student)):
    initiator_usn = user["user_id"]
    member_usns = list(dict.fromkeys(payload.member_usns))  # deduplicate, preserve order

    if initiator_usn not in member_usns:
        raise HTTPException(400, "You must include yourself in the team.")

    if not (4 <= len(member_usns) <= 5):
        raise HTTPException(400, "Team must have 4 or 5 members.")

    students = db.query(Student).filter(Student.usn.in_(member_usns)).all()
    if len(students) != len(member_usns):
        found = {s.usn for s in students}
        missing = [u for u in member_usns if u not in found]
        raise HTTPException(404, f"Students not found: {missing}")

    already_in_team = [s.usn for s in students if s.team_id is not None]
    if already_in_team:
        raise HTTPException(400, f"Already in a team: {already_in_team}")

    sems = {s.sem for s in students}
    if len(sems) > 1:
        raise HTTPException(400, "All members must be in the same semester.")

    clusters = {_cluster(s.dept_id) for s in students}
    if len(clusters) > 1:
        raise HTTPException(400, "All members must be from the same cluster.")

    invites_col = get_team_invites_collection()

    # Block duplicate pending invite from same initiator
    if invites_col.find_one({"initiator_usn": initiator_usn, "overall_status": "pending"}):
        raise HTTPException(400, "You already have a pending invite. Cancel it first.")

    students_map = {s.usn: s for s in students}
    members = [
        {
            "usn": usn,
            "name": students_map[usn].name,
            "status": "accepted" if usn == initiator_usn else "pending",
        }
        for usn in member_usns
    ]

    now = datetime.now(timezone.utc)
    result = invites_col.insert_one({
        "team_name": payload.team_name,
        "initiator_usn": initiator_usn,
        "initiator_name": students_map[initiator_usn].name,
        "members": members,
        "overall_status": "pending",
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(hours=INVITE_EXPIRY_HOURS)).isoformat(),
    })

    return {"message": "Invites sent!", "invite_id": str(result.inserted_id)}


# ── GET /teams/invites/incoming ─────────────────────────────────────────────────

@router.get("/invites/incoming")
def get_incoming_invites(user: dict = Depends(require_student)):
    usn = user["user_id"]
    invites_col = get_team_invites_collection()
    now = datetime.now(timezone.utc).isoformat()

    raw = list(invites_col.find({
        "members": {"$elemMatch": {"usn": usn, "status": "pending"}},
        "overall_status": "pending",
        "expires_at": {"$gt": now},
    }))

    return [
        {
            "invite_id": str(inv["_id"]),
            "team_name": inv["team_name"],
            "initiator_usn": inv["initiator_usn"],
            "initiator_name": inv["initiator_name"],
            "members": inv["members"],
            "created_at": inv["created_at"],
            "expires_at": inv["expires_at"],
        }
        for inv in raw
    ]


# ── GET /teams/invites/sent ─────────────────────────────────────────────────────

@router.get("/invites/sent")
def get_sent_invites(user: dict = Depends(require_student)):
    usn = user["user_id"]
    invites_col = get_team_invites_collection()

    raw = list(invites_col.find({"initiator_usn": usn}).sort("created_at", -1).limit(10))

    return [
        {
            "invite_id": str(inv["_id"]),
            "team_name": inv["team_name"],
            "members": inv["members"],
            "overall_status": inv["overall_status"],
            "created_at": inv["created_at"],
        }
        for inv in raw
    ]


# ── PUT /teams/invites/{id}/respond ────────────────────────────────────────────

@router.put("/invites/{invite_id}/respond")
def respond_to_invite(
    invite_id: str,
    payload: InviteRespond,
    db: DB,
    user: dict = Depends(require_student),
):
    if payload.action not in ("accept", "reject"):
        raise HTTPException(400, "action must be 'accept' or 'reject'.")

    usn = user["user_id"]
    invites_col = get_team_invites_collection()

    try:
        oid = ObjectId(invite_id)
    except Exception:
        raise HTTPException(400, "Invalid invite ID.")

    invite = invites_col.find_one({"_id": oid})
    if not invite:
        raise HTTPException(404, "Invite not found.")
    if invite["overall_status"] != "pending":
        raise HTTPException(400, "This invite is no longer active.")
    if invite["expires_at"] < datetime.now(timezone.utc).isoformat():
        invites_col.update_one({"_id": oid}, {"$set": {"overall_status": "expired"}})
        raise HTTPException(400, "This invite has expired.")

    member = next((m for m in invite["members"] if m["usn"] == usn), None)
    if not member:
        raise HTTPException(403, "You are not part of this invite.")
    if member["status"] != "pending":
        raise HTTPException(400, "You have already responded.")

    # ── reject ──────────────────────────────────────────────────────────────────
    if payload.action == "reject":
        invites_col.update_one(
            {"_id": oid, "members.usn": usn},
            {"$set": {"members.$.status": "rejected", "overall_status": "cancelled"}},
        )
        return {"message": "Invite rejected. The team request has been cancelled."}

    # ── accept ──────────────────────────────────────────────────────────────────
    invites_col.update_one(
        {"_id": oid, "members.usn": usn},
        {"$set": {"members.$.status": "accepted"}},
    )

    updated = invites_col.find_one({"_id": oid})
    all_accepted = all(m["status"] == "accepted" for m in updated["members"])

    if not all_accepted:
        pending_count = sum(1 for m in updated["members"] if m["status"] == "pending")
        return {"message": f"Accepted! Waiting for {pending_count} more member(s)."}

    # ── all accepted — form the team ────────────────────────────────────────────
    member_usns = [m["usn"] for m in updated["members"]]
    students = db.query(Student).filter(Student.usn.in_(member_usns)).all()

    already_in_team = [s.usn for s in students if s.team_id is not None]
    if already_in_team:
        invites_col.update_one({"_id": oid}, {"$set": {"overall_status": "cancelled"}})
        raise HTTPException(
            400,
            f"Some members already joined another team: {already_in_team}. Invite cancelled.",
        )

    new_team = Team(team_name=updated["team_name"], status="active")
    try:
        db.add(new_team)
        db.flush()
        for student in students:
            student.team_id = new_team.team_id
        db.commit()
        db.refresh(new_team)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, "Failed to create team in database.") from e

    invites_col.update_one(
        {"_id": oid},
        {"$set": {"overall_status": "accepted", "team_id": new_team.team_id}},
    )
    cache_delete("teams:all", "students:all")

    return {
        "message": f"All members accepted! Team '{updated['team_name']}' has been created.",
        "team_id": new_team.team_id,
    }


# ── DELETE /teams/invites/{id} — cancel a sent invite ──────────────────────────

@router.delete("/invites/{invite_id}")
def cancel_invite(invite_id: str, user: dict = Depends(require_student)):
    usn = user["user_id"]
    invites_col = get_team_invites_collection()

    try:
        oid = ObjectId(invite_id)
    except Exception:
        raise HTTPException(400, "Invalid invite ID.")

    invite = invites_col.find_one({"_id": oid, "initiator_usn": usn})
    if not invite:
        raise HTTPException(404, "Invite not found or you are not the initiator.")
    if invite["overall_status"] != "pending":
        raise HTTPException(400, "Only pending invites can be cancelled.")

    invites_col.update_one({"_id": oid}, {"$set": {"overall_status": "cancelled"}})
    return {"message": "Invite cancelled."}
