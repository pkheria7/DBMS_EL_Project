import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import RegisterStudent from '../pages/RegisterStudent';
import RegisterFaculty from '../pages/RegisterFaculty';
import StudentDashboard from '../pages/StudentDashboard';
import FacultyDashboard from '../pages/FacultyDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import UpdateProfile from '../pages/UpdateProfile';
import UpdateFacultyProfile from '../pages/UpdateFacultyProfile';
import TeamForm from '../pages/TeamForm';
import TeamsList from '../pages/TeamsList';
import TeamReview from '../pages/TeamReview';
import FacultyDetails from '../pages/FacultyDetails';
import SubmitProject from '../pages/SubmitProject';
import ProjectsList from '../pages/ProjectsList';
import ProjectDetails from '../pages/ProjectDetails';
import ArchivesList from '../pages/ArchivesList';
import ArchiveDetails from '../pages/ArchiveDetails';
import StudentNotifications from '../pages/StudentNotifications';
import FacultyNotifications from '../pages/FacultyNotifications';
import TeamInvites from '../pages/TeamInvites';

const App = () => {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register-student" element={<RegisterStudent />} />
        <Route path="/register-faculty" element={<RegisterFaculty />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/update-profile" element={<UpdateProfile />} />
        <Route path="/update-faculty-profile" element={<UpdateFacultyProfile />} />
        <Route path="/form-team" element={<TeamForm />} />
        <Route path="/teams" element={<TeamsList />} />
        <Route path="/team-review/:teamId" element={<TeamReview />} />
        <Route path="/faculty-details/:facultyId" element={<FacultyDetails />} />
        <Route path="/submit-project" element={<SubmitProject />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/archives" element={<ArchivesList />} />
        <Route path="/archives/:id" element={<ArchiveDetails />} />
        <Route path="/student-notifications" element={<StudentNotifications />} />
        <Route path="/faculty-notifications" element={<FacultyNotifications />} />
        <Route path="/team-invites" element={<TeamInvites />} />
      </Routes>
    </Router>
  );
};

export default App;