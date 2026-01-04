import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  Hash,
  Users,
  BookOpen,
  Award
} from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

const FacultyDetails = () => {
  const navigate = useNavigate();
  const { facultyId } = useParams();
  const [faculty, setFaculty] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacultyDetails();
  }, [facultyId]);

  const fetchFacultyDetails = async () => {
    try {
      // First, get all faculty and find the one with matching ID
      const allFacultyResponse = await client.get('/faculty/');
      const facultyList = allFacultyResponse.data || [];
      const foundFaculty = facultyList.find(f => f.faculty_id === parseInt(facultyId));
      
      if (!foundFaculty) {
        toast.error('Faculty not found');
        setLoading(false);
        return;
      }
      
      setFaculty(foundFaculty);

      // Fetch teams assigned to this faculty
      try {
        const teamsResponse = await client.get(`/faculty/${facultyId}/teams`);
        setTeams(teamsResponse.data || []);
      } catch (teamError) {
        // If 404, no teams assigned yet
        if (teamError.response?.status === 404) {
          setTeams([]);
        } else {
          console.error('Error fetching teams:', teamError);
          toast.error('Failed to load teams');
        }
      }
    } catch (error) {
      console.error('Error fetching faculty details:', error);
      toast.error('Failed to load faculty details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading faculty details...</div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Faculty not found</div>
          <button
            onClick={() => navigate('/admin-dashboard')}
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
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Faculty Details</h1>
              <p className="text-slate-400 text-sm">{faculty.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Faculty Information Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-400" />
            Faculty Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </div>
              <p className="text-white font-medium text-lg">{faculty.name}</p>
            </div>

            {/* Faculty ID */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Hash className="w-4 h-4" />
                <span>Faculty ID</span>
              </div>
              <p className="text-white font-medium text-lg">{faculty.faculty_id}</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <p className="text-white font-medium text-lg break-all">{faculty.email}</p>
            </div>

            {/* Phone Number */}
            {faculty.ph_no && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </div>
                <p className="text-white font-medium text-lg">{faculty.ph_no}</p>
              </div>
            )}

            {/* Designation */}
            {faculty.designation && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Briefcase className="w-4 h-4" />
                  <span>Designation</span>
                </div>
                <p className="text-white font-medium text-lg">{faculty.designation}</p>
              </div>
            )}

            {/* Department */}
            {faculty.dept_id && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>Department</span>
                </div>
                <p className="text-white font-medium text-lg">{faculty.dept_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Teams & Projects Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Assigned Teams & Projects
          </h2>

          {teams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No teams assigned yet</p>
              <p className="text-slate-500 text-sm mt-2">This faculty has not been assigned to any teams</p>
            </div>
          ) : (
            <div className="space-y-6">
              {teams.map((team) => (
                <div 
                  key={team.team_id}
                  className="bg-slate-700/50 rounded-xl border border-slate-600 p-6 hover:border-indigo-500 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{team.team_name}</h3>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300 text-sm">Team ID: {team.team_id}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          team.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}>
                          {team.status}
                        </div>
                        {team.cluster && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300 text-sm">Cluster: {team.cluster}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Team Members ({team.members?.length || 0})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {team.members?.map((member) => (
                        <div 
                          key={member.usn}
                          className="bg-slate-800 rounded-lg p-3 border border-slate-600"
                        >
                          <p className="text-white font-medium">{member.name}</p>
                          <p className="text-slate-400 text-sm">{member.usn}</p>
                          <p className="text-slate-500 text-xs mt-1 break-all">{member.email}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Details - if available */}
                  {team.project ? (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        Project Details
                      </h4>
                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-slate-400 text-sm mb-1">Project Title</p>
                            <p className="text-white font-medium">{team.project.title}</p>
                          </div>
                          {team.project.domain && (
                            <div>
                              <p className="text-slate-400 text-sm mb-1">Domain</p>
                              <p className="text-white font-medium">{team.project.domain}</p>
                            </div>
                          )}
                        </div>
                        {team.project.abstract && (
                          <div className="mb-4">
                            <p className="text-slate-400 text-sm mb-1">Abstract</p>
                            <p className="text-slate-300 text-sm">{team.project.abstract}</p>
                          </div>
                        )}
                        {team.project.report_link && (
                          <div className="mb-4">
                            <p className="text-slate-400 text-sm mb-1">Drive Link</p>
                            <a
                              href={team.project.report_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm break-all"
                            >
                              <BookOpen className="w-4 h-4" />
                              View Project Files
                            </a>
                          </div>
                        )}
                        {team.project.marks !== null && team.project.marks !== undefined && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-600">
                            <Award className="w-5 h-5 text-yellow-400" />
                            <span className="text-slate-400 text-sm">Marks:</span>
                            <span className="text-white font-bold text-lg">{team.project.marks} / 100</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDetails;
