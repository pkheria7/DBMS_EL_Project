import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users as UsersIcon, 
  BookOpen, 
  Hash,
  Building,
  Mail,
  Award
} from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';
import SimilarProjects from '../components/SimilarProjects';

const TeamReview = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(null); // 'phase1' or 'phase2'
  const [phase1Marks, setPhase1Marks] = useState('');
  const [phase2Marks, setPhase2Marks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  const checkIfArchived = async (projectId) => {
    try {
      const response = await client.get('/archives/');
      const archives = response.data || [];
      const archived = archives.some(archive => archive.project_id === projectId);
      setIsArchived(archived);
    } catch (error) {
      console.error('Error checking archive status:', error);
    }
  };

  const fetchTeamDetails = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await client.get(`/faculty/${userId}/teams`);
      const teams = response.data || [];
      const teamData = teams.find(t => t.team_id === parseInt(teamId));
      
      if (teamData) {
        setTeam(teamData);
        
        // Always try to fetch project separately to get complete marks data
        try {
          const projectResponse = await client.get(`/projects/team/${teamId}`);
          const projectData = projectResponse.data;
          setProject(projectData);
          
          // Check if project is archived
          checkIfArchived(projectData.project_id);
          
          // Pre-fill marks if already graded
          if (projectData.phase1_marks !== null && projectData.phase1_marks !== undefined) {
            setPhase1Marks(projectData.phase1_marks.toString());
          }
          if (projectData.phase2_marks !== null && projectData.phase2_marks !== undefined) {
            setPhase2Marks(projectData.phase2_marks.toString());
          }
        } catch (err) {
          console.log('No project found for this team');
          // Fallback to team project data if available
          if (teamData.project) {
            setProject(teamData.project);
            checkIfArchived(teamData.project.project_id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      toast.error('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMarks = async (phase) => {
    const marks = phase === 'phase1' ? phase1Marks : phase2Marks;
    
    if (!marks || isNaN(marks)) {
      toast.error('Please enter valid marks');
      return;
    }

    const marksValue = parseInt(marks);
    if (marksValue < 0 || marksValue > 100) {
      toast.error('Marks must be between 0 and 100');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = phase === 'phase1' 
        ? `/projects/phase1/${project.project_id}?marks=${marksValue}`
        : `/projects/phase2/${project.project_id}?marks=${marksValue}`;
      
      const response = await client.put(endpoint);
      
      if (response.status === 200) {
        toast.success(`${phase === 'phase1' ? 'Phase 1' : 'Phase 2'} marks submitted successfully!`);
        setProject(response.data);
        setActivePhase(null);
        // Refresh team details
        fetchTeamDetails();
      }
    } catch (error) {
      console.error('Error submitting marks:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit marks');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!project) return;

    const confirmArchive = window.confirm(
      'Are you sure you want to archive this project? This action will mark the project as completed and move it to archives.'
    );

    if (!confirmArchive) return;

    setArchiving(true);
    try {
      const response = await client.post(`/projects/${project.project_id}/archive`);
      
      if (response.status === 201) {
        toast.success('Project archived successfully!');
        // Update archive status
        setIsArchived(true);
        // Refresh to get updated project status
        fetchTeamDetails();
      }
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error(error.response?.data?.detail || 'Failed to archive project');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading team details...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Team not found</div>
          <button
            onClick={() => navigate('/faculty-dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Team Review</h1>
              <p className="text-slate-400 text-sm">{team.team_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Team Information Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-blue-400" />
            Team Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Hash className="w-4 h-4" />
                <span>Team ID</span>
              </div>
              <p className="text-white font-medium text-lg">{team.team_id}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <UsersIcon className="w-4 h-4" />
                <span>Team Name</span>
              </div>
              <p className="text-white font-medium text-lg">{team.team_name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Building className="w-4 h-4" />
                <span>Cluster</span>
              </div>
              <p className="text-white font-medium text-lg">{team.cluster || 'N/A'}</p>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-blue-400" />
              Team Members ({team.members?.length || 0})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {team.members?.map((member) => (
                <div 
                  key={member.usn}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <p className="text-white font-medium">{member.name}</p>
                  <p className="text-slate-400 text-sm">{member.usn}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <p className="text-slate-500 text-xs break-all">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Information Card */}
        {project ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              Project Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <div className="text-slate-400 text-sm">Project Title</div>
                <p className="text-white font-medium text-lg">{project.title}</p>
              </div>

              <div className="space-y-2">
                <div className="text-slate-400 text-sm">Domain</div>
                <p className="text-white font-medium text-lg">{project.domain || 'N/A'}</p>
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="text-slate-400 text-sm">Abstract</div>
                <p className="text-white">{project.abstract || 'No abstract provided'}</p>
              </div>

              {/* Similar Projects - shown when title and abstract exist */}
              {project.title && project.abstract && (
                <div className="md:col-span-2">
                  <SimilarProjects 
                    title={project.title}
                    abstract={project.abstract}
                  />
                </div>
              )}

              <div className="md:col-span-2 space-y-2">
                <div className="text-slate-400 text-sm">Drive Link (Report + PPT + Demo)</div>
                {project.report_link ? (
                  <a
                    href={project.report_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    View Project Files
                  </a>
                ) : (
                  <p className="text-slate-500">No link provided</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="text-slate-400 text-sm font-semibold mb-3">Marks Breakdown</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Phase 1 Marks */}
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-400 text-sm">Phase 1 Marks</span>
                    </div>
                    <p className="text-white font-bold text-2xl">
                      {project.phase1_marks !== null && project.phase1_marks !== undefined 
                        ? `${project.phase1_marks} / 100` 
                        : 'Not graded'}
                    </p>
                  </div>

                  {/* Phase 2 Marks */}
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-green-400" />
                      <span className="text-slate-400 text-sm">Phase 2 Marks</span>
                    </div>
                    <p className="text-white font-bold text-2xl">
                      {project.phase2_marks !== null && project.phase2_marks !== undefined 
                        ? `${project.phase2_marks} / 100` 
                        : 'Not graded'}
                    </p>
                  </div>

                  {/* Final Marks */}
                  <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm font-semibold">Final Marks</span>
                    </div>
                    <p className="text-white font-bold text-2xl mb-1">
                      {project.marks !== null && project.marks !== undefined 
                        ? `${project.marks} / 100` 
                        : 'Not graded'}
                    </p>
                    <p className="text-slate-400 text-xs">
                      (40% P1 + 60% P2)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-6 text-center">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No project submitted yet</p>
          </div>
        )}

        {/* Archive Project Button or Archived Status */}
        {project && project.marks !== null && project.marks !== undefined && (
          <>
            {isArchived ? (
              <div className="bg-gradient-to-br from-green-800/30 to-green-700/30 rounded-2xl border border-green-600/50 p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                    <Award className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-400 mb-1">Project Archived</h3>
                    <p className="text-green-300/80 text-sm">
                      This project has been successfully archived and marked as completed.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl border border-slate-600 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Archive Project</h3>
                    <p className="text-slate-400 text-sm">
                      Project is fully graded. You can archive it to mark as completed and move it to the archives section.
                    </p>
                  </div>
                  <button
                    onClick={handleArchiveProject}
                    disabled={archiving}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    {archiving ? 'Archiving...' : 'Archive Project'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Review Phase Buttons */}
        {project && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phase 1 Review */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Phase 1 Submission</h3>
              {activePhase === 'phase1' ? (
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-300 text-sm mb-2">Project Title:</p>
                    <p className="text-white font-medium">{project.title}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-300 text-sm mb-2">Domain:</p>
                    <p className="text-white font-medium">{project.domain || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-300 text-sm mb-2">Abstract:</p>
                    <p className="text-white">{project.abstract || 'No abstract'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-300 text-sm mb-2">Report Link:</p>
                    {project.report_link ? (
                      <a
                        href={project.report_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 break-all"
                      >
                        {project.report_link}
                      </a>
                    ) : (
                      <p className="text-slate-500">No link</p>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className="block text-slate-300 text-sm mb-2">
                      Enter Phase 1 Marks (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={phase1Marks}
                      onChange={(e) => setPhase1Marks(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter marks"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSubmitMarks('phase1')}
                      disabled={submitting}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-medium transition-all"
                    >
                      {submitting ? 'Submitting...' : 'Submit Phase 1 Marks'}
                    </button>
                    <button
                      onClick={() => setActivePhase(null)}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActivePhase('phase1')}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all"
                >
                  Review Phase 1 Submission
                </button>
              )}
            </div>

            {/* Phase 2 Review */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Phase 2 Submission</h3>
              {activePhase === 'phase2' ? (
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-300 text-sm mb-2">Project Title:</p>
                    <p className="text-white font-medium">{project.title}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-300 text-sm mb-2">Updated Abstract:</p>
                    <p className="text-white">{project.abstract || 'No abstract'}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-300 text-sm mb-2">Drive Link (Report + PPT + Demo):</p>
                    {project.report_link ? (
                      <a
                        href={project.report_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 break-all"
                      >
                        {project.report_link}
                      </a>
                    ) : (
                      <p className="text-slate-500">No link</p>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className="block text-slate-300 text-sm mb-2">
                      Enter Phase 2 Marks (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={phase2Marks}
                      onChange={(e) => setPhase2Marks(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter marks"
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <p className="text-blue-400 text-sm">
                      ℹ️ Final marks will be calculated as: (Phase 1 × 40%) + (Phase 2 × 60%)
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSubmitMarks('phase2')}
                      disabled={submitting}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-medium transition-all"
                    >
                      {submitting ? 'Submitting...' : 'Submit Phase 2 Marks'}
                    </button>
                    <button
                      onClick={() => setActivePhase(null)}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActivePhase('phase2')}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all"
                >
                  Review Phase 2 Submission
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamReview;
