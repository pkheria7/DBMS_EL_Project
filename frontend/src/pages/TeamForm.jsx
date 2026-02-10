import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

const TeamForm = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Check authentication and fetch current student details on mount
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const userId = localStorage.getItem('userId');
    
    if (!userType || userType !== 'student') {
      navigate('/login');
      return;
    }

    // Fetch current student details to get semester and cluster
    const fetchCurrentStudent = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await client.get(`/students/search?query=${user.email}`);
        if (response.data && response.data.length > 0) {
          const studentData = response.data.find(s => s.email === user.email) || response.data[0];
          
          // Try to fetch team information using student's USN
          try {
            const teamResponse = await client.get(`/teams/my-team?usn=${studentData.usn}`);
            // API returns an array, get the first team
            if (teamResponse.data && Array.isArray(teamResponse.data) && teamResponse.data.length > 0) {
              const teamData = teamResponse.data[0];
              studentData.team_id = teamData.team_id;
              studentData.is_in_active_team = true;
              studentData.team_name = teamData.team_name;
              studentData.team_status = teamData.status;
            }
          } catch (teamError) {
            // No team found or error fetching team (404 is expected if no team)
            if (teamError.response?.status !== 404) {
              console.error('Error fetching team:', teamError);
            }
          }
          
          setCurrentStudent(studentData);
          // Add current student as default member only if they don't have a team
          if (!studentData.team_id && !studentData.is_in_active_team) {
            setSelectedMembers([studentData]);
          }
        }
      } catch (error) {
        console.error('Error fetching current student:', error);
        toast.error('Failed to load student details');
      } finally {
        setIsLoadingStudent(false);
      }
    };

    fetchCurrentStudent();
  }, [navigate]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Don't search if student details not loaded yet
    if (!currentStudent || !currentStudent.sem || !currentStudent.cluster) {
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const payload = {
          sem: currentStudent.sem,
          cluster: currentStudent.cluster,
          query: searchQuery.trim()
        };
        
        const response = await client.post('/students/no-team', payload);
        setSearchResults(response.data || []);
        setShowDropdown(true);
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error('Failed to search students');
        }
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, currentStudent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleAddMember = (student) => {
    if (selectedMembers.length >= 5) {
      toast.error('Maximum 5 members allowed');
      return;
    }

    // Use USN for deduplication (unique identifier)
    if (selectedMembers.some(m => m.usn === student.usn)) {
      toast.error('Student already added');
      return;
    }

    setSelectedMembers([...selectedMembers, student]);
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleRemoveMember = (usn) => {
    setSelectedMembers(selectedMembers.filter(m => m.usn !== usn));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedMembers.length < 4) {
      toast.error('Please select at least 4 members');
      return;
    }

    if (selectedMembers.length > 5) {
      toast.error('Maximum 5 members allowed');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        team_name: teamName,
        member_usns: selectedMembers.map(m => m.usn),
      };

      const response = await client.post('/teams/form', payload);

      if (response.status === 201) {
        // Update current student with team information
        if (response.data && response.data.team_id) {
          setCurrentStudent(prev => ({
            ...prev,
            team_id: response.data.team_id,
            is_in_active_team: true
          }));
          toast.success(`Team created successfully! Team ID: ${response.data.team_id}`);
        } else {
          toast.success('Team created successfully');
        }
        
        // Reset form
        setTeamName('');
        setSelectedMembers([]);
        setSearchQuery('');
        setSearchResults([]);
        
        // Redirect to student dashboard after a short delay
        setTimeout(() => {
          navigate('/student-dashboard');
        }, 1500);
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const errorMessage = error.response.data?.detail || 'Validation error';
        toast.error(errorMessage);
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to create team. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Back Button */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/student-dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Form Team</h1>
              <p className="text-slate-400 text-sm">Create your project team</p>
            </div>
          </div>
        </div>
      </div>

      {isLoadingStudent ? (
        <div className="pt-12 pb-12 px-4 flex justify-center items-center min-h-[60vh]">
          <div className="text-white text-xl">Loading...</div>
        </div>
      ) : !currentStudent || !currentStudent.sem || !currentStudent.cluster ? (
        <div className="pt-12 pb-12 px-4 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-white text-xl mb-4">Unable to load student information</p>
            <p className="text-slate-400">Please make sure your profile has semester and cluster information.</p>
            <button
              onClick={() => navigate('/student-dashboard')}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : currentStudent.team_id || currentStudent.is_in_active_team ? (
        <div className="pt-12 pb-12 px-4 flex justify-center items-center min-h-[60vh]">
          <div className="w-full max-w-2xl">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                You're Already in a Team!
              </h2>
              <p className="text-slate-300 text-lg mb-6">
                You are currently part of an active team. Each student can only be in one team at a time.
              </p>
              <div className="bg-slate-700/50 rounded-lg p-6 mb-6">
                <div className="text-slate-400 text-sm mb-2">Your Team ID</div>
                <div className="text-white text-2xl font-bold">Team {currentStudent.team_id}</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/student-dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
              <p className="text-slate-400 text-sm mt-6">
                If you need to make changes to your team, please contact your faculty mentor or administrator.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-12 pb-12 px-4 flex justify-center items-center">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  Form Your Team
                </span>
              </h1>
              <p className="text-lg text-slate-300">
                Create a team of 4-5 members to collaborate on your project
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Team Details
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Team Name */}
                <div className="mb-6">
                  <label htmlFor="teamname" className="block text-sm font-medium text-slate-300 mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    id="teamname"
                    name="teamname"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                    placeholder="Enter your team name"
                  />
                </div>

                {/* Search Members */}
                <div className="mb-6 relative" ref={dropdownRef}>
                  <label htmlFor="search" className="block text-sm font-medium text-slate-300 mb-2">
                    Search & Add Members (4-5 required, including you)
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    Showing students from {currentStudent.cluster} cluster, Semester {currentStudent.sem}, without a team
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, USN, or ID..."
                      disabled={selectedMembers.length >= 5}
                      className={`w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base ${
                        selectedMembers.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  )}
                  </div>

                  {/* Dropdown Results */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-64 overflow-y-auto z-10">
                      {searchResults.map((student) => {
                        // Use USN for deduplication check
                        const isSelected = selectedMembers.some(m => m.usn === student.usn);
                        return (
                          <div
                            key={student.usn}
                            onClick={() => !isSelected && handleAddMember(student)}
                            className={`p-3 border-b border-slate-600 last:border-b-0 transition-colors ${
                              isSelected 
                                ? 'bg-slate-600 cursor-not-allowed opacity-60'
                                : 'cursor-pointer hover:bg-slate-600'
                            }`}
                          >
                            <div className="font-medium text-white text-base">
                              {student.name}
                            </div>
                            <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                              <span>{student.usn}</span>
                              {student.dept_id && (
                                <>
                                  <span>•</span>
                                  <span>{student.dept_id}</span>
                                </>
                              )}
                              {isSelected && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-400">✓ Added</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Members Chips */}
                {selectedMembers.length > 0 && (
                  <div className="mb-6">
                    <div className="text-sm font-medium text-slate-300 mb-3">
                      Selected Members ({selectedMembers.length}/5)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((member) => {
                        const isCurrentStudent = member.usn === currentStudent?.usn;
                        return (
                          <div
                            key={member.usn}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium ${
                              isCurrentStudent 
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                            }`}
                          >
                            <span>{member.name} {isCurrentStudent && '(You)'}</span>
                            {!isCurrentStudent && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member.usn)}
                                className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/20 transition-colors"
                              >
                                <span className="text-lg leading-none">×</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || selectedMembers.length < 4 || selectedMembers.length > 5}
                  className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                    isSubmitting || selectedMembers.length < 4 || selectedMembers.length > 5
                      ? 'bg-slate-600 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  } text-white`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Creating Team…</span>
                    </>
                  ) : (
                    'Create Team'
                  )}
                </button>

                {/* Helper Text */}
                {selectedMembers.length < 4 && (
                  <p className="mt-4 text-sm text-slate-400 text-center">
                    Please select at least {4 - selectedMembers.length} more member{4 - selectedMembers.length !== 1 ? 's' : ''}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamForm;