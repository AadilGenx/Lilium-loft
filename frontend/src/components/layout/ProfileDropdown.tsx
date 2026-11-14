import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Settings, ExternalLink, ShieldCheck, LogOut } from 'lucide-react';
import { useBackendSyncStore } from '@/store';
import { toast } from 'sonner';

export function ProfileDropdown() {
  const navigate = useNavigate();
  const { currentUser, logout } = useBackendSyncStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('You have been logged out.');
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const displayName = currentUser?.name || 'Admin User';
  const displayEmail = currentUser?.email || 'admin@liliumloft.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'LL';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-red-500/20 transition-all outline-none">
            <Avatar className="h-8 w-8 border border-slate-200">
              <AvatarFallback className="bg-red-50 text-red-600 text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1">
          <div className="flex items-center gap-2.5 p-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-red-50 text-red-600 font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5 leading-none min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2 cursor-pointer">
            <Settings className="h-4 w-4 text-slate-500" />
            <span>Store Settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => window.open('https://woocommerce.com/documentation/', '_blank')}
            className="gap-2 cursor-pointer"
          >
            <ExternalLink className="h-4 w-4 text-slate-500" />
            <span>WooCommerce Docs</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2 cursor-pointer">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <span>Roles & Permissions</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowLogoutConfirm(true)}
            className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Log Out Confirmation"
        description="Are you sure you want to log out of the Lilium & Loft admin portal? You will need to sign in again to access the dashboard."
        confirmLabel="Yes, Log Out"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
