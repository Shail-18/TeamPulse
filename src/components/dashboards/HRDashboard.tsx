import React, { useState, useEffect } from 'react';
import { 
  Users, Heart, TrendingUp, AlertTriangle, Plus, BarChart2, 
  Building, FileText, CheckCircle2, ShieldAlert, ArrowUpRight, CheckSquare, UserPlus, ArrowRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Line, ComposedChart 
} from 'recharts';
import { User } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';

interface HRDashboardProps {
  currentUser: User;
  onNavigateToView: (view: string) => void;
  onOpenCreateSurveyModal: () => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({
  currentUser,
  onNavigateToView,
  onOpenCreateSurveyModal
}) => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [surveys, setSurveys] = useState(db.getSurveys());
  const [metrics, setMetrics] = useState(db.getMetrics());

  // Assign Manager Modal State
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  const refreshData = () => {
    setUsers([...db.getUsers()]);
    setSurveys([...db.getSurveys()]);
    setMetrics([...db.getMetrics()]);
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const totalHeadcount = users.length + 79; // enterprise mock scaling

  const unassignedEmployees = users.filter((u) => u.role === 'Employee' && (!u.managerId || u.managerId === '' || u.department === 'Unassigned'));
  const managersList = users.filter((u) => u.role === 'Manager');

  const handleOpenAssign = (user: User) => {
    setAssigningUser(user);
    setSelectedManagerId(managersList[0]?.id || '');
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningUser || !selectedManagerId) return;
    db.assignEmployeeToManager(assigningUser.id, selectedManagerId);
    setAssigningUser(null);
    refreshData();
  };

  const departmentData = metrics.map((m) => ({
    name: m.department,
    headcount: m.headcount,
    satisfaction: m.satisfactionScore,
    eNPS: m.eNPS,
    retention: m.retentionRate
  }));

  return (
    <div className="space-y-6">
      {/* Top HR Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="purple">HR Executive Dashboard</Badge>
              <span className="text-xs text-purple-200 font-medium">Acme Global Enterprise</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">People Operations & Culture Portal</h1>
            <p className="text-sm text-purple-100 mt-1 max-w-xl">
              Company eNPS is at <strong className="text-white font-semibold">+62 (Industry Upper Quartile)</strong>. Retention rate across engineering and design remains high at 95.2%.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToView('tasks')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" /> Delegate & Assign Tasks
            </button>
            <button
              onClick={onOpenCreateSurveyModal}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Launch Pulse Survey
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value={totalHeadcount}
          subtitle="Full-time & Contracted"
          icon={Users}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          trend={{ value: '8.4% YoY Growth', isPositive: true }}
        />
        <StatCard
          title="Company eNPS"
          value="+62"
          subtitle="1,240 Total Survey Responses"
          icon={Heart}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: '6 pts', isPositive: true }}
        />
        <StatCard
          title="Pending HR Assignments"
          value={unassignedEmployees.length}
          subtitle="Newly Signed Up Employees"
          icon={UserPlus}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Active Pulse Surveys"
          value={surveys.length}
          subtitle="94.2% Average Participation"
          icon={BarChart2}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Real-time New Employee Signups & Manager Assignment Workflow */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-600" /> New Employee Signups (Live Roster Queue)
            </h3>
            <p className="text-xs text-slate-500">
              When new employees sign up, HR assigns them under a Manager. Once assigned, they automatically appear in that Manager's Team Directory.
            </p>
          </div>
          <button
            onClick={() => onNavigateToView('directory')}
            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 shrink-0"
          >
            Open Full HR Directory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {unassignedEmployees.length === 0 ? (
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All newly signed up employees are assigned to managers!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unassignedEmployees.map((emp) => (
              <div key={emp.id} className="p-3.5 bg-slate-50 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 hover:border-amber-400 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-200 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">{emp.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{emp.email}</p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">Unassigned Manager</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAssign(emp)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 transition-colors"
                >
                  Assign Manager
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Department Dynamics & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composed Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Department Headcount vs Satisfaction Index</h3>
              <p className="text-xs text-slate-500">Cross-departmental culture breakdown</p>
            </div>
            <button
              onClick={() => onNavigateToView('analytics')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
            >
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="headcount" name="Headcount" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
                <Line type="monotone" dataKey="satisfaction" name="Satisfaction Score %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HR Action Center */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">HR Compliance & Culture Tasks</h3>
            <p className="text-xs text-slate-500 mb-4">Quarterly HR benchmarks and policy reminders</p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Annual Review Cycles Completed</p>
                  <p className="text-[11px] text-slate-500">98% of performance reviews signed off for H1.</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Workload Risk: Marketing Team</p>
                  <p className="text-[11px] text-slate-600">Satisfaction score dipped 4% during product launch.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">2026 Remote Work Policy Updated</p>
                  <p className="text-[11px] text-slate-500">Distributed team guidelines ready for broadcast.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToView('directory')}
            className="mt-4 w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl border border-purple-200 transition-colors"
          >
            Manage Organization Directory
          </button>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Department Health Matrix</h3>
        <p className="text-xs text-slate-500 mb-4">Comparative team dynamics and retention risk scores</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-y border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Headcount</th>
                <th className="py-3 px-4">eNPS Score</th>
                <th className="py-3 px-4">Satisfaction Index</th>
                <th className="py-3 px-4">Burnout Risk</th>
                <th className="py-3 px-4">Retention Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.map((m) => (
                <tr key={m.department} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{m.department}</td>
                  <td className="py-3.5 px-4 font-medium">{m.headcount} members</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-semibold">+{m.eNPS}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${m.satisfactionScore}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-800">{m.satisfactionScore}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={m.burnoutRisk === 'Low' ? 'success' : 'warning'}>
                      {m.burnoutRisk} Risk
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{m.retentionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Assign Manager Modal (HR) */}
      <Modal
        isOpen={!!assigningUser}
        onClose={() => setAssigningUser(null)}
        title="Assign Manager to New Employee"
        subtitle={`Select a Reporting Manager for ${assigningUser?.name || 'Employee'}`}
      >
        {assigningUser && (
          <form onSubmit={handleConfirmAssign} className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
              <img
                src={assigningUser.avatar}
                alt={assigningUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-200"
              />
              <div>
                <p className="font-bold text-slate-900">{assigningUser.name}</p>
                <p className="text-slate-500">{assigningUser.title} • {assigningUser.email}</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Reporting Manager</label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50"
              >
                {managersList.map((mgr) => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.name} ({mgr.department} Manager)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Assigning this manager will immediately place the employee in that manager's Team Directory and Dashboard in real-time.
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
