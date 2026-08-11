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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              TeamPulse
            </span>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#roles" className="hover:text-indigo-600 transition-colors">Role Portals</a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuth('signin')}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all"
            >
              Log In
            </button>
            <button
              onClick={() => openAuth('signup')}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              Sign Up Free <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-900 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Next-Gen Enterprise Workforce Dynamics Platform</span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Transform Workplace Culture with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
              Real-Time Pulse & Team Assignment
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Empower HR, Managers, Team Leads, and Staff with role-based visibility, automated team assignment, eNPS pulse surveys, peer kudos, and performance tracking.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <button
              onClick={() => openAuth('signup')}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              Sign Up New Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => openAuth('signin')}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-sm rounded-2xl shadow-xs transition-all"
            >
              Log In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* 3. Stats Highlight Banner */}
      <section className="bg-white border-y border-slate-200 py-8 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600">98.4%</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pulse Participation Rate</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-600">+64</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average eNPS Score</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">14.2k</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peer Kudos Exchanged</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-purple-600">100%</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role Security Isolation</p>
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Built for Modern Enterprise Teams
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            A single unified workspace connecting People Operations, Department Leadership, Sprint Leads, and Individual Staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3.5 shadow-xs hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Smart Team Assignment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Whenever new employees join the company, HR and Managers can instantly assign them directly into teams with role-based restrictions.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3.5 shadow-xs hover:border-amber-300 transition-all">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Pulse Surveys & eNPS</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Launch pulse surveys, collect real-time anonymous team feedback, and visualize company health metrics instantly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3.5 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Peer Recognition & Kudos</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Celebrate wins with peer shoutouts, custom core-value badges, and public appreciation feeds across departments.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3.5 shadow-xs hover:border-purple-300 transition-all">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated Leave Requests</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seamless PTO & leave request submission, manager approvals, balance tracking, and team capacity scheduling.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3.5 shadow-xs hover:border-cyan-300 transition-all">
            <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Performance Reviews & OKRs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track 90-day reviews, personal goals, skill profiles, and developmental growth pathways across quarters.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3.5 shadow-xs hover:border-rose-300 transition-all">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Role Visibility Safeguards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict role-based data isolation ensures HR sees Managers, Team Leads & Staff; Managers see Team Leads & Staff; Team Leads see Staff.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Role Portals Showcase */}
      <section id="roles" className="py-16 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Tailored Portals for Every Role
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              Each user role gets a custom dashboard optimized for their responsibilities and administrative depth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* HR */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-full border border-purple-200 uppercase">
                  HR Portal
                </span>
                <h3 className="text-base font-bold text-slate-900">HR & People Ops</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full company oversight. Shows Managers, Team Leads, and Employees. Assign newly joined members into teams.
                </p>
              </div>
              <button
                onClick={() => openAuth('signup', 'HR')}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all"
              >
                Sign Up as HR Admin
              </button>
            </div>

            {/* Manager */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-full border border-indigo-200 uppercase">
                  Manager Portal
                </span>
                <h3 className="text-base font-bold text-slate-900">Department Manager</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Department leadership. Shows Team Leads and Employees. Manage teams, approve leaves, and assign new staff.
                </p>
              </div>
              <button
                onClick={() => openAuth('signup', 'Manager')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all"
              >
                Sign Up as Manager
              </button>
            </div>

            {/* Team Lead */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full border border-amber-200 uppercase">
                  Lead Portal
                </span>
                <h3 className="text-base font-bold text-slate-900">Team Lead</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sprint & team execution. Shows Employees. Manage squad tasks, moderate kudos, and support staff.
                </p>
              </div>
              <button
                onClick={() => openAuth('signup', 'Team Lead')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all"
              >
                Sign Up as Team Lead
              </button>
            </div>

            {/* Employee */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full border border-emerald-200 uppercase">
                  Staff Portal
                </span>
                <h3 className="text-base font-bold text-slate-900">Staff Employee</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Individual dashboard. View team directory, send kudos, complete pulse surveys, and track personal goals.
                </p>
              </div>
              <button
                onClick={() => openAuth('signup', 'Employee')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all"
              >
                Sign Up as Employee
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. About Section */}
      <section id="about" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-extrabold rounded-full border border-indigo-200 uppercase">
              About TeamPulse
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Empowering Human-Centric Organisations
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
              TeamPulse was engineered to bridge the gap between high-level People Operations, department leadership, sprint leads, and individual employees. We believe that transparent role-based visibility and continuous feedback foster thriving workplace cultures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-extrabold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900">Clear Boundaries</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Role-tailored interfaces ensure every team member accesses exact data essential to their scope without operational friction or information overload.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-extrabold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900">Actionable Pulse</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Turn sentiment into measurable eNPS indicators. Real-time pulse analytics empower managers to resolve team bottlenecks proactively.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-extrabold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900">Seamless Growth</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                From streamlined team assignments to automated PTO tracking and quarterly OKRs, we streamline your workforce operational engine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Contact Section */}
      <section id="contact" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-extrabold rounded-full border border-indigo-200 uppercase">
              Get in Touch
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              We're Here to Help Your Team Succeed
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              Have questions about TeamPulse or need assistance setting up enterprise workspaces? Reach out to our dedicated support team.
            </p>
          </div>

          <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  placeholder="jane@company.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
              <textarea
                rows={3}
                placeholder="How can we assist your organization?"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
              ></textarea>
            </div>
            <button
              type="button"
              onClick={() => alert("Thank you for reaching out! A TeamPulse representative will be in touch shortly.")}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              Send Message
            </button>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
              TP
            </div>
            <span className="font-bold text-slate-900">TeamPulse © 2026</span>
          </div>
          <p className="font-medium text-slate-500">Enterprise HR & Workforce Team Dynamics Platform</p>
          <div className="flex items-center gap-4 text-slate-600 font-semibold">
            <button onClick={() => openAuth('signin')} className="hover:text-indigo-600">Sign In</button>
            <button onClick={() => openAuth('signup')} className="hover:text-indigo-600">Sign Up</button>
          </div>
        </div>
      </footer>

      {/* 7. Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">TeamPulse Portal Login & Sign Up</h3>
                  <p className="text-[11px] font-medium text-slate-500">Create a new account or sign in to your dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex border-b border-slate-200 bg-slate-100/80">
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setSignUpError('');
                }}
                className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider text-center transition-all ${
                  authMode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Sign Up New Account
              </button>
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setSignInError('');
                }}
                className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider text-center transition-all ${
                  authMode === 'signin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
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
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{signInError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. sarah.jenkins@teampulse.io"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Role</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={signInRole}
                        onChange={(e) => setSignInRole(e.target.value as UserRole)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                      >
                        <option value="Employee">Employee (Staff & Team Member)</option>
                        <option value="Team Lead">Team Lead (Project Lead)</option>
                        <option value="Manager">Manager (Department Manager)</option>
                        <option value="HR">HR (HR Manager & People Ops)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Sign Up Form */
                <form onSubmit={handleSignUp} className="space-y-4 py-1">
                  {signUpError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{signUpError}</span>
                    </div>
                  )}

                  {/* Role selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                                ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600 text-indigo-950'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{item.title}</span>
                              {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Elena Rostova"
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="elena@company.com"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Password *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Department</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                          value={signUpDepartment}
                          onChange={(e) => setSignUpDepartment(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
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
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Job Title (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={signUpTitle}
                        onChange={(e) => setSignUpTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco, CA"
                        value={signUpLocation}
                        onChange={(e) => setSignUpLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 mt-2"
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
