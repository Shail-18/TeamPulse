import React from 'react';
import { 
  Activity, LayoutDashboard, Users, BarChart3, Calendar, 
  Award, TrendingUp, PieChart, Settings, ChevronLeft, ChevronRight,
  ShieldCheck, Sparkles, Building2, LogOut, CheckSquare, Layers, UserCircle
} from 'lucide-react';
import { UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { authService } from '../../services/auth';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  userRole?: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  userRole = 'Employee',
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Manager', 'HR', 'Team Lead', 'Employee']
    },
    {
      id: 'teams',
      label: 'Teams & Leads',
      icon: Layers,
      roles: ['Manager', 'HR', 'Team Lead']
    },
    {
      id: 'directory',
      label: 'Team Directory',
      icon: Users,
      roles: ['Manager', 'HR', 'Team Lead', 'Employee']
    },
    {
      id: 'surveys',
      label: 'Pulse Surveys',
      icon: BarChart3,
      roles: ['Manager', 'HR', 'Team Lead', 'Employee']
    },
    {
      id: 'leave',
      label: 'Leave & Attendance',
      icon: Calendar,
      roles: ['Manager', 'HR', 'Team Lead', 'Employee']
    },
    {
      id: 'tasks',
      label: 'Tasks & To-Do List',
      icon: CheckSquare,
      roles: ['Manager', 'HR', 'Team Lead', 'Employee']
    },
    {
      id: 'shoutouts',
      label: 'Peer Recognition',
      icon: Award,
      roles: ['Manager', 'HR', 'Team Lead', 'Employee']
    },
    {
      id: 'performance',
      label: 'Performance & OKRs',
      icon: TrendingUp,
      roles: ['Manager', 'HR', 'Team Lead', 'Employee']
    },
    {
      id: 'analytics',
      label: 'HR Analytics',
      icon: PieChart,
      roles: ['HR', 'Manager']
    },
    {
      id: 'settings',
      label: 'Profile',
      icon: UserCircle,
      roles: ['Manager', 'HR', 'Team Lead', 'Employee']
    }
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          {(!isCollapsed || mobileOpen) && (
            <div className="min-w-0">
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                Teampulse <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">ENT</span>
              </span>
              <p className="text-[10px] text-slate-400 truncate">HR & Team Dynamics</p>
            </div>
          )}
        </div>

        {/* Toggle Collapse Desktop Button */}
        {!mobileOpen && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectView(item.id);
                if (mobileOpen) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
              title={isCollapsed && !mobileOpen ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              {(!isCollapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Role Context Footer Card */}
      {(!isCollapsed || mobileOpen) && (
        <div className="p-3 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Active Role Mode
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            You are viewing as <strong className="text-white">{userRole}</strong>.
          </p>
          <button
            onClick={() => authService.logout()}
            className="w-full mt-1 px-2.5 py-1.5 bg-slate-700/60 hover:bg-rose-600/80 text-white font-medium text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 md:hidden transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 ease-in-out border-r border-slate-800 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
