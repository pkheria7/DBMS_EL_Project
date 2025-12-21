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
import TeamForm from '../pages/TeamForm';
import TeamsList from '../pages/TeamsList';
import SubmitProject from '../pages/SubmitProject';
import ProjectsList from '../pages/ProjectsList';
import ProjectDetails from '../pages/ProjectDetails';
import ArchivesList from '../pages/ArchivesList';
import ArchiveDetails from '../pages/ArchiveDetails';

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
        <Route path="/form-team" element={<TeamForm />} />
        <Route path="/teams" element={<TeamsList />} />
        <Route path="/submit-project" element={<SubmitProject />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/archives" element={<ArchivesList />} />
        <Route path="/archives/:id" element={<ArchiveDetails />} />
      </Routes>
    </Router>
  );
};

export default App;