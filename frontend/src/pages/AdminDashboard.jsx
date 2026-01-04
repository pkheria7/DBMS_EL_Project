import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, LogOut, UserCheck, ArrowLeft, Mail, Phone, Briefcase, Building2, Search, X, Check, User } from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [faculty, setFaculty] = useState([]);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(false);
  const [showTeams, setShowTeams] = useState(false);
  const [showFaculty, setShowFaculty] = useState(false);
  
  // Faculty assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [modalFaculty, setModalFaculty] = useState([]);
  const [isLoadingModalFaculty, setIsLoadingModalFaculty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

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
      const teamsData = response.data || [];
      
      // Fetch all faculty first
      const facultyResponse = await client.get('/faculty/');
      const allFaculty = facultyResponse.data || [];
      
      // For each faculty, get their assigned teams to build a reverse mapping
      const teamToMentorsMap = new Map();
      
      await Promise.all(
        allFaculty.map(async (facultyMember) => {
          try {
            const teamsResponse = await client.get(`/faculty/${facultyMember.faculty_id}/teams`);
            const assignedTeams = teamsResponse.data || [];
            
            // For each team this faculty is assigned to, add them to the map
            assignedTeams.forEach((assignedTeam) => {
              if (!teamToMentorsMap.has(assignedTeam.team_id)) {
                teamToMentorsMap.set(assignedTeam.team_id, []);
              }
              teamToMentorsMap.get(assignedTeam.team_id).push(facultyMember);
            });
          } catch (error) {
            // If 404, this faculty has no teams assigned
            if (error.response?.status !== 404) {
              console.error(`Error fetching teams for faculty ${facultyMember.faculty_id}:`, error);
            }
          }
        })
      );
      
      // Add mentor information to each team
      const teamsWithMentors = teamsData.map(team => ({
        ...team,
        mentors: teamToMentorsMap.get(team.team_id) || []
      }));
      
      setTeams(teamsWithMentors);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleViewFaculty = async () => {
    setShowFaculty(true);
    setShowTeams(false);
    setIsLoadingFaculty(true);
    try {
      const response = await client.get('/faculty/');
      setFaculty(response.data || []);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setFaculty([]);
    } finally {
      setIsLoadingFaculty(false);
    }
  };

  const handleBackToMain = () => {
    setShowTeams(false);
    setShowFaculty(false);
  };

  const handleAssignFaculty = async (teamId) => {
    const team = teams.find(t => t.team_id === teamId);
    if (!team) return;
    
    setSelectedTeam(team);
    setShowAssignModal(true);
    setSelectedFacultyIds([]);
    setSearchQuery('');
    setIsLoadingModalFaculty(true);
    
    try {
      // Load all faculty initially
      const response = await client.get('/faculty/');
      setModalFaculty(response.data || []);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty');
      setModalFaculty([]);
    } finally {
      setIsLoadingModalFaculty(false);
    }
  };

  const handleCloseModal = () => {
    setShowAssignModal(false);
    setSelectedTeam(null);
    setModalFaculty([]);
    setSelectedFacultyIds([]);
    setSearchQuery('');
  };

  const handleSearchFaculty = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // If search is empty, load all faculty
      setIsLoadingModalFaculty(true);
      try {
        const response = await client.get('/faculty/');
        setModalFaculty(response.data || []);
      } catch (error) {
        console.error('Error fetching faculty:', error);
        setModalFaculty([]);
      } finally {
        setIsLoadingModalFaculty(false);
      }
      return;
    }

    setIsLoadingModalFaculty(true);
    try {
      const response = await client.get(`/faculty/search?query=${encodeURIComponent(query)}`);
      setModalFaculty(response.data || []);
    } catch (error) {
      if (error.response?.status === 404) {
        // No results found
        setModalFaculty([]);
      } else {
        console.error('Error searching faculty:', error);
        toast.error('Failed to search faculty');
        setModalFaculty([]);
      }
    } finally {
      setIsLoadingModalFaculty(false);
    }
  };

  const handleToggleFacultySelection = (facultyId) => {
    setSelectedFacultyIds(prev => {
      if (prev.includes(facultyId)) {
        // Deselect
        return prev.filter(id => id !== facultyId);
      } else {
        // Select (max 2)
        if (prev.length >= 2) {
          toast.error('Maximum 2 faculty members can be assigned per team');
          return prev;
        }
        return [...prev, facultyId];
      }
    });
  };

  const handleConfirmAssignment = async () => {
    if (selectedFacultyIds.length !== 2) {
      toast.error('Please select exactly 2 faculty members');
      return;
    }

    if (!selectedTeam) return;

    setIsAssigning(true);
    try {
      // Get faculty names from selected IDs
      const selectedFaculty = modalFaculty.filter(f => selectedFacultyIds.includes(f.faculty_id));
      const facultyNames = selectedFaculty.map(f => f.name);

      // Call the assignment endpoint
      const response = await client.post('/mentors/assign', {
        team_name: selectedTeam.team_name,
        faculty_names: facultyNames
      });

      toast.success('Faculty assigned successfully!');
      handleCloseModal();
      
      // Refresh teams to show updated assignments
      handleViewTeams();
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to assign faculty');
      }
      console.error('Error assigning faculty:', error);
    } finally {
      setIsAssigning(false);
    }
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
            {/* Faculty List View */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  All Faculty Members
                </span>
              </h1>
              <p className="text-lg text-slate-300">
                View and manage all registered faculty members
              </p>
            </div>

            {isLoadingFaculty ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-white text-lg">Loading faculty...</p>
              </div>
            ) : faculty.length === 0 ? (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-300 text-lg">
                  No faculty members found in the system.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {faculty.map((facultyMember) => (
                  <div
                    key={facultyMember.faculty_id}
                    onClick={() => navigate(`/faculty-details/${facultyMember.faculty_id}`)}
                    className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-slate-600 relative overflow-hidden cursor-pointer"
                  >
                    {/* Faculty Name */}
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                      {facultyMember.name}
                    </h3>

                    {/* Designation */}
                    {facultyMember.designation && (
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{facultyMember.designation}</span>
                      </div>
                    )}

                    {/* Department */}
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 font-medium">Department:</span>
                      <span className="text-slate-200">{facultyMember.dept_id || 'N/A'}</span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 truncate">{facultyMember.email}</span>
                    </div>

                    {/* Phone Number */}
                    {facultyMember.ph_no && (
                      <div className="flex items-center gap-2 text-sm mb-4">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{facultyMember.ph_no}</span>
                      </div>
                    )}

                    {/* Faculty ID Badge */}
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <span className="text-xs text-slate-500 font-medium">
                        ID: {facultyMember.faculty_id}
                      </span>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                ))}
              </div>
            )}
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
                    key={team.team_id}
                    className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-slate-600 relative overflow-hidden"
                  >
                    {/* Team Name */}
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors">
                      {team.team_name || 'Unnamed Team'}
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

                    {/* Assign Faculty Button or Assigned Faculty Display */}
                    {team.mentors && team.mentors.length >= 2 ? (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">Assigned Faculty</span>
                        </div>
                        <div className="space-y-2">
                          {team.mentors.slice(0, 2).map((mentor, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-sm"
                            >
                              <User className="w-4 h-4" />
                              <span className="font-medium">{mentor.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAssignFaculty(team.team_id)}
                        className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Assign Faculty
                      </button>
                    )}

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Faculty Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-white">Assign Faculty Mentors</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedTeam && `Team: ${selectedTeam.team_name}`}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, designation, or ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearchFaculty(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-slate-400">Selected:</span>
                <span className={`font-medium ${selectedFacultyIds.length === 2 ? 'text-green-400' : 'text-slate-300'}`}>
                  {selectedFacultyIds.length}/2
                </span>
                {selectedFacultyIds.length === 2 && (
                  <span className="text-green-400 text-xs">(Maximum reached)</span>
                )}
              </div>
            </div>

            {/* Faculty List */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingModalFaculty ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                  <p className="text-slate-400">Loading faculty...</p>
                </div>
              ) : modalFaculty.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-slate-400">
                    {searchQuery ? 'No faculty found matching your search' : 'No faculty available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modalFaculty.map((facultyMember) => {
                    const isSelected = selectedFacultyIds.includes(facultyMember.faculty_id);
                    const isDisabled = !isSelected && selectedFacultyIds.length >= 2;
                    
                    return (
                      <div
                        key={facultyMember.faculty_id}
                        onClick={() => !isDisabled && handleToggleFacultySelection(facultyMember.faculty_id)}
                        className={`
                          p-4 rounded-lg border transition-all cursor-pointer
                          ${isSelected 
                            ? 'bg-indigo-500/20 border-indigo-500' 
                            : isDisabled
                            ? 'bg-slate-700/50 border-slate-600 opacity-50 cursor-not-allowed'
                            : 'bg-slate-700 border-slate-600 hover:border-slate-500 hover:bg-slate-600'
                          }
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`
                            w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                            ${isSelected 
                              ? 'bg-indigo-500 border-indigo-500' 
                              : 'border-slate-500'
                            }
                          `}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{facultyMember.name}</h3>
                              {facultyMember.designation && (
                                <span className="text-xs text-slate-400">• {facultyMember.designation}</span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-slate-300">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{facultyMember.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-300">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span>{facultyMember.dept_id || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-700">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                disabled={isAssigning}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={selectedFacultyIds.length !== 2 || isAssigning}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all
                  ${selectedFacultyIds.length === 2 && !isAssigning
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                {isAssigning ? 'Assigning...' : 'Assign Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;