import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Search, UserCheck, ChevronDown, Check, LogOut, 
  Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { authService } from '../../services/auth';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';

export type UserStatus = 'Available' | 'In a Meeting' | 'Away';

const STATUS_OPTIONS: { status: UserStatus; label: string; dotClass: string; bgClass: string }[] = [
  { status: 'Available', label: 'Available', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { status: 'In a Meeting', label: 'In a Meeting', dotClass: 'bg-rose-500', bgClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  { status: 'Away', label: 'Away', dotClass: 'bg-amber-400', bgClass: 'bg-amber-50 text-amber-700 border-amber-200' }
];

interface NavbarProps {
  currentUser: User | null;
  onOpenSearch: () => void;
  onNavigateToView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenSearch,
  onNavigateToView
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>(() => {
    return (localStorage.getItem('teampulse_user_status') as UserStatus) || 'Available';
  });
  const [notifications, setNotifications] = useState(db.getNotifications(currentUser?.id));

  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setNotifications(db.getNotifications(currentUser?.id));
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (status: UserStatus) => {
    setUserStatus(status);
    localStorage.setItem('teampulse_user_status', status);
    setShowStatusDropdown(false);
  };

  const currentStatusObj = STATUS_OPTIONS.find((s) => s.status === userStatus) || STATUS_OPTIONS[0];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    if (currentUser) {
      db.markAllNotificationsAsRead(currentUser.id);
    }
  };

  const getRoleBadgeVariant = (role?: UserRole) => {
    switch (role) {
      case 'HR': return 'purple';
      case 'Manager': return 'info';
      case 'Team Lead': return 'warning';
      case 'Employee': return 'success';
      default: return 'default';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Quick Search trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100/80 hover:bg-slate-200/60 rounded-lg border border-slate-200/60 transition-colors w-48 sm:w-64"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="truncate">Search employees, surveys, leaves...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-white text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Role Switcher, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Employee Role Display */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="text-slate-500 font-medium">Role:</span>
          <Badge variant={getRoleBadgeVariant(currentUser?.role)}>
            {currentUser?.role || 'Employee'}
          </Badge>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200/80 py-2 z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications yet</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        db.markNotificationAsRead(notif.id);
                        if (notif.type === 'leave') onNavigateToView('leave');
                        else if (notif.type === 'survey') onNavigateToView('surveys');
                        else if (notif.type === 'shoutout') onNavigateToView('shoutouts');
                        setShowNotifDropdown(false);
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !notif.read ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info & Clickable Status Indicator */}
        {currentUser && (
          <div className="relative flex items-center gap-2.5 pl-2 border-l border-slate-200" ref={statusDropdownRef}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="relative rounded-full focus:outline-none ring-offset-1 focus:ring-2 focus:ring-indigo-500 group"
              title={`Status: ${userStatus} (Click to change)`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 group-hover:ring-indigo-400 transition-all"
              />
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white ${currentStatusObj.dotClass} transition-transform group-hover:scale-110`}
              />
            </button>

            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.name}</div>
              
              {/* Clickable Status Badge Pill */}
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`mt-0.5 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold transition-all hover:opacity-80 cursor-pointer ${currentStatusObj.bgClass}`}
                title="Toggle availability status"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatusObj.dotClass}`} />
                <span>{userStatus}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </div>

            {/* Status Dropdown Menu */}
            {showStatusDropdown && (
              <div className="absolute right-8 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Set Working Status</p>
                </div>
                <div className="p-1 space-y-0.5">
                  {STATUS_OPTIONS.map((item) => {
                    const isSelected = userStatus === item.status;
                    return (
                      <button
                        key={item.status}
                        onClick={() => handleStatusChange(item.status)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.dotClass}`} />
                          <span>{item.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => authService.logout()}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
