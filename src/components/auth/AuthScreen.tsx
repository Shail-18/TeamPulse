import React, { useState } from 'react';
import { 
  ShieldCheck, UserCheck, Briefcase, Users, Lock, Mail, User as UserIcon, 
  Building, CheckCircle2, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { UserRole, User } from '../../types';
import { authService } from '../../services/auth';
import { db } from '../../services/db';
import { getRandomAvatar } from '../../utils/avatar';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInRole, setSignInRole] = useState<UserRole>('Employee');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState('');

  // Sign Up State
  const [signUpRole, setSignUpRole] = useState<UserRole>('Employee');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpDepartment, setSignUpDepartment] = useState('Engineering');
  const [signUpTitle, setSignUpTitle] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpLocation, setSignUpLocation] = useState('San Francisco, CA');
  const [signUpError, setSignUpError] = useState('');

  // Roles definition with rich descriptions
  const rolesInfo: { role: UserRole; title: string; desc: string; icon: any; color: string; bg: string; badgeVariant: 'purple' | 'info' | 'success' | 'warning' }[] = [
    {
      role: 'HR',
      title: 'HR Manager & People Ops',
      desc: 'Workforce pulse surveys, enterprise eNPS analytics, & leave management',
      icon: ShieldCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50 hover:border-purple-300',
      badgeVariant: 'purple'
    },
    {
      role: 'Manager',
      title: 'Department Manager',
      desc: 'Team building, team lead selection, velocity, budget & leave approvals',
      icon: Briefcase,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 hover:border-indigo-300',
      badgeVariant: 'info'
    },
    {
      role: 'Team Lead',
      title: 'Project & Team Lead',
      desc: 'Active sprint goals, peer shoutout moderation & team sprint wellness',
      icon: UserCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50 hover:border-amber-300',
      badgeVariant: 'warning'
    },
    {
      role: 'Employee',
      title: 'Staff & Team Member',
      desc: 'Personal OKRs, leave request submissions, peer kudos & pulse feedback',
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 hover:border-emerald-300',
      badgeVariant: 'success'
    }
  ];

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');

    if (!signInEmail.trim()) {
      setSignInError('Please enter your account email address.');
      return;
    }
    if (!signInPassword.trim()) {
      setSignInError('Please enter your account password.');
      return;
    }

    const res = authService.login(signInEmail.trim(), signInPassword.trim(), signInRole);
    if (!res.success) {
      setSignInError(res.error || 'Authentication failed. Please verify your credentials and selected role.');
      return;
    }

    if (onSuccess) onSuccess();
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    if (!signUpName.trim()) {
      setSignUpError('Please enter your full name.');
      return;
    }
    if (!signUpEmail.trim()) {
      setSignUpError('Please enter a valid email address.');
      return;
    }
    if (!signUpPassword.trim() || signUpPassword.length < 4) {
      setSignUpError('Password must be at least 4 characters long.');
      return;
    }

    // Check if email already exists
    const existingUsers = db.getUsers();
    if (existingUsers.some((u) => u.email.toLowerCase() === signUpEmail.trim().toLowerCase())) {
      setSignUpError('An account with this email address already exists. Please sign in instead.');
      return;
    }

    // Default title based on role if blank
    let title = signUpTitle.trim();
    if (!title) {
      switch (signUpRole) {
        case 'HR':
          title = 'HR Generalist & People Lead';
          break;
        case 'Manager':
          title = 'Engineering Manager';
          break;
        case 'Team Lead':
          title = 'Lead Software Engineer';
          break;
        case 'Employee':
        default:
          title = 'Senior Software Engineer';
          break;
      }
    }

    // Avatar generator
    const avatarUrl = getRandomAvatar(signUpName.trim() || signUpEmail.trim());

    const isNewEmployee = signUpRole === 'Employee';

    const newUserProps: Omit<User, 'id'> = {
      name: signUpName.trim(),
      email: signUpEmail.trim(),
      password: signUpPassword.trim(),
      avatar: avatarUrl,
      role: signUpRole,
      department: signUpDepartment || (isNewEmployee ? 'Unassigned' : 'Engineering'),
      team: isNewEmployee ? 'Unassigned Team' : `${signUpDepartment || 'Engineering'} Squad`,
      title: title,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      phone: signUpPhone.trim() || '+1 (555) 019-2834',
      location: signUpLocation.trim() || 'San Francisco, CA',
      managerId: '' // Initially unassigned manager for new signups
    };

    authService.signup(newUserProps);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Container Box */}
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/60 shadow-lg">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Teampulse</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-100">
            Enterprise Workforce & Role-Based Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Sign in with your role credentials or register a new team member account saved directly to your organization database.
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-800/90 rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Top Toggle Bar */}
          <div className="flex border-b border-slate-700/80 bg-slate-900/40">
            <button
              onClick={() => {
                setMode('signup');
                setSignUpError('');
              }}
              className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider text-center transition-all ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Sign Up New Account
            </button>
            <button
              onClick={() => {
                setMode('signin');
                setSignInError('');
              }}
              className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider text-center transition-all ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Sign In Existing Account
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {mode === 'signin' ? (
              /* SIGN IN FORM */
              <div className="space-y-8">
                <form onSubmit={handleSignIn} className="space-y-4 max-w-md mx-auto">
                  {signInError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{signInError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. sarah.jenkins@teampulse.io"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Job Role</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={signInRole}
                        onChange={(e) => setSignInRole(e.target.value as UserRole)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                      >
                        <option value="Employee">Employee (Staff & Team Member)</option>
                        <option value="Team Lead">Team Lead (Project Lead)</option>
                        <option value="Manager">Manager (Department Manager)</option>
                        <option value="HR">HR (HR Manager & People Ops)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              /* SIGN UP FORM */
              <form onSubmit={handleSignUp} className="space-y-6">
                {signUpError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{signUpError}</span>
                  </div>
                )}

                {/* Role Selector Cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    1. Select Account Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rolesInfo.map((r) => {
                      const Icon = r.icon;
                      const isSelected = signUpRole === r.role;
                      return (
                        <div
                          key={r.role}
                          onClick={() => setSignUpRole(r.role)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30'
                              : 'bg-slate-900/50 border-slate-700/80 hover:border-slate-600'
                          }`}
                        >
                          <div className={`p-2 rounded-lg bg-slate-800 ${r.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{r.role}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{r.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Personal & Professional Details */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    2. User Details & Credentials
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name *</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Elena Rostova"
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="elena@company.com"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Password *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                          value={signUpDepartment}
                          onChange={(e) => setSignUpDepartment(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          <option value="Engineering">Engineering</option>
                          <option value="Product Design">Product Design</option>
                          <option value="Growth & Mktg">Growth & Marketing</option>
                          <option value="Customer Success">Customer Success</option>
                          <option value="HR & People">HR & People Operations</option>
                          <option value="Finance & Ops">Finance & Operations</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Job Title (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={signUpTitle}
                        onChange={(e) => setSignUpTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Office Location</label>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco, CA"
                        value={signUpLocation}
                        onChange={(e) => setSignUpLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    Save to Database & Go to {signUpRole} Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
