# SkillSync - MERN Stack
## Project Structure
mern-skillsync/
├── backend/                  # Express.js API Server
│   ├── src/
│   │   ├── config/db.js      # MongoDB connection
│   │   ├── middleware/auth.js # JWT auth middleware
│   │   ├── models/
│   │   │   ├── User.js       # User + JobSeekerProfile + CompanyProfile
│   │   │   ├── Job.js        # Job postings
│   │   │   └── Application.js # JobApplication + SavedJob
│   │   ├── routes/
│   │   │   ├── auth.js       # /api/auth (register, login, me)
│   │   │   ├── jobs.js       # /api/jobs (CRUD + AI matching)
│   │   │   ├── applications.js # /api/applications
│   │   │   └── profile.js    # /api/profile
│   │   ├── utils/aiMatcher.js # AI matching logic (port of ai_matcher.py)
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/                 # React App
    ├── public/index.html
    └── src/
        ├── context/AuthContext.jsx  # Global auth state
        ├── components/
        │   ├── Navbar.jsx
        │   └── Common.jsx     # Footer, Messages, helpers
        ├── pages/
        │   ├── Home.jsx
        │   ├── Auth.jsx       # Login + Register
        │   ├── JobList.jsx    # Browse + Search + Filter
        │   ├── JobDetail.jsx  # Job detail + AI match
        │   ├── JobSeeker.jsx  # Apply, My Applications, Saved, Recommendations
        │   ├── JobProvider.jsx # Post Job, My Jobs, Applicants, Find Candidates
        │   └── DashboardProfile.jsx
        ├── styles/main.css    # Exact same UI/UX 
        └── App.jsx            # React Router setup
```
## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env:
# MONGO_URI=mongodb://localhost:27017/skillsync
# JWT_SECRET=your_secret_key_here
# PORT=5000
```

### 3. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# App runs on http://localhost:3000