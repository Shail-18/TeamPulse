import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, BarChart3, AlertTriangle, CheckCircle, XCircle, 
  ArrowUpRight, Heart, Clock, Plus, ArrowRight, CheckSquare, UserPlus
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { User, LeaveRequest, PulseSurvey, Team } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import { canEditLeaveRequest, canViewLeaveRequest } from '../../utils/permissions';
import { ManagerAnalyticsDashboard } from '../analytics/ManagerAnalyticsDashboard';

interface ManagerDashboardProps {
  currentUser: User;
  onNavigateToView: (view: string) => void;
  onOpenLeaveModal: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  currentUser,
  onNavigateToView,
  onOpenLeaveModal
}) => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [leaves, setLeaves] = useState<LeaveRequest[]>(db.getLeaves());
  const [teams, setTeams] = useState<Team[]>(db.getTeams());

  // Assign Team Modal State
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [targetTeamName, setTargetTeamName] = useState('');

  const refreshData = () => {
    setUsers([...db.getUsers()]);
    setLeaves([...db.getLeaves()]);
    setTeams([...db.getTeams()]);
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  // Filter pending leaves that Manager is specifically authorized to edit/approve (Team Lead leaves)
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending' && canEditLeaveRequest(l, currentUser));
  const directReports = users.filter((u) => u.department === currentUser.department || u.managerId === currentUser.id);

  const chartData = [
    { month: 'Mar', workload: 65, satisfaction: 82, eNPS: 55 },
    { month: 'Apr', workload: 70, satisfaction: 80, eNPS: 58 },
    { month: 'May', workload: 78, satisfaction: 84, eNPS: 60 },
    { month: 'Jun', workload: 82, satisfaction: 86, eNPS: 62 },
    { month: 'Jul', workload: 74, satisfaction: 88, eNPS: 64 }
  ];

  const handleApproveLeave = (leaveId: string) => {
    db.updateLeaveStatus(leaveId, 'Approved', currentUser.name, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.avatar
    });
    refreshData();
  };

  const handleRejectLeave = (leaveId: string) => {
    db.updateLeaveStatus(leaveId, 'Rejected', currentUser.name, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.avatar
    });
    refreshData();
  };

  const handleOpenAssignTeam = (user: User) => {
    setAssigningUser(user);
    const defaultTeam = teams.find(t => t.managerId === currentUser.id || t.department === currentUser.department)?.name || user.team || 'Frontend Architecture';
    setTargetTeamName(defaultTeam);
  };

  const handleConfirmAssignTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningUser || !targetTeamName) return;
    db.assignEmployeeToTeam(assigningUser.id, targetTeamName);
    setAssigningUser(null);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="purple">Manager Dashboard</Badge>
              <span className="text-xs text-indigo-300 font-medium">{currentUser.department} Department</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {currentUser.name}!</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Your engineering team health index is currently optimal. You have <span className="text-indigo-300 font-semibold">{pendingLeaves.length} pending leave request</span> requiring review.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToView('tasks')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" /> Delegate & Assign Tasks
            </button>
            <button
              onClick={() => onNavigateToView('surveys')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all border border-white/10 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-indigo-300" /> Pulse Survey
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Direct Reports"
          value={directReports.length}
          subtitle={`${directReports.filter((u) => u.status === 'Active').length} Active today`}
          icon={Users}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
          trend={{ value: '12% vs last quarter', isPositive: true }}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingLeaves.length}
          subtitle="Leave & time-off requests"
          icon={Calendar}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Department eNPS"
          value="+64"
          subtitle="Upper quartile benchmark"
          icon={Heart}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: '4 pts', isPositive: true }}
        />
        <StatCard
          title="Burnout Risk Level"
          value="Low"
          subtitle="Based on recent pulse survey"
          icon={AlertTriangle}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
      </div>

      {/* Main Content Split: Chart & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload & Satisfaction Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Department Velocity & Pulse Score</h3>
              <p className="text-xs text-slate-500">6-month rolling team satisfaction vs workload balance</p>
            </div>
            <button
              onClick={() => onNavigateToView('analytics')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
            >
              Detailed Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEnps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                />
                <Area type="monotone" dataKey="satisfaction" name="Satisfaction %" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSat)" />
                <Area type="monotone" dataKey="eNPS" name="eNPS Score" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEnps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Approvals Widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Pending Leave Approvals</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {pendingLeaves.length} Needs Action
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-72 divide-y divide-slate-100">
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                All pending leave requests are reviewed!
              </div>
            ) : (
              pendingLeaves.map((leave) => (
                <div key={leave.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={leave.userAvatar} alt={leave.userName} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{leave.userName}</p>
                        <p className="text-[11px] text-slate-500">{leave.leaveType} Leave • {leave.days} day(s)</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic border border-slate-100">
                    "{leave.reason}"
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleRejectLeave(leave.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleApproveLeave(leave.id)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigateToView('leave')}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1"
          >
            Manage All Leave Requests <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Analytics Dashboard (Monthly Leave Trends & Pulse Survey Sentiment) */}
      <ManagerAnalyticsDashboard currentUser={currentUser} />

      {/* Direct Reports Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Direct Reports Overview</h3>
            <p className="text-xs text-slate-500">Current status, team roles and performance reviews</p>
          </div>
          <button
            onClick={() => onNavigateToView('directory')}
            className="text-xs text-indigo-600 font-semibold hover:underline"
          >
            View Full Org Chart →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-y border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Team</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {directReports.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        <div className="text-[11px] text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{member.title}</div>
                    <div className="text-[11px] text-slate-500">{member.team}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        member.status === 'Active' ? 'success' : member.status === 'On Leave' ? 'warning' : 'info'
                      }
                    >
                      {member.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{member.location || 'Remote'}</td>
                  <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                    {member.role === 'Employee' && (
                      <button
                        onClick={() => handleOpenAssignTeam(member)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Users className="w-3 h-3" /> Assign Team
                      </button>
                    )}
                    <button
                      onClick={() => onNavigateToView('performance')}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Performance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Team Modal (Manager) */}
      <Modal
        isOpen={!!assigningUser}
        onClose={() => setAssigningUser(null)}
        title="Assign Employee to Team"
        subtitle={`Select a specific squad/team for ${assigningUser?.name || 'Employee'}`}
      >
        {assigningUser && (
          <form onSubmit={handleConfirmAssignTeam} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
              <img
                src={assigningUser.avatar}
                alt={assigningUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-200"
              />
              <div>
                <p className="font-bold text-slate-900">{assigningUser.name}</p>
                <p className="text-slate-500">{assigningUser.title} • {assigningUser.department}</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Squad / Team</label>
              <select
                value={targetTeamName}
                onChange={(e) => setTargetTeamName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
              >
                {teams.length > 0 ? (
                  teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.department}) {t.teamLeadName ? `- Lead: ${t.teamLeadName}` : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Frontend Architecture">Frontend Architecture</option>
                    <option value="Core Platform">Core Platform</option>
                    <option value="UX Systems">UX Systems</option>
                  </>
                )}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Assigning this employee to a team will notify the Team Lead and immediately show them in the Team Lead's directory and personal dashboard in live time!
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssigningUser(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
              >
                Confirm Team Assignment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
