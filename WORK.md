# WORK.md — System Improvement Roadmap

> This document tracks all planned changes to the TeamSync project based on a full system design audit.
> Work through each priority one by one. Check off tasks as they are completed.

---

## Current Stack (as audited)

| Layer | Technology | Status |
|---|---|---|
| Backend | FastAPI (Python) | Good |
| Relational DB | PostgreSQL (Neon) | ✅ Migrated |
| NoSQL | MongoDB Atlas | Good |
| Vector DB | Qdrant Cloud | ✅ Migrated to cloud |
| ML Embeddings | HuggingFace Inference API | ✅ Replaced local model |
| ORM | SQLAlchemy + psycopg2 | Good |
| Auth | JWT (python-jose, HS256, 24h) | ✅ Implemented |
| File Storage | Cloudinary | ✅ Implemented |
| Caching | None | Missing — next up |
| Rate Limiting | None | Missing |
| Frontend | React + Vite | Good |

---

## ACID & Consistency Problems Found

1. **No atomic cross-DB transaction** — Student registration writes to SQLite first, then MongoDB. If MongoDB write fails, SQLite row stays → orphaned student with no login credentials.
2. **SQLite isolation is too strict** — Serializable isolation + single writer lock means all writes queue up behind each other.
3. **MongoDB write concern not set** — Defaults may allow fire-and-forget writes. Should be `w='majority'`.
4. **No indexes on any column** — Every search (`ilike` on name, email, usn) is a full table scan.
5. **Qdrant stores only `archive_id`** — If `./qdrant_data` directory is deleted, all embeddings are lost with no way to regenerate them from the vector DB alone.
6. **No migration framework** — `migrate_*.py` scripts are manual, one-shot, and unversioned.

---

## Scalability Bottlenecks Found

| Component | Current Capacity | Root Cause |
|---|---|---|
| SQLite | ~10–100 concurrent users | Single writer lock, no MVCC, no row-level locking |
| ML Model (local) | Crashes free-tier hosting | `all-MiniLM-L6-v2` needs ~500MB RAM alone |
| Embedding on request | Blocks HTTP response | Synchronous inference during `POST /projects/{id}/archive` |
| No caching | DB hit on every request | List endpoints re-query DB for every user |
| No rate limiting | Vulnerable to abuse | Any client can flood the API |
| Single process | One crash = full downtime | No workers, no load balancing |

---

## Priority 1 — Replace SQLite with PostgreSQL

**Why:** SQLite has a single writer lock. At 100+ concurrent users, all writes queue. At 1000, it deadlocks or times out. PostgreSQL has MVCC — readers never block writers, row-level locking, proper connection pooling.

**Files to change:**
- `backend/database.py` — change connection URL and engine config
- `backend/models.py` — minor: remove `check_same_thread` arg
- `requirements.txt` — add `psycopg2-binary`
- `.env` — replace SQLite path with `DATABASE_URL=postgresql://...`

**What to do:**
- [ ] Provision a free PostgreSQL instance on **Neon** (neon.tech)
- [ ] Update `database.py`:
  ```python
  DATABASE_URL = os.getenv("DATABASE_URL")  # postgresql://...
  engine = create_engine(
      DATABASE_URL,
      pool_size=20,
      max_overflow=30,
      pool_pre_ping=True,
  )
  ```
- [ ] Add `psycopg2-binary` to `requirements.txt`
- [ ] Run `Base.metadata.create_all(engine)` to create tables in Postgres
- [ ] Test all existing endpoints still work
- [ ] Delete `WHOLE_INFO.db` from repo (add to `.gitignore`)

**Free platform:** Neon (neon.tech) — 512MB free, serverless, always on

---

## Priority 2 — Add Database Indexes

**Why:** Every search endpoint uses `ilike()` on name, email, usn — these are full table scans. With 10k+ rows, each query degrades significantly. Indexes make these O(log n).

**Files to change:**
- `backend/models.py` — add `Index` declarations to Student, Faculty, Team models

**What to do:**
- [ ] Add indexes to `models.py`:
  ```python
  from sqlalchemy import Index

  class Student(Base):
      __table_args__ = (
          Index('ix_student_email', 'email'),
          Index('ix_student_name', 'name'),
          Index('ix_student_dept_sem', 'dept_id', 'sem'),
      )

  class Faculty(Base):
      __table_args__ = (
          Index('ix_faculty_email', 'email'),
          Index('ix_faculty_name', 'name'),
      )
  ```
- [ ] After switching to PostgreSQL, run `CREATE INDEX` via Alembic migration (see Priority 6)

---

## Priority 3 — Fix Distributed Transaction (Student & Faculty Registration)

**Why:** Two databases are written to in sequence with no compensation. If MongoDB write fails after SQLite write succeeds, the record is permanently orphaned — the user exists in the app but can never log in.

**Files to change:**
- `backend/router/student.py` — wrap registration in saga pattern
- `backend/router/faculty.py` — same fix

**What to do:**
- [ ] In `student.py` register endpoint, add compensating rollback:
  ```python
  db.add(student)
  db.commit()
  try:
      users_collection.insert_one(auth_doc)
  except Exception:
      db.delete(student)      # compensating transaction
      db.commit()
      raise HTTPException(500, "Registration failed — please retry")
  ```
- [ ] Apply same pattern to `faculty.py` register
- [ ] Add MongoDB write concern `w='majority'` in `mongodb.py`:
  ```python
  client = MongoClient(MONGODB_URL, w='majority')
  ```

---

## Priority 4 — Add JWT Authentication Middleware

**Why:** Currently there is zero token verification. Any user can call any endpoint — a student can update grades, delete projects, or read all user data. This is a critical security gap.

**Files to change:**
- `backend/main.py` — add auth middleware
- `backend/router/auth.py` — return JWT on login
- All protected routers — add `Depends(get_current_user)`
- `requirements.txt` — add `python-jose[cryptography]`
- `.env` — add `JWT_SECRET_KEY`

**What to do:**
- [ ] Add `python-jose[cryptography]` to `requirements.txt`
- [ ] Create `backend/auth_utils.py`:
  ```python
  from jose import jwt
  from datetime import datetime, timedelta

  SECRET_KEY = os.getenv("JWT_SECRET_KEY")
  ALGORITHM = "HS256"

  def create_token(data: dict):
      data["exp"] = datetime.utcnow() + timedelta(hours=24)
      return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

  def verify_token(token: str):
      return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
  ```
- [ ] Update `POST /api/auth/login` to return `{"access_token": token, "token_type": "bearer"}`
- [ ] Add `get_current_user` dependency to all write endpoints
- [ ] Add role checks: only faculty can set marks, only team members can update their own project
- [ ] Update frontend `client.js` to send `Authorization: Bearer <token>` header

---

## Priority 5 — Move Embedding Generation to Background Task

**Why:** `POST /projects/{id}/archive` currently generates a 384-dim embedding synchronously during the HTTP request. The sentence-transformers model takes 500ms–2s per inference. Under load this blocks the event loop and causes timeouts.

**Files to change:**
- `backend/router/projects.py` — move embedding call to background task
- `backend/semantic_search.py` — switch from local model to HuggingFace Inference API

### 5a — Replace Local Model with HuggingFace Inference API

**Why this is required separately:** The local `all-MiniLM-L6-v2` model needs ~500MB RAM. Every free hosting tier (Render, Railway, Fly.io) has 512MB total RAM — the model alone exhausts it and the app crashes on startup.

**What to do:**
- [ ] Get a free HuggingFace token at huggingface.co → Settings → Access Tokens
- [ ] Add `HF_TOKEN` to `.env`
- [ ] Rewrite `semantic_search.py` to call HF Inference API:
  ```python
  import requests, os

  HF_TOKEN = os.getenv("HF_TOKEN")
  HF_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"

  def get_embedding(text: str) -> list[float]:
      response = requests.post(
          HF_URL,
          headers={"Authorization": f"Bearer {HF_TOKEN}"},
          json={"inputs": text}
      )
      return response.json()  # returns 384-dim vector
  ```
- [ ] Remove `sentence-transformers`, `torch`, `scikit-learn` from `requirements.txt` (saves ~2GB of install size)
- [ ] Test that Qdrant still receives valid vectors

### 5b — Move to Background Task

- [ ] Update archive endpoint in `projects.py`:
  ```python
  from fastapi import BackgroundTasks

  @router.post("/{project_id}/archive")
  async def archive_project(project_id: int, bg: BackgroundTasks, db=Depends(get_db)):
      archive = create_archive_record(db, project_id)
      bg.add_task(generate_and_store_embedding, archive.archive_id, archive.title, archive.abstract)
      return {"message": "Project archived. Semantic search will be available shortly.", "archive_id": archive.archive_id}
  ```

---

## Priority 6 — Add Redis Caching Layer

**Why:** List endpoints (`GET /teams/`, `GET /students/`, `GET /archives/`) hit the database on every single request from every user. With 1k users, these become read storms that saturate the DB connection pool.

**Files to change:**
- `backend/main.py` — initialize Redis client
- `backend/router/teams.py`, `student_get.py`, `archives.py` — add cache check/set
- `requirements.txt` — add `redis`
- `.env` — add `REDIS_URL`

**What to do:**
- [ ] Provision free Redis on **Upstash** (upstash.com) — free tier, serverless Redis
- [ ] Add `redis` to `requirements.txt`
- [ ] Add caching to hot read endpoints:
  ```python
  import redis, json

  r = redis.from_url(os.getenv("REDIS_URL"))

  @router.get("/")
  async def list_teams(db=Depends(get_db)):
      cached = r.get("teams:all")
      if cached:
          return json.loads(cached)
      teams = fetch_teams_from_db(db)
      r.setex("teams:all", 60, json.dumps(teams))  # 60s TTL
      return teams
  ```
- [ ] Invalidate cache on any write: `r.delete("teams:all")` in create/update/delete team endpoints

---

## Priority 7 — Add Rate Limiting

**Why:** No rate limiting means any client can flood the API with thousands of requests per second — brute-force login attacks, DDoS, accidental loops in the frontend.

**Files to change:**
- `backend/main.py` — add SlowAPI middleware
- `backend/router/auth.py` — strict limit on login
- `requirements.txt` — add `slowapi`

**What to do:**
- [ ] Add `slowapi` to `requirements.txt`
- [ ] Add to `main.py`:
  ```python
  from slowapi import Limiter, _rate_limit_exceeded_handler
  from slowapi.util import get_remote_address
  from slowapi.errors import RateLimitExceeded

  limiter = Limiter(key_func=get_remote_address)
  app.state.limiter = limiter
  app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
  ```
- [ ] Apply strict limit to login:
  ```python
  @router.post("/login")
  @limiter.limit("5/minute")
  async def login(request: Request, ...):
  ```
- [ ] Apply general limit to all other endpoints: `@limiter.limit("60/minute")`

---

## Priority 8 — Production Deployment Architecture

**Why:** A single uvicorn process means one crash = full downtime, and one slow request blocks others. The target is Nginx in front → multiple FastAPI workers → pgBouncer → PostgreSQL.

### Target Free Deployment Stack

| Component | Platform | Free Tier |
|---|---|---|
| Frontend (React) | **Vercel** | Free forever |
| Backend (FastAPI) | **Railway** | $5 credit/month |
| PostgreSQL | **Neon** | 512MB free |
| MongoDB | **MongoDB Atlas** | 512MB free (already using) |
| Qdrant | **Qdrant Cloud** | 1GB free cluster |
| Redis | **Upstash** | 10k requests/day free |
| ML Embeddings | **HuggingFace Inference API** | Free with token |

### What to do:

**Frontend:**
- [ ] Run `npm run build` and deploy dist/ to Vercel
- [ ] Set env var `VITE_API_URL=https://your-backend.railway.app` in Vercel dashboard
- [ ] Update `frontend/src/api/client.js` to read from `import.meta.env.VITE_API_URL`

**Backend:**
- [ ] Create `Dockerfile` for FastAPI app
- [ ] Create `railway.json` or connect GitHub repo to Railway
- [ ] Set all env vars in Railway dashboard: `DATABASE_URL`, `MONGODB_URL`, `HF_TOKEN`, `JWT_SECRET_KEY`, `REDIS_URL`
- [ ] Run with multiple workers: `CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]`

**Qdrant:**
- [x] Create free cluster on Qdrant Cloud (cloud.qdrant.io)
- [x] Update `semantic_search.py` to use cloud URL + API key instead of local `./qdrant_data`
- [x] Add `QDRANT_URL` and `QDRANT_API_KEY` to `.env`

**CORS:**
- [ ] Update `main.py` CORS from `allow_origins=["*"]` to `allow_origins=["https://your-app.vercel.app"]`

---

## Migration Framework (Ongoing)

**Why:** Manual `migrate_*.py` scripts are error-prone and non-versioned. Alembic gives you versioned, reversible migrations.

- [ ] Add `alembic` to `requirements.txt`
- [ ] Run `alembic init alembic` in `backend/`
- [ ] Configure `alembic/env.py` to use `DATABASE_URL` from `.env`
- [ ] From now on, all schema changes go through `alembic revision --autogenerate -m "description"`

---

## Feature A — Deadline / Timeline Management

**Why:** Phase 1 and Phase 2 are just mark fields with no concept of when submissions are due. There is no enforcement, no locking after deadline, and students have no visibility into how much time they have left. This is core functionality for an academic project system.

**Schema changes (do before PostgreSQL migration):**
- Add `phase1_deadline` (DateTime, nullable) to `project` table
- Add `phase2_deadline` (DateTime, nullable) to `project` table
- Add `is_locked` (Boolean, default False) to `project` table

**Files to change:**
- `backend/models.py` — add deadline + lock fields to Project model
- `backend/router/projects.py` — add deadline set endpoint, lock check on submission
- `backend/router/projects.py` — add deadline to project response

**What to do:**
- [ ] Add fields to `Project` model in `models.py`:
  ```python
  phase1_deadline = Column(DateTime, nullable=True)
  phase2_deadline = Column(DateTime, nullable=True)
  is_locked = Column(Boolean, default=False)
  ```
- [ ] Add admin endpoint `PUT /projects/{id}/deadlines` to set both deadlines (faculty/admin only after JWT is added)
- [ ] In phase mark endpoints, check if deadline has passed — if so, reject with `403 Deadline passed`
- [ ] Add `GET /projects/{id}/deadline-status` → returns time remaining for each phase
- [ ] Frontend: show countdown timer on project dashboard

---

## Feature B — Faculty Feedback / Comments on Projects

**Why:** Faculty can only assign a numeric mark. There is no way to leave written feedback, review notes, or per-phase comments. Students have no idea why they got a particular score.

**Schema changes (do before PostgreSQL migration):**
- Add `phase1_feedback` (Text, nullable) to `project` table
- Add `phase2_feedback` (Text, nullable) to `project` table

**Files to change:**
- `backend/models.py` — add feedback fields to Project model
- `backend/router/projects.py` — include feedback in mark-setting endpoints

**What to do:**
- [ ] Add fields to `Project` model in `models.py`:
  ```python
  phase1_feedback = Column(Text, nullable=True)
  phase2_feedback = Column(Text, nullable=True)
  ```
- [ ] Update `PUT /projects/phase1/{id}` to accept optional `feedback: str` query param alongside `marks`
- [ ] Update `PUT /projects/phase2/{id}` the same way
- [ ] Include feedback fields in project GET responses
- [ ] Frontend: faculty sees a text area next to the marks input; students see read-only feedback card

---

## Feature C — Password Reset (Email OTP)

**Why:** There is no recovery path if a user forgets their password. No forgot-password endpoint exists.

**What to do:**
- [ ] Add `resend` or `sendgrid` to `requirements.txt` (both have free tiers)
- [ ] Add `RESEND_API_KEY` or `SENDGRID_API_KEY` to `.env`
- [ ] Add OTP store — use MongoDB collection `password_resets`: `{email, otp, expires_at}`
- [ ] Add `POST /api/auth/forgot-password` → generates 6-digit OTP, stores in MongoDB with 10-min TTL, sends email
- [ ] Add `POST /api/auth/reset-password` → validates OTP, updates hashed password in MongoDB, deletes OTP record
- [ ] Frontend: Forgot Password page with email input → OTP input → new password input

**Free email service:** Resend (resend.com) — 3,000 emails/month free

---

## Feature D — Frontend Notification Polling

**Why:** Notifications are stored in MongoDB but never pushed to users. The frontend has no polling mechanism — users only see notifications if they manually navigate to the notifications page. In practice, nobody sees them.

**This is a frontend-only fix — no backend changes needed.**

**What to do:**
- [ ] In the main layout component, add a `useEffect` that polls `GET /notifications/{user_type}` every 30 seconds
- [ ] Show unread count badge on the notification bell icon
- [ ] Mark notifications as read when user opens the panel — add `PUT /notifications/{id}/read` endpoint (add `is_read` field to MongoDB notification doc)
- [ ] Use `react-hot-toast` (already installed) to pop a toast when a new notification arrives

---

## Feature E — Admin Role & Dashboard

**Why:** There is no admin user type. Nobody can see system-wide stats — how many teams formed, average marks per cluster, submission rates, which departments are most active. Useful for coordinators.

**What to do:**
- [ ] Add `admin` as a valid `user_type` in MongoDB auth
- [ ] After JWT is added (Priority 4), add admin-only route guard
- [ ] Add `GET /admin/stats` endpoint returning:
  ```json
  {
    "total_students": 120,
    "total_teams": 28,
    "teams_with_project": 22,
    "teams_without_mentor": 4,
    "average_phase1_marks": 31.4,
    "average_phase2_marks": 44.1,
    "total_archives": 67,
    "students_without_team": 18
  }
  ```
- [ ] Frontend: Admin dashboard page with stat cards and simple charts (use `recharts` — lightweight, free)

---

## Feature F — File Upload for Resumes and Reports

**Why:** `resume` on Student and `report_link` on Project are plain text URL fields. Users paste Google Drive links which expire, get permission-restricted, or are invalid. There is no actual file storage.

**What to do:**
- [ ] Create free account on **Cloudinary** (cloudinary.com) — 25GB free storage
- [ ] Add `cloudinary` to `requirements.txt`
- [ ] Add `CLOUDINARY_URL` to `.env`
- [ ] Add `POST /upload/resume` endpoint — accepts PDF, uploads to Cloudinary, returns permanent URL
- [ ] Add `POST /upload/report` endpoint — same for project reports
- [ ] Store returned Cloudinary URL in the existing `resume` / `report_link` fields (no schema change needed)
- [ ] Frontend: replace URL text input with a file picker that uploads and auto-fills the URL field

---

## Progress Tracker

| Priority | Task | Status |
|---|---|---|
| 1 | Replace SQLite with PostgreSQL | [x] Done — Neon Postgres, all tables created, data seeded |
| 2 | Add database indexes | [x] Done — 8 indexes on Neon, migrate_add_indexes.py |
| 3 | Fix distributed transaction (saga) | [x] Done — compensating rollback in student + faculty register |
| 4 | Add JWT authentication middleware | [x] Done — auth_utils.py, all routes protected, role guards on faculty endpoints |
| 5a | Replace local ML model with HF Inference API | [x] Done — semantic_search.py rewrote to use HF API |
| 5b | Move embedding to background task | [x] Done — archive endpoint uses BackgroundTasks |
| 6 | Add Redis caching layer | [x] Done — cache.py, 4 list endpoints cached, Upstash Redis, graceful fallback |
| 7 | Add rate limiting | [x] Done — slowapi, login 5/min, forgot-password 3/min, 100/min default |
| 8 | Deploy to free cloud stack | [ ] Not started |
| — | Add Alembic migration framework | [ ] Not started |
| A | Deadline / timeline management | [x] Done — set deadlines, lock toggle, deadline-status endpoint |
| B | Faculty feedback / comments on projects | [x] Done — feedback param on phase1/phase2 mark endpoints |
| C | Password reset (email OTP) | [x] Done — /forgot-password + /reset-password via Resend |
| D | Frontend notification polling | [x] Done — useNotifications hook, 30s polling, toast on new, JWT interceptor in client.js |
| E | Admin role & dashboard | [ ] Not started |
| F | File upload for resumes and reports | [x] Done — POST /api/upload/, Cloudinary (resource_type=auto), FileUploadButton component |

---

## Environment Variables Needed (final .env)

```
# Database
DATABASE_URL=postgresql://...        # ✅ Neon

# MongoDB
MONGODB_URL=mongodb+srv://...        # ✅ Atlas

# Qdrant Cloud
QDRANT_URL=https://...qdrant.io      # ✅ set
QDRANT_API_KEY=...                   # ✅ set

# ML
HF_TOKEN=hf_...                      # ✅ set

# Auth
JWT_SECRET_KEY=...                   # ✅ set

# File uploads
CLOUDINARY_URL=cloudinary://...      # ✅ set

# Email
RESEND_API_KEY=re_...                # ✅ set

# Redis — next
REDIS_URL=redis://...                # from Upstash
```
