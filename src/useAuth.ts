import React, { useState, useEffect } from 'react';
import { User } from './types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('sescinc_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  const [sessionToken, setSessionToken] = useState<string | null>(() => 
    localStorage.getItem('sescinc_token')
  );

  useEffect(() => {
    if (currentUser && sessionToken) {
      localStorage.setItem('sescinc_currentUser', JSON.stringify(currentUser));
      localStorage.setItem('sescinc_token', sessionToken);
    } else {
      localStorage.removeItem('sescinc_currentUser');
      localStorage.removeItem('sescinc_token');
      localStorage.removeItem('sescinc_view');
    }
  }, [currentUser, sessionToken]);

  const logout = () => {
    setCurrentUser(null);
    setSessionToken(null);
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const isPost = options.method === 'POST';
    let body: any = {};

    if (isPost && options.body) {
      try { body = JSON.parse(options.body as string); } catch { body = {}; }
    }

    if (isPost) {
      body.token = sessionToken;
      body.executor = currentUser?.login;
      options.body = JSON.stringify(body);
      options.headers = { ...options.headers, 'Content-Type': 'text/plain' };
    }

    const res = await fetch(url, options);
    const jsonRes = await res.clone().json().catch(() => ({}));

    if (jsonRes && jsonRes.invalidToken) {
      logout();
      throw new Error('Invalid Session');
    }

    return res;
  };

  return { currentUser, setCurrentUser, sessionToken, setSessionToken, logout, authenticatedFetch };
}