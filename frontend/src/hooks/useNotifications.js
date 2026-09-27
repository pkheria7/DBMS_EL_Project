import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import client from '../api/client';

const POLL_INTERVAL_MS = 30_000;

export function useNotifications(userType) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef(null); // null = first fetch not done yet

  const fetchAndDiff = useCallback(async () => {
    if (!userType || userType === 'admin') return;

    try {
      const { data } = await client.get(`/notifications/${userType}`);
      const fetched = data || [];

      if (seenIds.current === null) {
        // First load — mark everything as already seen; no toasts
        seenIds.current = new Set(fetched.map((n) => n.id));
      } else {
        // Subsequent polls — toast any IDs we haven't seen yet
        const newItems = fetched.filter((n) => !seenIds.current.has(n.id));
        newItems.forEach((n) => {
          seenIds.current.add(n.id);
          toast(n.message, {
            icon: '🔔',
            duration: 5000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
            },
          });
        });
      }

      setNotifications(fetched);
    } catch {
      // Silently swallow — network blips shouldn't crash the dashboard
    } finally {
      setLoading(false);
    }
  }, [userType]);

  useEffect(() => {
    seenIds.current = null;
    setLoading(true);
    fetchAndDiff();

    const id = setInterval(fetchAndDiff, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchAndDiff]);

  return { notifications, count: notifications.length, loading };
}
