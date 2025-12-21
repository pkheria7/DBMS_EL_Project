import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import client from '../api/client';

const TeamsList = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (!userType || userType !== 'faculty') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await client.get('/teams');
      setTeams(response.data);
    } catch (error) {
      setErrorMessage('Failed to load teams. Please try again.');
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Back Button */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/faculty-dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Teams</h1>
              <p className="text-slate-400 text-sm">Manage student teams</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              Student Teams
            </span>
          </h1>
          <p className="text-lg text-slate-300">
            View all registered teams and their projects
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded-lg mb-6">
            {errorMessage}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white text-lg">Loading teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">
              No teams found. Students can create teams from their dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div
                key={team.id}
                className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-slate-600 cursor-pointer relative overflow-hidden"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                {/* Project Status Badge */}
                <div className="absolute top-4 right-4">
                  {team.has_project ? (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-900/50 border border-green-700 text-green-200 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      <span>Project</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 bg-red-900/50 border border-red-700 text-red-200 rounded-full text-xs font-medium">
                      <XCircle className="w-3 h-3" />
                      <span>No Project</span>
                    </div>
                  )}
                </div>

                {/* Team Name */}
                <h3 className="text-xl font-bold text-white mb-4 pr-20 group-hover:text-blue-400 transition-colors">
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

                {/* View Button */}
                <div className="mt-auto pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between text-blue-400 group-hover:text-blue-300 font-medium">
                    <span>View Details</span>
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsList;
