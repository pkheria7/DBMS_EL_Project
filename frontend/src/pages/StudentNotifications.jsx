import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, ArrowLeft, GraduationCap } from 'lucide-react';
import client from '../api/client';

const StudentNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is a student
    const userType = localStorage.getItem('userType');
    
    if (!userType || userType !== 'student') {
      navigate('/login');
      return;
    }

    fetchNotifications();
  }, [navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await client.get('/notifications/student');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/student-dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-slate-400 text-sm">View all your notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-slate-400 text-lg">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-300 text-xl font-semibold mb-2">No notifications yet</p>
              <p className="text-slate-500">You'll see announcements from admin here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">
                  All Notifications ({notifications.length})
                </h2>
              </div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-slate-700/50 rounded-xl border border-slate-600 p-6 hover:border-green-500 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-lg leading-relaxed mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(notification.created_at).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Kolkata'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentNotifications;
