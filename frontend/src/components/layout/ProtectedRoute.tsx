import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredToken, authApi, ApiError } from '@/services/api';
import { useBackendSyncStore } from '@/store';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const location = useLocation();
  const token = getStoredToken();
  const { currentUser, syncAll } = useBackendSyncStore();
  const [checking, setChecking] = useState(!currentUser && Boolean(token));

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      if (!token) {
        setChecking(false);
        return;
      }

      if (!currentUser) {
        try {
          const user = await authApi.me();
          if (isMounted) {
            useBackendSyncStore.setState({ currentUser: user });
            syncAll();
          }
        } catch (err) {
          if (isMounted) {
            if (err instanceof ApiError && err.status === 401) {
              // Token expired or invalid
              authApi.logout();
              useBackendSyncStore.setState({ currentUser: null, status: 'offline' });
            } else {
              // Backend unreachable: keep the session, show it as disconnected.
              useBackendSyncStore.setState({ status: 'offline' });
            }
          }
        } finally {
          if (isMounted) setChecking(false);
        }
      } else {
        setChecking(false);
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [token, currentUser, syncAll]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        <p className="text-xs text-slate-500 font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

