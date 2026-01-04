import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, Search, Calendar, Tag } from 'lucide-react';
import client from '../api/client';

const ArchivesList = () => {
  const navigate = useNavigate();
  const [archives, setArchives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [userType, setUserType] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const type = localStorage.getItem('userType');
    if (!type || (type !== 'student' && type !== 'faculty')) {
      navigate('/login');
      return;
    }
    setUserType(type);
  }, [navigate]);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const response = await client.get('/archives/');
      const archivesData = response.data;
      
      // Fetch project details for each archive to get domain information
      const archivesWithProjects = await Promise.all(
        archivesData.map(async (archive) => {
          if (archive.project_id) {
            try {
              const projectResponse = await client.get(`/projects/${archive.project_id}`);
              return { ...archive, project: projectResponse.data };
            } catch (projectError) {
              console.error(`Error fetching project ${archive.project_id}:`, projectError);
              return archive;
            }
          }
          return archive;
        })
      );
      
      setArchives(archivesWithProjects);
    } catch (error) {
      setErrorMessage('Failed to load archives. Please try again.');
      console.error('Error fetching archives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArchives = archives.filter(archive => {
    const matchesTitle = !filterDomain || archive.title?.toLowerCase().includes(filterDomain.toLowerCase());
    const matchesDomain = !filterYear || archive.project?.domain?.toLowerCase().includes(filterYear.toLowerCase());
    return matchesTitle && matchesDomain;
  });

  const handleBack = () => {
    if (userType === 'student') {
      navigate('/student-dashboard');
    } else if (userType === 'faculty') {
      navigate('/faculty-dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Back Button */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Archives</h1>
              <p className="text-slate-400 text-sm">Browse past projects</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">
              Project Archives
            </span>
          </h1>
          <p className="text-lg text-slate-300">
            Browse archived EL projects from previous years
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Search className="w-4 h-4" />
                Search Projects
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  placeholder="Search by project title..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-base"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Tag className="w-4 h-4" />
                Filter by Domain
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  placeholder="e.g., AI/ML, Web Development, IoT"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-base"
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
            <p className="text-white text-lg">Loading archives...</p>
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
            <Archive className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">
              {archives.length === 0 ? 'No archived projects found.' : 'No archives match your filters.'}
            </p>
            {archives.length > 0 && (
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
            {filteredArchives.map((archive) => (
              <div
                key={archive.archive_id}
                className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-slate-600 cursor-pointer relative overflow-hidden"
                onClick={() => navigate(`/archives/${archive.archive_id}`)}
              >
                {/* Archived Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-900/50 border border-yellow-700 text-yellow-200 rounded-full text-xs font-medium">
                  Archived
                </div>

                {/* Project Title */}
                <h3 className="text-xl font-bold text-white mb-3 pr-20 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {archive.title || 'Untitled Project'}
                </h3>

                {/* Meta Information */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {archive.sem && (
                    <span className="px-3 py-1 bg-blue-600/20 border border-blue-500 text-blue-300 rounded-full text-xs font-medium">
                      Semester {archive.sem}
                    </span>
                  )}
                  {archive.project?.domain && (
                    <span className="px-3 py-1 bg-purple-600/20 border border-purple-500 text-purple-300 rounded-full text-xs font-medium">
                      {archive.project.domain}
                    </span>
                  )}
                </div>

                {/* Abstract Preview */}
                {archive.abstract && (
                  <div className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {archive.abstract}
                  </div>
                )}

                {/* View Button */}
                <div className="mt-auto pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between text-blue-400 group-hover:text-blue-300 font-medium">
                    <span>View Details</span>
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivesList;
