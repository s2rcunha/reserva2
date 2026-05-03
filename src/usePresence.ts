import React, { useState, useEffect } from 'react';
import { SCRIPT_URL } from './constants';
import { User } from './types';

export function usePresence(currentUser: User | null, authenticatedFetch: any) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  const updatePresence = async () => {
    if (!currentUser || !SCRIPT_URL) return;
    try {
      const res = await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateStatus', userId: currentUser.id })
      });
      const data = await res.json();
      if (data.success && data.onlineUsers) {
        setOnlineUsers(data.onlineUsers);
      }
    } catch (e) { console.error("Presence error", e); }
  };

  useEffect(() => {
    if (!currentUser) return;
    updatePresence();
    const interval = setInterval(updatePresence, 90000);
    
    const handleUnload = () => {
      const payload = JSON.stringify({ action: 'updateStatus', userId: currentUser.id, offline: 'true' });
      navigator.sendBeacon(SCRIPT_URL, new Blob([payload], { type: 'text/plain' }));
    };

    window.addEventListener('unload', handleUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('unload', handleUnload);
    };
  }, [currentUser]);

  return { onlineUsers };
}