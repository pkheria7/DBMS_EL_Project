## SQL QUERIES (SQLite)

### 1. **Retrieve All Active Teams with Student Members**

**SQL Query:**

```sql
SELECT t.team_id, t.team_name, t.status,
       s.usn, s.name, s.email, s.dept_id
FROM team t
JOIN student s ON t.team_id = s.team_id
WHERE t.status = 'active'
ORDER BY t.team_id;
```

**Sample Output:**

```
| team_id | team_name    | status | usn          | name            | email                  | dept_id |
|---------|-------------|--------|--------------|-----------------|------------------------|---------|
| 1       | Alpha Team  | active | 1RV21CS001   | Raj Kumar       | raj@example.com        | CS      |
| 1       | Alpha Team  | active | 1RV21CS002   | Priya Sharma    | priya@example.com      | CS      |
| 2       | Beta Squad  | active | 1RV21EC001   | Arjun Verma     | arjun@example.com      | EC      |
| 2       | Beta Squad  | active | 1RV21EC002   | Neha Kapoor     | neha@example.com       | EC      |
```
---

### 2. **Get Projects with Phase Marks by Team**

**SQL Query:**

```sql
SELECT p.project_id, p.title, p.domain, p.phase1_marks, p.phase2_marks, p.marks,
       t.team_id, t.team_name
FROM project p
JOIN team t ON p.team_id = t.team_id
ORDER BY p.phase1_marks DESC, p.phase2_marks DESC;
```

**Sample Output:**

```
| project_id | title              | domain        | phase1_marks | phase2_marks | marks | team_id | team_name   |
|------------|-------------------|---------------|--------------|--------------|-------|---------|------------|
| 101        | AI Chatbot         | AI            | 95           | 87           | 91    | 1       | Alpha Team |
| 104        | Web Dashboard      | Web Dev       | 80           | 78           | 79    | 4       | Delta Crew |
```
---

### 3. **Search Faculty by Name/Email/Designation**

**SQL Query:**

```sql
SELECT faculty_id, name, email, designation, dept_id
FROM faculty
WHERE LOWER(name) LIKE ?
   OR LOWER(email) LIKE ?
   OR LOWER(designation) LIKE ?
ORDER BY name;
```

**Example Call:** Search for "Prof"
**Sample Output:**

```
| faculty_id | name              | email              | designation      | dept_id |
|------------|-------------------|-------------------|------------------|---------|
| 201        | Dr. Amit Sharma   | amit@college.edu   | Professor        | CSE     |
| 202        | Prof. Rajesh Patel| rajesh@college.edu | Associate Prof   | ECE     |
```
---
### 4. **Get Students by Semester and Department**

**SQL Query:**

```sql
SELECT s.usn, s.name, s.email, s.sem, s.dept_id,
       s.github, d.dept_name, c.cluster_id, c.cluster_name
FROM student s
JOIN department d ON s.dept_id = d.dept_id
JOIN cluster c ON d.cluster_id = c.cluster_id
WHERE s.sem = ? AND c.cluster_id = ?
ORDER BY s.sem, s.name;
```
**Example Call:** sem=4, cluster='CSE'

**Sample Output:**

```
| usn        | name           | email              | sem | dept_id | github               | dept_name | cluster_id |
|------------|----------------|-------------------|-----|---------|----------------------|-----------|-----------|
| 1RV21CS001 | Raj Kumar      | raj@example.com    | 4   | CS      | github.com/raj       | Computer  | CSE       |
| 1RV21CS045 | Priya Sharma   | priya@example.com  | 4   | CS      | github.com/priya     | Computer  | CSE       |
| 1RV21AI003 | Vikram Singh   | vikram@example.com | 4   | AI      | github.com/vikram    | AI Branch | CSE       |
```
---
### 5. **Get Mentor-Team Associations with Faculty Details**

**SQL Query:**

```sql
SELECT f.faculty_id, f.name, f.email, f.designation, f.dept_id,
       t.team_id, t.team_name, t.status
FROM mentors m
JOIN faculty f ON m.faculty_id = f.faculty_id
JOIN team t ON m.team_id = t.team_id
WHERE f.dept_id = ?
ORDER BY t.team_id, f.name;
```
**Example Call:** dept_id='CSE'

**Sample Output:**

```
| faculty_id | name            | email              | designation    | dept_id | team_id | team_name   | status |
|------------|-----------------|-------------------|----------------|---------|---------|------------|--------|
| 201        | Dr. Amit Sharma | amit@college.edu   | Professor      | CSE     | 1       | Alpha Team | active |
| 203        | Dr. Neha Gupta  | neha@college.edu   | Assistant Prof | CSE     | 1       | Alpha Team | active |
| 201        | Dr. Amit Sharma | amit@college.edu   | Professor      | CSE     | 3       | Gamma Team | active |
```
---

## NOSQ QUERIES

### 1. **Find User by Email (Login Query)**

**MongoDB Query:**

```javascript
db.users.findOne({ email: "raj@example.com" });
```

**Sample Output:**
```json
{
  "_id": ObjectId("65a1b2c3d4e5f6g7h8i9j0k1"),
  "user_id": "USER_001",
  "email": "raj@example.com",
  "name": "Raj Kumar",
  "user_type": "student",
  "password": "$2b$12$...[hashed_password]...",
  "created_at": "2024-01-15T10:30:00Z"
}
```
---

### 2. **Get All Notifications for Students**
**MongoDB Query:**

```javascript
db.notifications
  .find({ target_type: "student" })
  .sort({ created_at: -1 })
  .limit(10);
```
**Sample Output:**

```json
[
  {
    "_id": ObjectId("65a2c3d4e5f6g7h8i9j0k1l1"),
    "message": "Project Phase 1 deadline extended to 25th January",
    "target_type": "student",
    "created_by": "ADMIN_001",
    "created_at": "2024-01-22T14:30:00Z"
  },
  {
    "_id": ObjectId("65a2c3d4e5f6g7h8i9j0k1l3"),
    "message": "Faculty meeting scheduled for 24th January at 3 PM",
    "target_type": "student",
    "created_by": "ADMIN_001",
    "created_at": "2024-01-18T16:45:00Z"
  }
]
```
---
### 3. **Check if User Email Exists**
**MongoDB Query:**

```javascript
db.users.findOne({ email: "newuser@example.com" });
```

**Sample Output - User Exists:**

```json
{
  "_id": ObjectId("65a1b2c3d4e5f6g7h8i9j0k1"),
  "user_id": "USER_001",
  "email": "newuser@example.com",
  "name": "John Doe",
  "user_type": "faculty"
}
```
---

### 4. **Create New Notification Document**

**MongoDB Query (Insert):**

```javascript
db.notifications.insertOne({
  message: "Team project submissions are now open",
  target_type: "student",
  created_by: "ADMIN_003",
  created_at: new Date("2024-01-22T10:00:00Z"),
});
```

**Sample Output:**

```json
{
  "acknowledged": true,
  "insertedId": ObjectId("65a2c3d4e5f6g7h8i9j0k2m1")
}
```
---

### 5. **Delete Notification by ID**

**MongoDB Query (Delete):**

```javascript
db.notifications.deleteOne({ _id: ObjectId("65a2c3d4e5f6g7h8i9j0k1l1") });
```

**Sample Output:**

```json
{
  "acknowledged": true,
  "deletedCount": 1
}
```
