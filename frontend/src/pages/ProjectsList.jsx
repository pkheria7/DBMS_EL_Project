import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderKanban, Search, Calendar, Tag } from 'lucide-react';
import client from '../api/client';

const ProjectsList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (!userType || userType !== 'faculty') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await client.get('/projects/');
      setProjects(response.data);
    } catch (error) {
      setErrorMessage('Failed to load projects. Please try again.');
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesDomain = !filterDomain || project.domain?.toLowerCase().includes(filterDomain.toLowerCase());
    const matchesYear = !filterYear || project.year?.toString() === filterYear;
    return matchesDomain && matchesYear;
  });

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
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Projects</h1>
              <p className="text-slate-400 text-sm">Review student submissions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Student Projects
            </span>
          </h1>
          <p className="text-lg text-slate-300">
            Explore all submitted EL projects
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Tag className="w-4 h-4" />
                Filter by Domain
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  placeholder="e.g., AI, Web, Mobile"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Calendar className="w-4 h-4" />
                Filter by Year
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  placeholder="e.g., 2025"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
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
            <p className="text-white text-lg">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
            <FolderKanban className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">
              {projects.length === 0 ? 'No projects found. Students can submit projects from their dashboard.' : 'No projects match your filters.'}
            </p>
            {projects.length > 0 && (
              <button
                onClick={() => {
                  setFilterDomain('');
                  setFilterYear('');
                }}
                className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-slate-600 cursor-pointer relative overflow-hidden flex flex-col"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {/* Project Title */}
                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                  {project.title}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">
                  {project.description || 'No description provided.'}
                </p>

                {/* Meta Information */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.domain && (
                    <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500 text-indigo-300 rounded-full text-xs font-medium">
                      {project.domain}
                    </span>
                  )}
                  {project.year && (
                    <span className="px-3 py-1 bg-slate-700 border border-slate-600 text-slate-300 rounded-full text-xs">
                      {project.year}
                    </span>
                  )}
                </div>

                {/* Team Info */}
                {project.team_id && (
                  <div className="text-sm text-slate-400 mb-4">
                    Team ID: {project.team_id}
                  </div>
                )}

                {/* View Button */}
                <div className="mt-auto pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between text-indigo-400 group-hover:text-indigo-300 font-medium">
                    <span>View Details</span>
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;
