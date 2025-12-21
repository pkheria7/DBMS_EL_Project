import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, LogOut, UserCheck, ArrowLeft } from 'lucide-react';
import client from '../api/client';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [showTeams, setShowTeams] = useState(false);
  const [showFaculty, setShowFaculty] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (!userType || userType !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const handleViewTeams = async () => {
    setShowTeams(true);
    setShowFaculty(false);
    setIsLoadingTeams(true);
    try {
      const response = await client.get('/teams/');
      setTeams(response.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleViewFaculty = () => {
    setShowFaculty(true);
    setShowTeams(false);
    // Dummy function - backend endpoint not created yet
  };

  const handleBackToMain = () => {
    setShowTeams(false);
    setShowFaculty(false);
  };

  const handleAssignFaculty = (teamId) => {
    // Dummy function - backend endpoint not created yet
    console.log('Assign faculty to team:', teamId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Logout */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {(showTeams || showFaculty) && (
              <button
                onClick={handleBackToMain}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600 mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">Manage faculty and teams</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        {!showTeams && !showFaculty ? (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  Admin Portal
                </span>
              </h1>
              <p className="text-lg text-slate-300">
                Manage faculty members and student teams
              </p>
            </div>

            {/* Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Faculty Card */}
              <button
                onClick={handleViewFaculty}
                className="bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-2xl p-12 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">List of All Faculty</h3>
                <p className="text-slate-300 leading-relaxed">
                  View and manage all registered faculty members in the system.
                </p>
                <div className="mt-6 flex items-center text-blue-400 font-medium">
                  <span>View Faculty</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Teams Card */}
              <button
                onClick={handleViewTeams}
                className="bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-2xl p-12 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">List of All Student Teams</h3>
                <p className="text-slate-300 leading-relaxed">
                  View all student teams and assign faculty mentors to teams.
                </p>
                <div className="mt-6 flex items-center text-indigo-400 font-medium">
                  <span>View Teams</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </>
        ) : showFaculty ? (
          <>
            {/* Faculty List View (Dummy) */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  All Faculty Members
                </span>
              </h1>
              <p className="text-lg text-slate-300">
                Backend endpoint not yet created
              </p>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-300 text-lg">
                Faculty list will be displayed here once the backend endpoint is created.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Teams List View */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  All Student Teams
                </span>
              </h1>
              <p className="text-lg text-slate-300">
                Assign faculty mentors to teams
              </p>
            </div>

            {isLoadingTeams ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-white text-lg">Loading teams...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
                <UserCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-300 text-lg">
                  No teams found in the system.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-slate-600 relative overflow-hidden"
                  >
                    {/* Team Name */}
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors">
                      {team.teamname || 'Unnamed Team'}
                    </h3>

                    {/* Cluster & Status */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400 font-medium">Cluster:</span>
                        <span className="text-slate-200">{team.cluster || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400 font-medium">Status:</span>
                        <span className="text-slate-200 capitalize">{team.status || 'Active'}</span>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                        <UserCheck className="w-4 h-4" />
                        <span className="font-medium">Members ({team.members?.length || 0})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {team.members && team.members.length > 0 ? (
                          team.members.map((member, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-slate-700 border border-slate-600 text-slate-300 rounded-full text-xs"
                            >
                              {member.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">No members yet</span>
                        )}
                      </div>
                    </div>

                    {/* Assign Faculty Button */}
                    <button
                      onClick={() => handleAssignFaculty(team.id)}
                      className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Assign Faculty
                    </button>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
