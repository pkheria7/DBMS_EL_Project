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
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (!userType || userType !== 'student') {
      navigate('/login');
    }
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

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await client.get(`/students/search?query=${encodeURIComponent(searchQuery)}`);
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
  }, [searchQuery]);

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

    if (selectedMembers.some(m => m.id === student.id)) {
      toast.error('Student already added');
      return;
    }

    setSelectedMembers([...selectedMembers, student]);
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleRemoveMember = (studentId) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== studentId));
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
        toast.success('Team created successfully');
        
        // Reset form
        setTeamName('');
        setSelectedMembers([]);
        setSearchQuery('');
        setSearchResults([]);
        
        // Redirect to student dashboard after a short delay
        setTimeout(() => {
          navigate('/student-dashboard');
        }, 1000);
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
                  Search & Add Members (4-5 required)
                </label>
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
                      const isSelected = selectedMembers.some(m => m.id === student.id);
                      return (
                        <div
                          key={student.id}
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
                            <span>•</span>
                            <span>{student.id}</span>
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
                    {selectedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full text-white text-sm font-medium"
                      >
                        <span>{member.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/20 transition-colors"
                        >
                          <span className="text-lg leading-none">×</span>
                        </button>
                      </div>
                    ))}
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
    </div>
  );
};

export default TeamForm;