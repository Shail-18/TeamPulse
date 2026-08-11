import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, UserCheck, Briefcase, Users, ArrowRight, 
  CheckCircle2, BarChart3, Heart, Calendar, Zap, Star, Award, 
  Building, ChevronRight, X, User as UserIcon, Mail, Lock, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { UserRole, User } from '../../types';
import { authService } from '../../services/auth';
import { db } from '../../services/db';
import { getRandomAvatar } from '../../utils/avatar';

interface LandingPageProps {
  onSuccess?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSuccess }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInRole, setSignInRole] = useState<UserRole>('Employee');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState('');

  // Sign Up state
  const [signUpRole, setSignUpRole] = useState<UserRole>('Employee');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpDepartment, setSignUpDepartment] = useState('Engineering');
  const [signUpTitle, setSignUpTitle] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpLocation, setSignUpLocation] = useState('San Francisco, CA');
  const [signUpError, setSignUpError] = useState('');

  const openAuth = (mode: 'signin' | 'signup', role?: UserRole) => {
    setAuthMode(mode);
    if (role) {
      setSignUpRole(role);
      setSignInRole(role);
    }
    setSignInError('');
    setSignUpError('');
    setAuthModalOpen(true);
  };

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
      setSignInError(res.error || 'Authentication failed. Please verify credentials and role.');
      return;
    }

    setAuthModalOpen(false);
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

    const existingUsers = db.getUsers();
    if (existingUsers.some((u) => u.email.toLowerCase() === signUpEmail.trim().toLowerCase())) {
      setSignUpError('An account with this email address already exists. Please sign in instead.');
      return;
    }

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
      managerId: ''
    };

    authService.signup(newUserProps);
    setAuthModalOpen(false);
    if (onSuccess) onSuccess();
  };

  const handleQuickDemoLogin = (userEmail: string, userRole: UserRole) => {
    const res = authService.login(userEmail, 'password123', userRole);
    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      // Fallback
      openAuth('signin', userRole);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              TeamPulse
            </span>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#roles" className="hover:text-indigo-400 transition-colors">Role Portals</a>
            <a href="#analytics" className="hover:text-indigo-400 transition-colors">Pulse Analytics</a>
            <a href="#testimonials" className="hover:text-indigo-400 transition-colors">Testimonials</a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuth('signin')}
              className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-xl transition-all"
            >
              Log In
            </button>
            <button
              onClick={() => openAuth('signup')}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-1.5"
            >
              Sign Up Free <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Glowing Background FX */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[200px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Gen Enterprise Workforce Dynamics Platform</span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Transform Workplace Culture with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
              Real-Time Pulse & Team Assignment
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Empower HR, Managers, Team Leads, and Staff with role-based visibility, automated team assignment, eNPS pulse surveys, peer kudos, and performance tracking.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => openAuth('signup')}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              Sign Up New Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => openAuth('signin')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm rounded-2xl transition-all"
            >
              Log In to Existing Account
            </button>
          </div>

          {/* Quick Demo Login Bar */}
          <div className="pt-8 border-t border-slate-800/80 max-w-3xl mx-auto">
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              ⚡ Quick Test Login (Click any role to test instantly)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleQuickDemoLogin('sarah.jenkins@teampulse.io', 'HR')}
                className="px-3 py-2.5 bg-slate-900/90 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition-all"
              >
                <p className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> HR Admin
                </p>
                <p className="text-[10px] text-slate-400 truncate">Sarah Jenkins</p>
              </button>

              <button
                onClick={() => handleQuickDemoLogin('david.chen@teampulse.io', 'Manager')}
                className="px-3 py-2.5 bg-slate-900/90 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition-all"
              >
                <p className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> Dept Manager
                </p>
                <p className="text-[10px] text-slate-400 truncate">David Chen</p>
              </button>

              <button
                onClick={() => handleQuickDemoLogin('marcus.vance@teampulse.io', 'Team Lead')}
                className="px-3 py-2.5 bg-slate-900/90 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all"
              >
                <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Team Lead
                </p>
                <p className="text-[10px] text-slate-400 truncate">Marcus Vance</p>
              </button>

              <button
                onClick={() => handleQuickDemoLogin('elena.rostova@teampulse.io', 'Employee')}
                className="px-3 py-2.5 bg-slate-900/90 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all"
              >
                <p className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Staff Employee
                </p>
                <p className="text-[10px] text-slate-400 truncate">Elena Rostova</p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Stats Highlight Banner */}
      <section className="bg-slate-900/60 border-y border-slate-800/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-indigo-400">98.4%</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pulse Participation Rate</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-400">+64</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average eNPS Score</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">14.2k</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peer Kudos Exchanged</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-purple-400">100%</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role Security Visibility</p>
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Built for Modern Enterprise Teams
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A single unified workspace connecting People Operations, Department Leadership, Sprint Leads, and Individual Staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Smart Team Assignment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Whenever new employees join the company, HR and Managers can instantly assign them directly into teams with role-based restrictions.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-amber-500/50 transition-all">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Pulse Surveys & eNPS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Launch pulse surveys, collect real-time anonymous team feedback, and visualize company health metrics instantly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/50 transition-all">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Peer Recognition & Kudos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Celebrate wins with peer shoutouts, custom core-value badges, and public appreciation feeds across departments.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-purple-500/50 transition-all">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Automated Leave Requests</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seamless PTO & leave request submission, manager approvals, balance tracking, and team capacity scheduling.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-cyan-500/50 transition-all">
            <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Performance Reviews & OKRs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track 90-day reviews, personal goals, skill profiles, and developmental growth pathways across quarters.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-rose-500/50 transition-all">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Role Visibility Safeguards</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict role-based data isolation ensures HR sees Managers, Team Leads & Staff; Managers see Team Leads & Staff; Team Leads see Staff.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Role Portals Showcase */}
      <section id="roles" className="py-16 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Tailored Portals for Every Role
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Each user role gets a custom dashboard optimized for their responsibilities and administrative depth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* HR */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-purple-500/30 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-extrabold rounded-full border border-purple-500/30 uppercase">
                  HR Portal
                </span>
                <h3 className="text-lg font-bold text-white">HR & People Ops</h3>
                <p className="text-xs text-slate-400">
                  Full company oversight. Shows Managers, Team Leads, and Employees. Assign newly joined members into teams.
                </p>
              </div>
              <button
                onClick={() => openAuth('signup', 'HR')}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Sign Up as HR Admin
              </button>
            </div>

            {/* Manager */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-indigo-500/30 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-extrabold rounded-full border border-indigo-500/30 uppercase">
                  Manager Portal
                </span>
                <h3 className="text-lg font-bold text-white">Department Manager</h3>
                <p className="text-xs text-slate-400">
                  Department leadership. Shows Team Leads and Employees. Manage teams, approve leaves, and assign new staff.
                </p>
              </div>
              <button
                onClick={() => openAuth('signup', 'Manager')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Sign Up as Manager
              </button>
            </div>

            {/* Team Lead */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-amber-500/30 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-extrabold rounded-full border border-amber-500/30 uppercase">
                  Lead Portal
                </span>
                <h3 className="text-lg font-bold text-white">Team Lead</h3>
                <p className="text-xs text-slate-400">
                  Sprint & team execution. Shows Employees. Manage squad tasks, moderate kudos, and support staff.
                </p>
              </div>
              <button
                onClick={() => openAuth('signup', 'Team Lead')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Sign Up as Team Lead
              </button>
            </div>

            {/* Employee */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-emerald-500/30 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold rounded-full border border-emerald-500/30 uppercase">
                  Staff Portal
                </span>
                <h3 className="text-lg font-bold text-white">Staff Employee</h3>
                <p className="text-xs text-slate-400">
                  Individual dashboard. View team directory, send kudos, complete pulse surveys, and track personal goals.
                </p>
              </div>
              <button
                onClick={() => openAuth('signup', 'Employee')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
              >
                Sign Up as Employee
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
              TP
            </div>
            <span className="font-bold text-slate-300">TeamPulse © 2026</span>
          </div>
          <p>Enterprise HR & Workforce Team Dynamics Platform</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => openAuth('signin')} className="hover:text-white">Sign In</button>
            <button onClick={() => openAuth('signup')} className="hover:text-white">Sign Up</button>
          </div>
        </div>
      </footer>

      {/* 7. Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">TeamPulse Account Portal</h3>
                  <p className="text-[10px] text-slate-400">Sign up new account or sign in to existing account</p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex border-b border-slate-800 bg-slate-950/50">
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setSignUpError('');
                }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-all ${
                  authMode === 'signup'
                    ? 'bg-indigo-600 text-white border-b-2 border-indigo-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Sign Up New Account
              </button>
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setSignInError('');
                }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-all ${
                  authMode === 'signin'
                    ? 'bg-indigo-600 text-white border-b-2 border-indigo-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Sign In Existing Account
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {authMode === 'signin' ? (
                /* Sign In Form */
                <form onSubmit={handleSignIn} className="space-y-4 max-w-md mx-auto py-2">
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Role</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={signInRole}
                        onChange={(e) => setSignInRole(e.target.value as UserRole)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Sign Up Form */
                <form onSubmit={handleSignUp} className="space-y-5 py-2">
                  {signUpError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{signUpError}</span>
                    </div>
                  )}

                  {/* Role selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Select Account Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { role: 'HR', title: 'HR Manager', desc: 'People Ops' },
                        { role: 'Manager', title: 'Manager', desc: 'Dept Manager' },
                        { role: 'Team Lead', title: 'Team Lead', desc: 'Project Lead' },
                        { role: 'Employee', title: 'Employee', desc: 'Staff Member' }
                      ].map((item) => {
                        const isSel = signUpRole === item.role;
                        return (
                          <div
                            key={item.role}
                            onClick={() => setSignUpRole(item.role as UserRole)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSel
                                ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{item.title}</span>
                              {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                            </div>
                            <p className="text-[10px] text-slate-400">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco, CA"
                        value={signUpLocation}
                        onChange={(e) => setSignUpLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    Complete Sign Up & Open {signUpRole} Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
