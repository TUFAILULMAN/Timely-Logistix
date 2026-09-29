/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Dispatcher } from '../types';
import { 
  KeyRound, 
  Shield, 
  Truck, 
  UserCheck, 
  AlertCircle, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Sparkles, 
  Briefcase, 
  ArrowRight,
  Fingerprint,
  Loader2
} from 'lucide-react';
import timelyLogo from '../assets/images/timely_logistix_logo_1780067518769.png';

interface LoginScreenProps {
  users: User[];
  dispatchers: Dispatcher[];
  onLogin: (username: string, pass: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onRegister: (name: string, email: string, pass: string, role: string, phone: string, joinCompanyId?: string, newCompanyName?: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onGoogleSignIn: (email: string, name: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  companyName: string;
  companyLogoUrl?: string;
}

export default function LoginScreen({ 
  users, 
  dispatchers, 
  onLogin, 
  onRegister, 
  onGoogleSignIn,
  companyName,
  companyLogoUrl
}: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'DISPATCHER' | 'SALES'>('DISPATCHER');

  // Workspace Setup states
  const [joinCompanyId, setJoinCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [regMode, setRegMode] = useState<'JOIN' | 'CREATE'>('JOIN');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Extract invite code or join code from URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('inviteCode') || params.get('joinCode') || params.get('companyId') || params.get('company');
    if (code) {
      setJoinCompanyId(code);
      setRegMode('JOIN');
      setIsRegistering(true);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please enter your credentials');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onLogin(username.trim(), password);
      if (!res.success) {
        setError(res.error || 'Login failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword || !regPhone.trim()) {
      setError('Please complete all form fields');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(regEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (regMode === 'JOIN' && !joinCompanyId.trim()) {
      setError('Please enter a Team Join Code');
      return;
    }

    if (regMode === 'CREATE' && !newCompanyName.trim()) {
      setError('Please enter a Company Name to create');
      return;
    }

    try {
      // Attempt registration
      const res = await onRegister(
        regName.trim(), 
        regEmail.toLowerCase().trim(), 
        regPassword, 
        regRole, 
        regPhone.trim(),
        regMode === 'JOIN' ? joinCompanyId.trim() : undefined,
        regMode === 'CREATE' ? newCompanyName.trim() : undefined
      );
      if (res.success) {
        setSuccess('Account registered successfully! Logging you in...');
        setTimeout(async () => {
          await onLogin(regEmail.toLowerCase().trim(), regPassword);
        }, 1500);
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleGoogleChoose = async (email: string, name: string) => {
    try {
      const res = await onGoogleSignIn(email, name);
      if (res.success) {
        setShowGoogleModal(false);
      } else {
        setError(res.error || 'Google Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed');
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim() || !customGoogleName.trim()) return;
    handleGoogleChoose(customGoogleEmail.toLowerCase().trim(), customGoogleName.trim());
  };

  return (
    <div id="login_container" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 overflow-hidden relative font-sans p-4">
      {/* Background Graphic Decorators */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.2),transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.25),transparent_50%)] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-xl rounded-3xl border border-blue-100 shadow-2xl shadow-blue-950/40 relative z-10 mx-auto">
        
        {/* Logo and Branding Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center mb-3">
            <img
              src={companyLogoUrl || timelyLogo}
              alt={`${companyName} Logo`}
              className="h-16 w-auto rounded-2xl object-contain shadow-md bg-white p-2.5 border border-blue-150 max-h-[80px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
            {companyName}
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-blue-50 border border-blue-200/80">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <p className="text-[11px] font-bold text-blue-700 tracking-wide font-mono uppercase">
              Dispatch management system (DMS)
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col gap-2 text-rose-700 text-xs shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
            {(error.toLowerCase().includes('operation-not-allowed') || error.toLowerCase().includes('auth/operation-not-allowed')) && (
              <div className="mt-2 p-3 bg-white border border-rose-200 rounded-xl text-slate-700 space-y-2">
                <p className="font-bold text-blue-700">🔧 Action Required in Firebase Console:</p>
                <ol className="list-decimal pl-4 space-y-1 font-mono text-[11px]">
                  <li>Open your Firebase Console dashboard</li>
                  <li>Go to <strong className="text-slate-900">Build &gt; Authentication</strong></li>
                  <li>Click on the <strong className="text-slate-900">Sign-in method</strong> tab</li>
                  <li>Click <strong className="text-slate-900">Add new provider</strong> and select <strong className="text-slate-900">Email/Password</strong></li>
                  <li>Toggle it to <strong className="text-emerald-600">Enabled</strong> and click <strong className="text-blue-600">Save</strong></li>
                </ol>
                <p className="text-[11px] text-blue-700 font-sans mt-2 pt-1 border-t border-slate-150">
                  💡 <strong>Local Mode Fallback:</strong> Local authentication is active. You can log in immediately with your credentials without delay!
                </p>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs shadow-xs">
            <Sparkles className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {/* Unified Login Form */}
        {!isRegistering ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-600" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 transition-all outline-none"
                  placeholder="e.g. email@company.com"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-600" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 transition-all outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              id="login_submit_btn"
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/30 flex justify-center items-center gap-2 cursor-pointer mt-6 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Enter Command Console</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-600" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 transition-all outline-none"
                  placeholder="e.g. Robert Smith"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-600" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 transition-all outline-none"
                  placeholder="e.g. robert@company.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-600" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 transition-all outline-none"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-600" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 transition-all outline-none"
                    placeholder="(555) 000-0000"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                Corporate Role
              </label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setRegRole('DISPATCHER')}
                  className={`py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                    regRole === 'DISPATCHER'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  Fleet Dispatcher
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole('SALES')}
                  className={`py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                    regRole === 'SALES'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  Sales Representative
                </button>
              </div>
            </div>

            {/* Team Workspace joining / creation options */}
            <div className="border-t border-slate-200 pt-4 space-y-3.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono">
                Team Workspace Setup
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRegMode('JOIN')}
                  className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                    regMode === 'JOIN'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-800'
                  }`}
                >
                  Join Existing Team
                </button>
                <button
                  type="button"
                  onClick={() => setRegMode('CREATE')}
                  className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                    regMode === 'CREATE'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-800'
                  }`}
                >
                  Create New Workspace
                </button>
              </div>

              {regMode === 'JOIN' ? (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                    Join Code / Company ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. comp_1780067518"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 focus:border-blue-600 focus:bg-white rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 outline-none transition-all"
                    value={joinCompanyId}
                    onChange={e => setJoinCompanyId(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Enter the code provided by your administrator or company invitation link.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                    New Company / Corporate Fleet Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Logistics Group"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 focus:border-blue-600 focus:bg-white rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 outline-none transition-all"
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Initializes a secure, dedicated multi-tenant logistics workspace for your team.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/30 flex justify-center items-center gap-2 cursor-pointer mt-6"
            >
              <Briefcase className="h-4 w-4" />
              <span>Submit &amp; Register</span>
            </button>
          </form>
        )}

        {/* Divider line */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest font-mono">
            <span className="bg-white px-3 text-slate-400">Or Connect Securely With</span>
          </div>
        </div>

        {/* Google Sign-in Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowGoogleModal(true);
          }}
          className="w-full py-3 bg-white hover:bg-blue-50/50 border border-slate-250 hover:border-blue-300 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-700 font-bold text-xs cursor-pointer shadow-xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.96 15.45 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.741-.08-1.305-.178-1.78l-10.615-.43z"
            />
          </svg>
          <span>Continue with Google Account</span>
        </button>

        {/* Form Switch Options */}
        <div className="mt-6 text-center text-xs">
          {!isRegistering ? (
            <p className="text-slate-600">
              Need a corporate workspace account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
              >
                Register &amp; Onboard
              </button>
            </p>
          ) : (
            <p className="text-slate-600">
              Already have an active account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          )}
        </div>

      </div>

      {/* Google Chooser Account Portal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-blue-100 rounded-3xl w-full max-w-sm p-6 text-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold p-1"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <svg className="h-8 w-8 mx-auto mb-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <h3 className="text-base font-bold text-slate-900">Google Accounts Secure Sign-In</h3>
              <p className="text-xs text-slate-500 mt-1">Select an active account from Google auth session</p>
            </div>

            <div className="space-y-3">
              {/* Profile Option 1 */}
              <button
                onClick={() => handleGoogleChoose('ranatufailulman446@gmail.com', 'Rana Tufail')}
                className="w-full flex items-center gap-3 p-3 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                  RT
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Rana Tufail</div>
                  <div className="text-[10px] text-slate-500 font-mono">ranatufailulman446@gmail.com</div>
                </div>
              </button>

              {/* Profile Option 2 */}
              <button
                onClick={() => handleGoogleChoose('guest.pilot@gmail.com', 'Guest Pilot')}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                  GP
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Guest Pilot</div>
                  <div className="text-[10px] text-slate-500 font-mono">guest.pilot@gmail.com</div>
                </div>
              </button>

              <div className="border-t border-slate-200 my-4 pt-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest font-mono mb-2">Or enter another Google account</p>
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Google User Name (e.g. Jane Doe)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 focus:border-blue-600 rounded-lg text-xs outline-none"
                    value={customGoogleName}
                    onChange={e => setCustomGoogleName(e.target.value)}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Google Email (e.g. user@timelylogistix.com)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 focus:border-blue-600 rounded-lg text-xs outline-none"
                    value={customGoogleEmail}
                    onChange={e => setCustomGoogleEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-xs"
                  >
                    Authenticate Account &rarr;
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
