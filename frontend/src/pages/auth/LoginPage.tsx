import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBackendSyncStore } from '@/store';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useBackendSyncStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Return to page user originally tried to access, or dashboard
  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setGeneralError(null);
    setLoading(true);

    const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const [success] = await Promise.all([
        login(email.trim(), password),
        minLoadingTime,
      ]);
      if (success) {
        toast.success('Welcome back! Signed in successfully.');
        navigate(from, { replace: true });
      } else {
        const errorMsg =
          useBackendSyncStore.getState().errorMessage ||
          'Invalid email or password. Please verify your credentials.';
        setGeneralError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(
        err,
        'Invalid email or password. Please verify your credentials.'
      );
      setGeneralError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col justify-between items-center bg-gradient-to-br from-slate-50 via-pink-50/20 to-rose-50/40 p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Centered Loading Animation Overlay */}
      {loading && <LoadingScreen />}

      {/* Background Subtle Gradient Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 rounded-full bg-red-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* Top Spacer to balance footer and keep card centered */}
      <div className="h-6 w-full shrink-0" aria-hidden="true" />

      {/* Center Card */}
      <div className="w-full max-w-[375px] sm:max-w-[390px] z-10 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Flat Minimal Card without Box Shadow */}
        <Card className="border border-slate-200 bg-white shadow-none rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 space-y-4">
            {/* Logo and Brand Header inside the Container */}
            <div className="flex flex-col items-center text-center space-y-2 pt-1">
              <div className="flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Lilium & Loft Crochet Studio"
                  className="h-14 sm:h-16 w-auto object-contain max-w-[240px]"
                />
              </div>
              <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed">
                Sign in with your administrator account to access store analytics
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            <form onSubmit={handleLogin} noValidate className="space-y-3.5">
              {generalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span className="font-medium leading-relaxed">{generalError}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (generalError) setGeneralError(null);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="you@example.com"
                    disabled={loading}
                    className={`pl-9 h-9.5 text-sm ${
                      fieldErrors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-200 focus:border-red-600 focus:ring-red-600/20'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (generalError) setGeneralError(null);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    disabled={loading}
                    className={`pl-9 pr-10 h-9.5 text-sm ${
                      fieldErrors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-200 focus:border-red-600 focus:ring-red-600/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-9.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-none mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer pinned at the bottom */}
      <footer className="w-full text-center py-3 z-10 shrink-0">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Lilium & Loft Crochet Studio. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
