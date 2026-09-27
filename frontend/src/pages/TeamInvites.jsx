import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

const statusBadge = (status) => {
  if (status === 'accepted') return <span className="text-xs text-green-400 font-medium">✓ Accepted</span>;
  if (status === 'rejected') return <span className="text-xs text-red-400 font-medium">✗ Rejected</span>;
  return <span className="text-xs text-yellow-400 font-medium">⏳ Pending</span>;
};

const TeamInvites = () => {
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null); // invite_id being responded to

  const fetchInvites = useCallback(async () => {
    try {
      const { data } = await client.get('/teams/invites/incoming');
      setInvites(data || []);
    } catch {
      toast.error('Failed to load invites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (!userType || userType !== 'student') {
      navigate('/login');
      return;
    }
    fetchInvites();
  }, [navigate, fetchInvites]);

  const respond = async (invite_id, action) => {
    setResponding(invite_id);
    try {
      const { data } = await client.put(`/teams/invites/${invite_id}/respond`, { action });
      toast.success(data.message);

      if (action === 'accept' && data.team_id) {
        // Team was just created — go to dashboard
        setTimeout(() => navigate('/student-dashboard'), 1200);
      } else {
        // Refresh the list
        fetchInvites();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to respond');
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/student-dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Team Invites</h1>
              <p className="text-slate-400 text-sm">Pending requests to join a team</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-lg">Loading invites…</div>
        ) : invites.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No pending team invites</p>
            <p className="text-slate-500 text-sm mt-2">When someone invites you to join their team, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {invites.map((invite) => (
              <div
                key={invite.invite_id}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-lg"
              >
                {/* Invite header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{invite.team_name}</h2>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <User className="w-4 h-4" />
                      <span>Invited by <span className="text-slate-200 font-medium">{invite.initiator_name}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>Expires in 24h</span>
                  </div>
                </div>

                {/* Members list */}
                <div className="mb-5">
                  <p className="text-slate-400 text-sm mb-3 font-medium">Team members ({invite.members.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {invite.members.map((m) => (
                      <div
                        key={m.usn}
                        className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2 border border-slate-600"
                      >
                        <div>
                          <p className="text-white text-sm font-medium">{m.name}</p>
                          <p className="text-slate-400 text-xs">{m.usn}</p>
                        </div>
                        {statusBadge(m.status)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accept / Reject */}
                <div className="flex gap-3">
                  <button
                    onClick={() => respond(invite.invite_id, 'accept')}
                    disabled={responding === invite.invite_id}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {responding === invite.invite_id ? 'Processing…' : 'Accept'}
                  </button>
                  <button
                    onClick={() => respond(invite.invite_id, 'reject')}
                    disabled={responding === invite.invite_id}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamInvites;
