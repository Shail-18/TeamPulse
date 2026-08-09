/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ManagerDashboard } from './components/dashboards/ManagerDashboard';
import { HRDashboard } from './components/dashboards/HRDashboard';
import { TeamLeadDashboard } from './components/dashboards/TeamLeadDashboard';
import { EmployeeDashboard } from './components/dashboards/EmployeeDashboard';

import { DirectoryView } from './components/views/DirectoryView';
import { SurveysView } from './components/views/SurveysView';
import { LeaveView } from './components/views/LeaveView';
import { TasksView } from './components/views/TasksView';
import { ShoutoutsView } from './components/views/ShoutoutsView';
import { PerformanceView } from './components/views/PerformanceView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { TeamsView } from './components/views/TeamsView';

import { QuickSearchModal } from './components/common/QuickSearchModal';
import { AuthScreen } from './components/auth/AuthScreen';

import { User } from './types';
import { authService } from './services/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Sidebar responsive states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Global Quick Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openInitialLeaveModal, setOpenInitialLeaveModal] = useState(false);
  const [openInitialSurveyModal, setOpenInitialSurveyModal] = useState(false);
  const [openInitialShoutoutModal, setOpenInitialShoutoutModal] = useState(false);
  const [openInitialTaskModal, setOpenInitialTaskModal] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Anti-Copy and Security Handlers
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '');
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Cmd+K search shortcut
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Prevent Ctrl+C / Cmd+C when targeting non-input elements
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        const target = e.target as HTMLElement;
        const isInputField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (!isInputField) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!currentUser) {
    return <AuthScreen onSuccess={() => setCurrentView('dashboard')} />;
  }

  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'Manager':
        return (
          <ManagerDashboard
            currentUser={currentUser}
            onNavigateToView={(v) => setCurrentView(v)}
            onOpenLeaveModal={() => {
              setOpenInitialLeaveModal(true);
              setCurrentView('leave');
            }}
          />
        );
      case 'HR':
        return (
          <HRDashboard
            currentUser={currentUser}
            onNavigateToView={(v) => setCurrentView(v)}
            onOpenCreateSurveyModal={() => {
              setOpenInitialSurveyModal(true);
              setCurrentView('surveys');
            }}
          />
        );
      case 'Team Lead':
        return (
          <TeamLeadDashboard
            currentUser={currentUser}
            onNavigateToView={(v) => setCurrentView(v)}
            onOpenShoutoutModal={() => {
              setOpenInitialShoutoutModal(true);
              setCurrentView('shoutouts');
            }}
          />
        );
      case 'Employee':
      default:
        return (
          <EmployeeDashboard
            currentUser={currentUser}
            onNavigateToView={(v) => setCurrentView(v)}
            onOpenLeaveModal={() => {
              setOpenInitialLeaveModal(true);
              setCurrentView('leave');
            }}
            onOpenShoutoutModal={() => {
              setOpenInitialShoutoutModal(true);
              setCurrentView('shoutouts');
            }}
          />
        );
    }
  };

  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboardByRole();
      case 'teams':
        return <TeamsView currentUser={currentUser} />;
      case 'directory':
        return <DirectoryView currentUser={currentUser} />;
      case 'surveys':
        return (
          <SurveysView
            currentUser={currentUser}
            isCreateOpenInitially={openInitialSurveyModal}
            onCloseCreateInitial={() => setOpenInitialSurveyModal(false)}
          />
        );
      case 'leave':
        return (
          <LeaveView
            currentUser={currentUser}
            isApplyOpenInitially={openInitialLeaveModal}
            onCloseApplyInitial={() => setOpenInitialLeaveModal(false)}
          />
        );
      case 'tasks':
        return (
          <TasksView
            currentUser={currentUser}
            isCreateOpenInitially={openInitialTaskModal}
            onCloseCreateInitial={() => setOpenInitialTaskModal(false)}
          />
        );
      case 'shoutouts':
        return (
          <ShoutoutsView
            currentUser={currentUser}
            isCreateOpenInitially={openInitialShoutoutModal}
            onCloseCreateInitial={() => setOpenInitialShoutoutModal(false)}
          />
        );
      case 'performance':
        return <PerformanceView currentUser={currentUser} />;
      case 'analytics':
        return <AnalyticsView currentUser={currentUser} />;
      case 'settings':
        return <SettingsView currentUser={currentUser} />;
      default:
        return renderDashboardByRole();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          userRole={currentUser.role}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <Navbar
            currentUser={currentUser}
            onOpenSearch={() => setIsSearchOpen(true)}
            onNavigateToView={(v) => setCurrentView(v)}
          />

          {/* Page Content Container */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderViewContent()}
          </main>
        </div>
      </div>

      {/* Global Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToView={(v) => setCurrentView(v)}
      />
    </div>
  );
}
