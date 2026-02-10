# Team Management & Project Archive System

A comprehensive full-stack application for managing student teams, faculty assignments, and project archives with semantic search capabilities. The system uses FastAPI for the backend, React with Vite for the frontend, and combines SQLite, MongoDB, and Qdrant for different data storage needs.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Database Setup & Seeding](#database-setup--seeding)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Workflow](#workflow)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **User Management**: Student and Faculty registration with authentication
- **Team Formation**: Create and manage student teams with mentors
- **Project Management**: Submit, review, and archive projects
- **Faculty Dashboard**: Assign mentors, review projects, manage notifications
- **Student Dashboard**: View team details, submit projects, track progress
- **Semantic Search**: Find similar projects using AI-powered vector search (Qdrant)
- **Notifications**: Real-time notifications for students and faculty
- **Profile Management**: Update user profiles and credentials
- **Archive System**: Browse and search historical projects with similarity detection

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL ORM for relational data
- **SQLite** - Lightweight database for user and team data
- **MongoDB** - NoSQL database for authentication data
- **Qdrant** - Vector database for semantic search
- **Sentence Transformers** - AI model for generating embeddings
- **PyTorch** - Deep learning framework
- **Pydantic** - Data validation
- **Passlib** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM v7** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** and **npm** ([Download](https://nodejs.org/))
- **MongoDB** - Either:
  - MongoDB Atlas (cloud) - Recommended ([Sign up](https://www.mongodb.com/cloud/atlas))
  - MongoDB Community Server (local) ([Download](https://www.mongodb.com/try/download/community))
- **Git** (optional, for cloning)

## 🚀 Installation

### 1. Clone the Repository (or navigate to your project)

```bash
cd /Users/prajwal_t_a/Desktop/Coding/DBMS_EL_Project
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note**: If you're using a virtual environment (recommended):

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Backend Dependencies Include:
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `sqlalchemy` - ORM
- `pydantic` - Data validation (with email support)
- `pymongo` - MongoDB driver
- `qdrant-client` - Vector database client
- `sentence-transformers` - AI embeddings
- `torch` - Deep learning
- `passlib[bcrypt]` - Password hashing
- `python-multipart` - Form data handling
- `python-dotenv` - Environment variables
- `email-validator` - Email validation
- `jinja2` - Template engine
- `psycopg2-binary` - PostgreSQL adapter
- `numpy` - Numerical computing
- `scikit-learn` - Machine learning utilities
- `requests` - HTTP library

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

Add the following environment variables to `.env`:

```env
# MongoDB Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# Or for local MongoDB:
# MONGODB_URL=mongodb://localhost:27017/

# Database Name (default: teamsync_auth)
DATABASE_NAME=teamsync_auth

# Optional: Add other configuration as needed
```

**Important**: Replace `username` and `password` with your actual MongoDB credentials.

#### Setting up MongoDB Atlas (Cloud):

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Paste into `.env` file

#### Using Local MongoDB:

If using local MongoDB:
```bash
# Start MongoDB service
# On macOS with Homebrew:
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod

# Use this in .env:
MONGODB_URL=mongodb://localhost:27017/
```

### Frontend Configuration

The frontend is configured to connect to the backend at `http://localhost:8000`. If you need to change this, update the `baseURL` in [frontend/src/api/client.js](frontend/src/api/client.js).

## 🏃 Running the Application

### Step 1: Start MongoDB (if using local)

```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# MongoDB should start automatically as a service
# Or run: net start MongoDB
```

### Step 2: Start the Backend Server

Open a terminal in the `backend` directory:

```bash
cd backend
uvicorn main:app --reload
```

The backend will start at: **http://localhost:8000**

- API root: http://localhost:8000/
- Interactive API docs (Swagger): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc

### Step 3: Start the Frontend Development Server

Open a **new terminal** in the `frontend` directory:

```bash
cd frontend
npm run dev
```

The frontend will start at: **http://localhost:5173**

Visit http://localhost:5173 in your browser to use the application.

## 🗄️ Database Setup & Seeding

The application uses three databases:

1. **SQLite** (`WHOLE_INFO.db`) - Auto-created for users, teams, projects
2. **MongoDB** - For authentication data (requires setup via .env)
3. **Qdrant** - Auto-created locally for vector embeddings (`qdrant_data/`)

### Initial Database Setup

When you first run the backend, SQLAlchemy will automatically create the SQLite database and tables based on the models.

### Seeding the Database

The backend includes several seed scripts to populate the database with sample data:

```bash
cd backend

# Seed departments
python seed_dept.py

# Seed faculty members
python seed_faculty.py

# Seed students
python seed_students.py

# Seed mentors
python seed_mentor.py

# Seed teams
python seed_teams.py

# Seed projects
python seed_project.py
```

**Run these in order** to ensure foreign key relationships are maintained.

### Database Migrations

If you need to modify the database schema:

```bash
# Example migration scripts included:
python migrate_add_project_id.py
python migrate_phase_marks.py
```

## 📁 Project Structure

```
DBMS_EL_Project/
│
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── models.py               # SQLAlchemy models (tables)
│   ├── schemas.py              # Pydantic schemas (validation)
│   ├── database.py             # SQLite database configuration
│   ├── mongodb.py              # MongoDB connection setup
│   ├── semantic_search.py      # Qdrant vector search service
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (create this)
│   │
│   ├── router/                 # API route handlers
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── student.py         # Student CRUD operations
│   │   ├── student_get.py     # Student retrieval endpoints
│   │   ├── faculty.py         # Faculty operations
│   │   ├── mentor.py          # Mentor assignment
│   │   ├── teams.py           # Team creation/management
│   │   ├── team_get.py        # Team retrieval endpoints
│   │   ├── projects.py        # Project submission/review
│   │   ├── archives.py        # Archive browsing & search
│   │   ├── notifications.py   # Notification system
│   │   ├── profile_update.py  # Profile update endpoints
│   │   └── __init__.py
│   │
│   ├── seed_dept.py           # Seed departments
│   ├── seed_faculty.py        # Seed faculty members
│   ├── seed_students.py       # Seed students
│   ├── seed_mentor.py         # Seed mentors
│   ├── seed_teams.py          # Seed teams
│   ├── seed_project.py        # Seed projects
│   ├── migrate_add_project_id.py   # Migration: add project IDs
│   ├── migrate_phase_marks.py      # Migration: phase marks
│   ├── WHOLE_INFO.db          # SQLite database (auto-generated)
│   ├── qdrant_data/           # Qdrant vector storage (auto-generated)
│   └── venv/                  # Virtual environment (if created)
│
└── frontend/
    ├── src/
    │   ├── main.jsx           # React application entry
    │   ├── index.css          # Global styles
    │   ├── theme.js           # Theme configuration
    │   │
    │   ├── components/
    │   │   ├── App.jsx        # Main app component with routing
    │   │   ├── Navbar.jsx     # Navigation bar
    │   │   └── SimilarProjects.jsx  # Semantic search results
    │   │
    │   ├── pages/             # Page components
    │   │   ├── Home.jsx              # Landing page
    │   │   ├── Login.jsx             # Login page
    │   │   ├── Signup.jsx            # Registration selector
    │   │   ├── RegisterStudent.jsx   # Student registration
    │   │   ├── RegisterFaculty.jsx   # Faculty registration
    │   │   ├── StudentDashboard.jsx  # Student main page
    │   │   ├── FacultyDashboard.jsx  # Faculty main page
    │   │   ├── AdminDashboard.jsx    # Admin panel
    │   │   ├── TeamForm.jsx          # Create team
    │   │   ├── TeamsList.jsx         # View teams
    │   │   ├── TeamReview.jsx        # Review teams
    │   │   ├── SubmitProject.jsx     # Project submission
    │   │   ├── ProjectsList.jsx      # Browse projects
    │   │   ├── ProjectDetails.jsx    # Project details
    │   │   ├── ArchivesList.jsx      # Browse archives
    │   │   ├── ArchiveDetails.jsx    # Archive details + similar projects
    │   │   ├── FacultyDetails.jsx    # Faculty details page
    │   │   ├── FacultyNotifications.jsx    # Faculty notifications
    │   │   ├── StudentNotifications.jsx    # Student notifications
    │   │   ├── UpdateProfile.jsx     # Update student profile
    │   │   └── UpdateFacultyProfile.jsx    # Update faculty profile
    │   │
    │   └── api/
    │       └── client.js      # Axios HTTP client configuration
    │
    ├── index.html             # HTML entry point
    ├── package.json           # Node.js dependencies
    ├── vite.config.js         # Vite configuration
    ├── tailwind.config.js     # Tailwind CSS config
    └── postcss.config.js      # PostCSS config
```

## 📚 API Documentation

Once the backend is running, visit these URLs for interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main API Endpoints

#### Authentication
- `POST /students/register` - Register a new student
- `POST /faculty/register` - Register a new faculty member
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

#### Students
- `GET /students` - Get all students
- `GET /students/{id}` - Get student by ID
- `POST /students/create` - Create a new student
- `GET /students/dept/{dept_id}` - Get students by department

#### Faculty
- `GET /faculty` - Get all faculty
- `POST /faculty/create` - Create a new faculty member
- `GET /faculty/all` - Get all faculty with details
- `GET /faculty/dept/{dept_id}` - Get faculty by department

#### Teams
- `POST /teams/create` - Create a team
- `GET /teams` - Get all teams
- `GET /teams/my-team` - Get current user's team

#### Mentors
- `POST /mentors/assign` - Assign mentors to a team

#### Projects
- `POST /projects/submit` - Submit a project
- `GET /projects` - Get all projects
- `GET /projects/{project_id}` - Get project by ID
- `GET /projects/team/{team_id}` - Get project by team ID
- `PUT /projects/{project_id}` - Update a project
- `DELETE /projects/{project_id}` - Delete a project
- `POST /projects/{project_id}/archive` - Archive a project
- `PUT /projects/phase1/{project_id}` - Review project phase 1
- `PUT /projects/phase2/{project_id}` - Review project phase 2

#### Archives
- `GET /archives` - Get all archived projects
- `GET /archives/{archive_id}` - Get archive details
- `GET /archives/similar` - Find similar projects (semantic search with query param)

#### Notifications
- `POST /notifications` - Create a notification (admin only)
- `GET /notifications/{target_type}` - Get notifications by target type (student/faculty)
- `DELETE /notifications/{notification_id}` - Delete a notification

#### Profile Updates
- `PUT /profiles/students/{usn}` - Update student profile
- `PUT /profiles/faculty/{faculty_id}` - Update faculty profile

## 🔄 Workflow

### For Students:

1. **Register**: Navigate to Signup → Student Registration
2. **Login**: Use credentials to log in
3. **Create Team**: Form a team with other students
4. **Submit Project**: Upload project details and documentation
5. **View Archive**: Browse past projects and find similar ones
6. **Check Notifications**: Stay updated on team and project status

### For Faculty:

1. **Register**: Navigate to Signup → Faculty Registration
2. **Login**: Use credentials to log in
3. **Assign Mentors**: Assign faculty mentors to student teams
4. **Review Projects**: Evaluate and grade submitted projects
5. **Manage Teams**: Oversee team formations and changes
6. **View Archive**: Browse all projects and archives

### Admin Functions:

1. **Manage Departments**: Add/edit departments
2. **Oversee Users**: Manage students and faculty
3. **System Configuration**: Database seeding and migrations

## 🔍 Semantic Search Feature

The application includes an AI-powered semantic search that finds similar projects based on content similarity:

1. When a project is archived, its content is converted to a vector embedding using the `sentence-transformers/all-MiniLM-L6-v2` model
2. The embedding is stored in Qdrant vector database
3. When viewing an archive, similar projects are automatically found based on semantic similarity
4. This helps students discover related work and avoid duplication

## 🐛 Troubleshooting

### Backend Issues

**"MONGODB_URL environment variable is not set"**
- Ensure `.env` file exists in the `backend` directory
- Check that `MONGODB_URL` is properly set in `.env`

**"Port 8000 already in use"**
```bash
# Find and kill the process using port 8000
lsof -ti:8000 | xargs kill -9
# Or run on a different port
uvicorn main:app --reload --port 8001
```

**"ModuleNotFoundError: No module named..."**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

**MongoDB Connection Issues**
- Verify MongoDB is running (local) or credentials are correct (Atlas)
- Check firewall settings and IP whitelist (MongoDB Atlas)
- Ensure network connectivity

**Qdrant Issues**
- The `qdrant_data` directory is auto-created
- If corrupted, delete the directory and restart the backend

### Frontend Issues

**"Port 5173 already in use"**
```bash
# Kill the process or Vite will auto-select another port
lsof -ti:5173 | xargs kill -9
```

**"Cannot connect to backend"**
- Ensure backend is running on port 8000
- Check CORS settings in [backend/main.py](backend/main.py)
- Verify API client baseURL in [frontend/src/api/client.js](frontend/src/api/client.js)

**"npm install" fails**
```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

**"Database is locked"**
- Only one process should write to SQLite at a time
- Close any database browser tools
- Restart the backend server

**"Foreign key constraint failed"**
- Run seed scripts in the correct order (dept → faculty → students → mentors → teams → projects)
- Check if referenced entities exist before creating dependent entities

## 📝 Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Backend**: Uses `--reload` flag with uvicorn
- **Frontend**: Vite automatically detects changes

### Testing API Endpoints

Use the interactive Swagger UI at http://localhost:8000/docs to test API endpoints without writing code.

### Viewing Databases

**SQLite**:
```bash
# Using sqlite3 CLI
sqlite3 backend/WHOLE_INFO.db
# Then run SQL commands like:
# .tables
# SELECT * FROM students;
```

Or use a GUI tool like:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [TablePlus](https://tableplus.com/)

**MongoDB**:
- MongoDB Compass (GUI tool)
- MongoDB Atlas web interface

### Code Formatting

Consider using:
- **Python**: `black`, `flake8`, `isort`
- **JavaScript**: `prettier`, `eslint`

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is for educational purposes.

## 👥 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Check console logs (browser and terminal)

---

**Happy Coding! 🚀**
