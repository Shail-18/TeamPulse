import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, CheckCircle, XCircle, Clock, 
  User, CheckCircle2, AlertCircle, Filter, ArrowUpRight, ShieldCheck, Lock,
  Inbox, ListOrdered, FileText, CheckCircle2 as CheckIcon, History, ArrowRight,
  Activity, Search, X, Trash2
} from 'lucide-react';
import { User as UserType, LeaveRequest, LeaveActivityLog } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import { canViewLeaveRequest, canEditLeaveRequest, getApproverRoleLabel } from '../../utils/permissions';

interface LeaveViewProps {
  currentUser: UserType;
  isApplyOpenInitially?: boolean;
  onCloseApplyInitial?: () => void;
}

export const LeaveView: React.FC<LeaveViewProps> = ({
  currentUser,
  isApplyOpenInitially = false,
  onCloseApplyInitial
}) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(db.getLeaves());
  const isEmployee = currentUser.role === 'Employee';
  const [activeTab, setActiveTab] = useState<'queue' | 'status'>(isEmployee ? 'status' : 'queue');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isApplyOpen, setIsApplyOpen] = useState(isApplyOpenInitially);

  // Activity Log Modal state
  const [selectedLeaveForLog, setSelectedLeaveForLog] = useState<LeaveRequest | null>(null);
  const [showGlobalLogsModal, setShowGlobalLogsModal] = useState<boolean>(false);

  // Leave Form State
  const [leaveType, setLeaveType] = useState<'Annual' | 'Sick' | 'Casual' | 'Parental'>('Annual');
  const [startDate, setStartDate] = useState('2026-08-10');
  const [endDate, setEndDate] = useState('2026-08-15');
  const [reason, setReason] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [backupUserId, setBackupUserId] = useState('');

  const allUsers = db.getUsers();

  const refreshData = () => {
    setLeaves(db.getLeaves());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => refreshData());
    return () => unsub();
  }, []);

  // Role-based visibility filtering
  const visibleLeaves = leaves.filter((l) => canViewLeaveRequest(l, currentUser));

  // Queue: Applications requiring review or pending queue
  const queueLeaves = visibleLeaves.filter((l) => l.status === 'Pending');
  const filteredQueueLeaves = queueLeaves.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.userName.toLowerCase().includes(q) ||
      l.leaveType.toLowerCase().includes(q) ||
      l.department.toLowerCase().includes(q) ||
      l.reason.toLowerCase().includes(q)
    );
  });
  const pendingForMe = queueLeaves.filter((l) => canEditLeaveRequest(l, currentUser));

  // My Personal Applications
  const myLeaves = leaves.filter((l) => l.userId === currentUser.id);

  // Status/History: All historical or filtered visible leaves
  const statusFilteredLeaves = visibleLeaves.filter((l) => {
    const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      l.userName.toLowerCase().includes(q) ||
      l.leaveType.toLowerCase().includes(q) ||
      l.department.toLowerCase().includes(q) ||
      l.reason.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const globalActivityLogs = db.getLeaveActivityLogs();

  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    db.addLeaveRequest({
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userRole: currentUser.role,
      department: currentUser.department,
      leaveType: leaveType,
      startDate: startDate,
      endDate: endDate,
      days: days || 1,
      reason: reason,
      handoverNotes: handoverNotes || 'Handover completed verbally with team',
      backupUserId: backupUserId || undefined
    });

    refreshData();
    setIsApplyOpen(false);
    if (onCloseApplyInitial) onCloseApplyInitial();
    setReason('');
    setHandoverNotes('');
    setBackupUserId('');
    setActiveTab('status'); // Switch to status view after submitting
  };

  const handleDeleteLeave = (id: string) => {
    db.deleteLeaveRequest(id);
    refreshData();
  };

  const handleApprove = (id: string) => {
    db.updateLeaveStatus(
      id, 
      'Approved', 
      `${currentUser.name} (${currentUser.role})`,
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar
      }
    );
    refreshData();
  };

  const handleReject = (id: string) => {
    db.updateLeaveStatus(
      id, 
      'Rejected', 
      `${currentUser.name} (${currentUser.role})`,
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar
      }
    );
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" /> Leave & Time-Off Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Separated approval processing queue and live application status tracker
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGlobalLogsModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0"
          >
            <History className="w-4 h-4 text-indigo-600" /> Activity Audit Log
          </button>
          <button
            onClick={() => setIsApplyOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Apply for Leave
          </button>
        </div>
      </div>

      {/* Leave Balance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Annual Vacation</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">14 Days</span>
            <span className="text-xs text-slate-500">6 days used of 20 days</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
            70%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Sick Leave</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">8 Days</span>
            <span className="text-xs text-slate-500">2 days used of 10 days</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-base">
            80%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Casual Leave</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">5 Days</span>
            <span className="text-xs text-slate-500">0 days used of 5 days</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
            100%
          </div>
        </div>
      </div>

      {/* Main Tabbed Separation Bar (Only shown for managers/team leads/HR who process queues) */}
      {!isEmployee ? (
        <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-4 h-4 text-amber-400" />
            <span>Leave Application Queue</span>
            {pendingForMe.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                {pendingForMe.length} Action Needed
              </span>
            ) : queueLeaves.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px]">
                {queueLeaves.length} Pending
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'status'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Leave Application Status & Logs</span>
            {myLeaves.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                {myLeaves.length} My Submissions
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Leave Application Status Tracker</h3>
              <p className="text-xs text-slate-500">Track real-time approval status of your submitted time-off requests</p>
            </div>
          </div>
          <Badge variant="emerald">{myLeaves.length} Submissions</Badge>
        </div>
      )}

      {/* TAB 1: LEAVE APPLICATION QUEUE (Hidden for Employees) */}
      {!isEmployee && activeTab === 'queue' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Inbox className="w-5 h-5 text-amber-500" /> Actionable Approval Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Role-authorized queue: Team Leads edit Employees, Managers edit Team Leads, HR edits Managers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">
                {filteredQueueLeaves.length} Pending
              </Badge>
            </div>
          </div>

          {/* Search bar for Queue */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by applicant name, leave type, department, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-9 pr-8 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table of Queue Items */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-y border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Applicant & Role</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Authority Requirement</th>
                  <th className="py-3 px-4 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueueLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                      <p className="font-semibold text-slate-700">
                        {searchQuery ? 'No matching pending applications' : 'Approval Queue Cleared!'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {searchQuery ? `No pending applications match "${searchQuery}"` : 'No pending leave applications in your queue.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredQueueLeaves.map((leave) => {
                    const canEdit = canEditLeaveRequest(leave, currentUser);
                    const isOwnRequest = leave.userId === currentUser.id;
                    const approverRole = getApproverRoleLabel(leave.userRole);

                    return (
                      <tr 
                        key={leave.id} 
                        className={`transition-colors ${canEdit ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/80'}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img src={leave.userAvatar} alt={leave.userName} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-slate-100" />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {leave.userName}
                                {isOwnRequest && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded">You</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <Badge
                                  variant={
                                    leave.userRole === 'HR'
                                      ? 'purple'
                                      : leave.userRole === 'Manager'
                                      ? 'indigo'
                                      : leave.userRole === 'Team Lead'
                                      ? 'warning'
                                      : 'neutral'
                                  }
                                  size="sm"
                                >
                                  {leave.userRole}
                                </Badge>
                                <span>• {leave.department}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{leave.leaveType}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{leave.days} day(s)</div>
                          <div className="text-[11px] text-slate-500">{leave.startDate} to {leave.endDate}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs text-slate-600 italic truncate">"{leave.reason}"</td>
                        <td className="py-3.5 px-4">
                          {canEdit ? (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                              Action Required by {currentUser.role}
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" />
                              Requires {approverRole}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedLeaveForLog(leave)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1"
                              title="View activity history log"
                            >
                              <History className="w-3.5 h-3.5 text-indigo-600" /> Log
                            </button>
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => handleReject(leave.id)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors border border-rose-200/60"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApprove(leave.id)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteLeave(leave.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Delete Leave Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE APPLICATION STATUS & HISTORICAL LOGS */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* My Submitted Applications Quick Status Cards */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" /> My Submitted Applications Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time tracking of time-off requests submitted by you</p>
              </div>
              <Badge variant="indigo">{myLeaves.length} Requests Submitted</Badge>
            </div>

            {myLeaves.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                You haven't submitted any leave applications yet. Click <strong>"Apply for Leave"</strong> to request time-off.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myLeaves.map((m) => (
                  <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{m.leaveType} Leave</span>
                      <Badge
                        variant={
                          m.status === 'Approved'
                            ? 'success'
                            : m.status === 'Pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {m.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 italic">"{m.reason}"</p>

                    <div className="pt-2 flex items-center justify-between text-[11px] border-t border-slate-200/60">
                      <span className="text-slate-500">
                        {m.startDate} → {m.endDate} ({m.days} days)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">
                          {m.status === 'Pending'
                            ? `Awaiting ${getApproverRoleLabel(m.userRole)}`
                            : `Status by ${m.approvedBy || 'HR'}`}
                        </span>
                        <button
                          onClick={() => setSelectedLeaveForLog(m)}
                          className="px-2 py-0.5 bg-slate-200/70 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-[10px] transition-colors flex items-center gap-1"
                        >
                          <History className="w-3 h-3 text-indigo-600" /> Log
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLeave(m.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Leave Request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Company Historical Status Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-emerald-600" /> Historical Leave Status Records
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Complete record of processed and pending applications</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by applicant name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-9 pr-8 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full sm:w-auto transition-all"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clear filters notice if active */}
            {(searchQuery || filterStatus !== 'All') && (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Active Filters:</span>
                  {searchQuery && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1">
                      Search: "{searchQuery}"
                      <button onClick={() => setSearchQuery('')} className="hover:text-emerald-900"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterStatus !== 'All' && (
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1">
                      Status: {filterStatus}
                      <button onClick={() => setFilterStatus('All')} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('All');
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-y border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Applicant & Role</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Approver & Activity Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statusFilteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No records found matching search query or status filter.
                      </td>
                    </tr>
                  ) : (
                    statusFilteredLeaves.map((leave) => {
                      const isOwnRequest = leave.userId === currentUser.id;
                      return (
                        <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img src={leave.userAvatar} alt={leave.userName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {leave.userName}
                                  {isOwnRequest && (
                                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">My Application</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {leave.userRole} • {leave.department}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{leave.leaveType}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-900">{leave.days} day(s)</div>
                            <div className="text-[11px] text-slate-500">{leave.startDate} to {leave.endDate}</div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs text-slate-600 italic truncate">"{leave.reason}"</td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={
                                leave.status === 'Approved'
                                  ? 'success'
                                  : leave.status === 'Pending'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              {leave.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-medium text-slate-600 text-[11px]">
                                {leave.status === 'Pending'
                                  ? `Awaiting ${getApproverRoleLabel(leave.userRole)}`
                                  : `Processed by ${leave.approvedBy || 'HR Manager'}`}
                              </span>
                              <button
                                onClick={() => setSelectedLeaveForLog(leave)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1 shrink-0"
                                title="View detailed activity log"
                              >
                                <History className="w-3.5 h-3.5 text-indigo-600" /> Log
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLeave(leave.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Leave Request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Individual Leave Activity Log Modal */}
      <Modal
        isOpen={!!selectedLeaveForLog}
        onClose={() => setSelectedLeaveForLog(null)}
        title="Application Activity Log"
        subtitle={selectedLeaveForLog ? `Audit trail & status history for ${selectedLeaveForLog.userName}'s ${selectedLeaveForLog.leaveType} Leave` : ''}
      >
        {selectedLeaveForLog && (
          <div className="space-y-4 text-xs">
            {/* Header summary card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedLeaveForLog.userAvatar} alt={selectedLeaveForLog.userName} className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedLeaveForLog.userName}</div>
                  <div className="text-[11px] text-slate-500">
                    {selectedLeaveForLog.userRole} • {selectedLeaveForLog.department}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={selectedLeaveForLog.status === 'Approved' ? 'success' : selectedLeaveForLog.status === 'Pending' ? 'warning' : 'danger'}>
                  Current: {selectedLeaveForLog.status}
                </Badge>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">
                  {selectedLeaveForLog.startDate} to {selectedLeaveForLog.endDate} ({selectedLeaveForLog.days} days)
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600" /> Activity History Timeline
              </h4>
              <span className="text-[11px] text-slate-400">
                {selectedLeaveForLog.activityLogs?.length || 0} Log Entries
              </span>
            </div>

            {/* Timeline view */}
            <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200">
              {selectedLeaveForLog.activityLogs && selectedLeaveForLog.activityLogs.length > 0 ? (
                selectedLeaveForLog.activityLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                      log.newStatus === 'Approved' ? 'bg-emerald-500' : log.newStatus === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />

                    <div className="p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {log.performedByAvatar && (
                            <img src={log.performedByAvatar} alt={log.performedByName} className="w-5 h-5 rounded-full object-cover shrink-0" />
                          )}
                          <span className="font-bold text-slate-900">{log.performedByName}</span>
                          <Badge variant="indigo" size="sm">{log.performedByUserRole}</Badge>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] pt-0.5">
                        <span className="font-semibold text-slate-800">Action: {log.action}</span>
                        {log.previousStatus && log.previousStatus !== 'None' && (
                          <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-medium">
                            {log.previousStatus} <ArrowRight className="w-2.5 h-2.5" /> {log.newStatus}
                          </span>
                        )}
                      </div>

                      {log.comment && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 font-medium italic mt-1">
                          "{log.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No activity log entries available for this request.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeaveForLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close Timeline
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Global Audit Activity Logs Modal */}
      <Modal
        isOpen={showGlobalLogsModal}
        onClose={() => setShowGlobalLogsModal(false)}
        title="Leave Management Activity Audit Log"
        subtitle="System-wide real-time tracking of all leave status changes and submissions"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-indigo-900">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span className="font-bold">Total Recorded Actions:</span>
            </div>
            <Badge variant="indigo">{globalActivityLogs.length} Audit Entries</Badge>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
            {globalActivityLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No activity logs recorded in the system yet.</div>
            ) : (
              globalActivityLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-1 hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.performedByAvatar && (
                        <img src={log.performedByAvatar} alt={log.performedByName} className="w-5 h-5 rounded-full object-cover shrink-0" />
                      )}
                      <span className="font-bold text-slate-900">{log.performedByName}</span>
                      <Badge variant="indigo" size="sm">{log.performedByUserRole}</Badge>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-semibold text-slate-800">
                      {log.action} Action
                    </span>
                    <div className="flex items-center gap-1.5">
                      {log.previousStatus && log.previousStatus !== 'None' ? (
                        <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded inline-flex items-center gap-1 font-semibold">
                          {log.previousStatus} <ArrowRight className="w-2.5 h-2.5" /> {log.newStatus}
                        </span>
                      ) : (
                        <Badge variant="warning" size="sm">Initial: {log.newStatus}</Badge>
                      )}
                    </div>
                  </div>

                  {log.comment && (
                    <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100/80 mt-0.5">
                      "{log.comment}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setShowGlobalLogsModal(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              Close Audit Trail
            </button>
          </div>
        </div>
      </Modal>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Apply for Leave"
        subtitle="Submit a formal leave request for approval"
      >
        <form onSubmit={handleApplyLeaveSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
            >
              <option value="Annual">Annual Vacation</option>
              <option value="Sick">Sick Leave</option>
              <option value="Casual">Casual Leave</option>
              <option value="Parental">Parental Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Time-Off</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Vacation with family..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Handover Notes & Ongoing Tasks (Prevents unexpected project delay)
            </label>
            <textarea
              rows={2}
              placeholder="Detail active tasks, document links, or instructions for the team during your leave..."
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Designated Backup Assignee / Emergency Contact
            </label>
            <select
              value={backupUserId}
              onChange={(e) => setBackupUserId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">None / Self-Covered</option>
              {allUsers
                .filter((u) => u.id !== currentUser.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.title} ({u.role} in {u.department})
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsApplyOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

