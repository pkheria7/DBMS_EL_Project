import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, Tag, Calendar, Mail, FileText, Hash } from 'lucide-react';
import client from '../api/client';

const ArchiveDetails = () => {
  const navigate = useNavigate();
  const [archive, setArchive] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [userType, setUserType] = useState('');

  // Get archive ID from URL
  const archiveId = window.location.pathname.split('/').pop();

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
    if (archiveId && archiveId !== 'archives') {
      fetchArchive();
    }
  }, [archiveId]);

  const fetchArchive = async () => {
    try {
      const response = await client.get(`/archives/${archiveId}`);
      setArchive(response.data);
    } catch (error) {
      setErrorMessage('Failed to load archive details. Please try again.');
      console.error('Error fetching archive:', error);
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
            onClick={() => navigate('/archives')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Archives</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Archive Details</h1>
              <p className="text-slate-400 text-sm">Archived project information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
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
            <p className="text-white text-lg">Loading archive details...</p>
          </div>
        ) : !archive ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
            <Archive className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 text-lg">Archive not found</p>
          </div>
        ) : (
          <>
            {/* Header Card */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-6 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white pr-4">
                  {archive.projecttitle || 'Untitled Project'}
                </h1>
                <span className="px-4 py-2 bg-yellow-900/50 border border-yellow-700 text-yellow-200 rounded-full text-sm font-medium whitespace-nowrap">
                  Archived
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {archive.domain && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500 text-blue-300 rounded-lg">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium">{archive.domain}</span>
                  </div>
                )}
                {archive.year && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 text-slate-300 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    <span>{archive.year}</span>
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
                {archive.archiveid && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Hash className="w-4 h-4" />
                      <span>Archive ID</span>
                    </div>
                    <p className="text-white text-lg font-medium">{archive.archiveid}</p>
                  </div>
                )}

                {archive.project_id && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Hash className="w-4 h-4" />
                      <span>Original Project ID</span>
                    </div>
                    <p className="text-white text-lg font-medium">{archive.project_id}</p>
                  </div>
                )}

                {archive.contactinfo && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Mail className="w-4 h-4" />
                      <span>Contact Information</span>
                    </div>
                    <p className="text-white text-lg">{archive.contactinfo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-2xl p-6">
              <div className="flex gap-3">
                <Archive className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-blue-200 leading-relaxed">
                    <strong className="text-blue-300">Note:</strong> This is an archived project from a previous year. The project is read-only and cannot be modified.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ArchiveDetails;
