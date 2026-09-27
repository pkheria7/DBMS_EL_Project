import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import client from '../api/client';

const POLL_INTERVAL_MS = 30_000;

export function useTeamInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef(null);

  const fetchAndDiff = useCallback(async () => {
    const userType = localStorage.getItem('userType');
    if (userType !== 'student') {
      setLoading(false);
      return;
    }

    try {
      const { data } = await client.get('/teams/invites/incoming');
      const fetched = data || [];

      if (seenIds.current === null) {
        seenIds.current = new Set(fetched.map((i) => i.invite_id));
      } else {
        const newItems = fetched.filter((i) => !seenIds.current.has(i.invite_id));
        newItems.forEach((i) => {
          seenIds.current.add(i.invite_id);
          toast(`${i.initiator_name} invited you to join "${i.team_name}"`, {
            icon: '👥',
            duration: 6000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
            },
          });
        });
      }

      setInvites(fetched);
    } catch {
      // silent — don't crash dashboard on network blips
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    seenIds.current = null;
    setLoading(true);
    fetchAndDiff();
    const id = setInterval(fetchAndDiff, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchAndDiff]);

  return { invites, count: invites.length, loading };
}
