import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';
import SimilarProjects from '../components/SimilarProjects';

const SubmitProject = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'view' or 'phase2'
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [existingProject, setExistingProject] = useState(null);
  const [isPhase2, setIsPhase2] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [formData, setFormData] = useState({
    team_id: '',
    title: '',
    abstract: '',
    domain: '',
    report_link: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (!userType || userType !== 'student') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch teams on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Get the logged-in student's USN
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('User not authenticated');
          navigate('/login');
          return;
        }

        // Fetch only the student's team
        const response = await client.get(`/teams/my-team?usn=${encodeURIComponent(userId)}`);
        const fetchedTeams = response.data || [];
        setTeams(fetchedTeams);
        
        // Auto-select the team if there's exactly one team
        if (fetchedTeams.length === 1) {
          setFormData(prev => ({
            ...prev,
            team_id: fetchedTeams[0].team_id.toString()
          }));
          // Check if the team already has a project
          await fetchTeamProject(fetchedTeams[0].team_id);
        }
      } catch (error) {
        // If student has no team, response will be empty array (not an error)
        if (error.response?.status === 404 || error.response?.status === 400) {
          setTeams([]);
        } else {
          toast.error('Failed to load teams');
          console.error('Error fetching teams:', error);
        }
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [navigate]);

  // Fetch team's existing project
  const fetchTeamProject = async (teamId) => {
    setLoadingProject(true);
    try {
      const response = await client.get(`/projects/team/${teamId}`);
      if (response.data) {
        setExistingProject(response.data);
        
        // Set mode based on URL parameter or default behavior
        if (mode === 'view') {
          setIsViewMode(true);
          setIsPhase2(false);
        } else if (mode === 'phase2') {
          setIsPhase2(true);
          setIsViewMode(false);
        } else {
          // Default: if project exists, assume Phase 2
          setIsPhase2(true);
          setIsViewMode(false);
        }
        
        // Populate form with existing data
        setFormData({
          team_id: teamId.toString(),
          title: response.data.title || '',
          abstract: response.data.abstract || '',
          domain: response.data.domain || '',
          report_link: response.data.report_link || '',
        });
      }
    } catch (error) {
      // If 404, project doesn't exist yet (Phase 1)
      if (error.response?.status === 404) {
        setIsPhase2(false);
        setIsViewMode(false);
        setExistingProject(null);
      } else {
        console.error('Error fetching project:', error);
      }
    } finally {
      setLoadingProject(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If team changes, fetch its project
    if (name === 'team_id' && value) {
      fetchTeamProject(parseInt(value));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.team_id) {
      newErrors.team_id = 'Team is required';
    }

    if (!isPhase2) {
      // Phase 1 validation
      if (!formData.title.trim()) {
        newErrors.title = 'Project title is required';
      }

      if (!formData.domain.trim()) {
        newErrors.domain = 'Domain is required';
      }
    }

    // Abstract validation for both phases
    if (!formData.abstract.trim()) {
      newErrors.abstract = 'Abstract is required';
    }

    // Report link validation for both phases
    if (!formData.report_link.trim()) {
      newErrors.report_link = 'Drive link is required';
    } else if (!formData.report_link.startsWith('http://') && !formData.report_link.startsWith('https://')) {
      newErrors.report_link = 'Drive link must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isPhase2) {
        // Phase 2: Update existing project (only report_link)
        const payload = {
          title: formData.title.trim(),
          abstract: formData.abstract.trim(),
          domain: formData.domain.trim(),
          report_link: formData.report_link.trim(),
          marks: existingProject?.marks || 0,
        };

        const response = await client.put(`/projects/${existingProject.project_id}`, payload);

        if (response.status === 200) {
          toast.success('Project updated successfully! (Phase 2)');
          
          // Redirect to student dashboard after a short delay
          setTimeout(() => {
            navigate('/student-dashboard');
          }, 1000);
        }
      } else {
        // Phase 1: Create new project
        const payload = {
          team_id: parseInt(formData.team_id),
          title: formData.title.trim(),
          abstract: formData.abstract.trim(),
          domain: formData.domain.trim(),
          report_link: formData.report_link.trim(),
        };

        const response = await client.post('/projects/', payload);

        if (response.status === 201) {
          toast.success('Project submitted successfully! (Phase 1)');
          
          // Clear form
          setFormData({
            team_id: '',
            title: '',
            abstract: '',
            domain: '',
            report_link: '',
          });
          setErrors({});
          
          // Redirect to student dashboard after a short delay
          setTimeout(() => {
            navigate('/student-dashboard');
          }, 1000);
        }
      }
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(isPhase2 ? 'Unable to update project' : 'Unable to submit project');
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
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Submit Project</h1>
              <p className="text-slate-400 text-sm">Share your innovative ideas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-12 pb-12 px-4 flex justify-center items-center">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">
                {isViewMode 
                  ? 'Review Phase 1 Submission' 
                  : isPhase2 
                  ? 'Update Your Project (Phase 2)' 
                  : 'Submit Your Project (Phase 1)'}
              </span>
            </h1>
            <p className="text-lg text-slate-300">
              {isViewMode
                ? 'View your Phase 1 project submission details'
                : isPhase2 
                ? 'Update your project report link and documentation' 
                : 'Present your team\'s innovative solution and implementation'}
            </p>
            {isPhase2 && !isViewMode && (
              <div className="mt-4 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg inline-block">
                <p className="text-blue-400 text-sm">
                  📝 Phase 2: You can update the abstract and drive link. Title and domain are locked.
                </p>
              </div>
            )}
            {isViewMode && (
              <div className="mt-4 px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg inline-block">
                <p className="text-purple-400 text-sm">
                  👁️ View Mode: All fields are read-only. This is your Phase 1 submission.
                </p>
              </div>
            )}
          </div>

          {/* Form Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {isViewMode ? 'Phase 1 Project Details' : isPhase2 ? 'Update Project Details' : 'Project Details'}
            </h2>
            
            {loadingProject ? (
              <div className="text-center py-12">
                <div className="text-white text-lg">Loading project details...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Selection */}
              <div className="md:col-span-2">
                <label htmlFor="team_id" className="block text-sm font-medium text-slate-300 mb-2">
                  Team *
                </label>
                <select
                  id="team_id"
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleChange}
                  disabled={loadingTeams || teams.length === 0 || teams.length === 1}
                  required
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base ${
                    errors.team_id ? 'border-red-500' : 'border-slate-600'
                  } ${(loadingTeams || teams.length === 0 || teams.length === 1) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {loadingTeams ? (
                    <option value="" className="bg-slate-700">Loading teams...</option>
                  ) : teams.length === 0 ? (
                    <option value="" className="bg-slate-700">No team assigned</option>
                  ) : teams.length === 1 ? (
                    <option value={teams[0].team_id} className="bg-slate-700">
                      {teams[0].team_name || `Team ${teams[0].team_id}`}
                    </option>
                  ) : (
                    <>
                      <option value="" className="bg-slate-700">Select a team</option>
                      {teams.map((team) => (
                        <option key={team.team_id} value={team.team_id} className="bg-slate-700">
                          {team.team_name || `Team ${team.team_id}`}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {teams.length === 1 && !loadingTeams && (
                  <div className="text-slate-400 text-sm mt-1">Your team has been automatically selected</div>
                )}
                {errors.team_id && <div className="text-red-400 text-sm mt-1">{errors.team_id}</div>}
              </div>

              {/* Project Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                  Project Title * {(isPhase2 || isViewMode) && <span className="text-slate-500 text-xs">(Read-only)</span>}
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isPhase2 || isViewMode}
                  placeholder="Enter your project title"
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base ${
                    errors.title ? 'border-red-500' : 'border-slate-600'
                  } ${(isPhase2 || isViewMode) ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {errors.title && <div className="text-red-400 text-sm mt-1">{errors.title}</div>}
              </div>

              {/* Abstract */}
              <div className="md:col-span-2">
                <label htmlFor="abstract" className="block text-sm font-medium text-slate-300 mb-2">
                  Abstract * {isViewMode ? <span className="text-slate-500 text-xs">(Read-only)</span> : isPhase2 && <span className="text-green-400 text-xs">(Editable)</span>}
                </label>
                <textarea
                  id="abstract"
                  name="abstract"
                  value={formData.abstract}
                  onChange={handleChange}
                  rows={4}
                  required
                  disabled={isViewMode}
                  placeholder="Provide a brief abstract of your project..."
                  className={`w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base resize-vertical ${
                    isViewMode ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                {errors.abstract && <div className="text-red-400 text-sm mt-1">{errors.abstract}</div>}
              </div>

              {/* Similar Projects Component - shows for students editing and faculty reviewing */}
              {formData.title && formData.abstract && (
                <div className="md:col-span-2">
                  <SimilarProjects 
                    title={formData.title}
                    abstract={formData.abstract}
                  />
                </div>
              )}

              {/* Domain */}
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-slate-300 mb-2">
                  Domain * {(isPhase2 || isViewMode) && <span className="text-slate-500 text-xs">(Read-only)</span>}
                </label>
                <input
                  type="text"
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  required
                  disabled={isPhase2 || isViewMode}
                  placeholder="e.g., Web Development, AI/ML"
                  className={`w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base ${
                    (isPhase2 || isViewMode) ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                {errors.domain && <div className="text-red-400 text-sm mt-1">{errors.domain}</div>}
              </div>

              {/* Drive Link */}
              <div>
                <label htmlFor="report_link" className="block text-sm font-medium text-slate-300 mb-2">
                  Drive Link (Report + PPT + Demo) * {isViewMode ? <span className="text-slate-500 text-xs">(Read-only)</span> : isPhase2 && <span className="text-green-400 text-xs">(Editable)</span>}
                </label>
                <input
                  type="url"
                  id="report_link"
                  name="report_link"
                  value={formData.report_link}
                  onChange={handleChange}
                  required
                  disabled={isViewMode}
                  placeholder="https://drive.google.com/..."
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base ${
                    errors.report_link ? 'border-red-500' : 'border-slate-600'
                  } ${isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                <div className="text-slate-400 text-xs mt-1">
                  {isViewMode
                    ? 'This is your submitted drive link'
                    : isPhase2 
                    ? 'Upload your final report (PDF), PPT (presentation), and demo video to Google Drive and paste the folder link here' 
                    : 'Provide a Google Drive link to your project documentation'}
                </div>
                {errors.report_link && <div className="text-red-400 text-sm mt-1">{errors.report_link}</div>}
              </div>

              {/* Submit Button or Back to Dashboard */}
              <div className="md:col-span-2">
                {isViewMode ? (
                  <button
                    type="button"
                    onClick={() => navigate('/student-dashboard')}
                    className="w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-white"
                  >
                    Back to Dashboard
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                      isSubmitting
                        ? 'bg-slate-600 cursor-not-allowed opacity-60'
                        : isPhase2
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    } text-white`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{isPhase2 ? 'Updating...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      isPhase2 ? 'Update Project (Phase 2)' : 'Submit Project (Phase 1)'
                    )}
                  </button>
                )}
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitProject;

