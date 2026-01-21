import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderKanban, Tag, Calendar, Hash, Video, Edit, Archive, FileText } from 'lucide-react';
import client from '../api/client';

const ProjectDetails = () => {
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [archiving, setArchiving] = useState(false);

  // Get project ID from URL
  const projectId = window.location.pathname.split('/').pop();

  // Check authentication on mount
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (!userType || userType !== 'faculty') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (projectId && projectId !== 'projects') {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await client.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      setErrorMessage('Failed to load project details. Please try again.');
      console.error('Error fetching project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this project?')) {
      return;
    }

    setArchiving(true);
    try {
      await client.post(`/projects/${projectId}/archive`);
      setSuccessMessage('Project archived successfully!');
      setTimeout(() => {
        navigate('/archives');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || 'Failed to archive project.');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Back Button */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Project Details</h1>
              <p className="text-slate-400 text-sm">Review and manage project</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-900/50 border border-green-700 text-green-200 px-6 py-4 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

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
            <p className="text-white text-lg">Loading project details...</p>
          </div>
        ) : !project ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
            <FolderKanban className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">Project not found</p>
          </div>
        ) : (
          <>
            {/* Header Card */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-6 shadow-xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {project.title}
              </h1>

              <div className="flex flex-wrap gap-3">
                {project.domain && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500 text-indigo-300 rounded-lg">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium">{project.domain}</span>
                  </div>
                )}
                {project.year && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 text-slate-300 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    <span>{project.year}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-slate-400" />
                Project Information
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Description</span>
                  </div>
                  <p className="text-white text-base leading-relaxed">{project.description || 'No description available'}</p>
                </div>

                {project.team_id && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Hash className="w-4 h-4" />
                      <span>Team ID</span>
                    </div>
                    <p className="text-white text-lg font-medium">{project.team_id}</p>
                  </div>
                )}

                {project.projectid && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Hash className="w-4 h-4" />
                      <span>Project ID</span>
                    </div>
                    <p className="text-white text-lg font-medium">{project.projectid}</p>
                  </div>
                )}

                {project.phase1_marks !== undefined && project.phase1_marks !== null && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Hash className="w-4 h-4" />
                      <span>Phase 1 Marks</span>
                    </div>
                    <p className="text-white text-lg font-medium">{project.phase1_marks}</p>
                  </div>
                )}

                {project.phase2_marks !== undefined && project.phase2_marks !== null && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Hash className="w-4 h-4" />
                      <span>Phase 2 Marks</span>
                    </div>
                    <p className="text-white text-lg font-medium">{project.phase2_marks}</p>
                  </div>
                )}

                {project.marks !== undefined && project.marks !== null && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Hash className="w-4 h-4" />
                      <span>Final Marks</span>
                    </div>
                    <p className="text-white text-lg font-medium">{project.marks}</p>
                  </div>
                )}

                {project.similarityscore !== undefined && project.similarityscore !== null && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Hash className="w-4 h-4" />
                      <span>Similarity Score</span>
                    </div>
                    <p className="text-white text-lg font-medium">{project.similarityscore}</p>
                  </div>
                )}

                {project.demovideolink && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Video className="w-4 h-4" />
                      <span>Demo Video</span>
                    </div>
                    <a
                      href={project.demovideolink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      <span>Watch Demo</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate(`/projects/${projectId}/edit`)}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Edit className="w-5 h-5" />
                <span>Edit Project</span>
              </button>

              <button
                onClick={handleArchive}
                disabled={archiving}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                  archiving
                    ? 'bg-slate-600 cursor-not-allowed opacity-60'
                    : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                } text-white`}
              >
                {archiving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Archiving...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-5 h-5" />
                    <span>Archive Project</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
