import React, { useState, useEffect } from 'react';
import { 
  Award, TrendingUp, Calendar, Heart, Plus, Users, 
  Smile, ThumbsUp, MessageSquare, Clock, ArrowRight, CheckSquare, UserCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { User } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { db } from '../../services/db';

interface TeamLeadDashboardProps {
  currentUser: User;
  onNavigateToView: (view: string) => void;
  onOpenShoutoutModal: () => void;
}

export const TeamLeadDashboard: React.FC<TeamLeadDashboardProps> = ({
  currentUser,
  onNavigateToView,
  onOpenShoutoutModal
}) => {
  const [shoutouts, setShoutouts] = useState(db.getShoutouts());
  const [allUsers, setAllUsers] = useState<User[]>(db.getUsers());

  const refreshData = () => {
    setShoutouts([...db.getShoutouts()]);
    setAllUsers([...db.getUsers()]);
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const teamMembers = allUsers.filter((u) => u.team === currentUser.team || (currentUser.team && u.team?.toLowerCase().includes(currentUser.team.toLowerCase())));

  const moodData = [
    { day: 'Mon', mood: 4.2 },
    { day: 'Tue', mood: 4.5 },
    { day: 'Wed', mood: 4.1 },
    { day: 'Thu', mood: 4.7 },
    { day: 'Fri', mood: 4.8 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="warning">Team Lead Portal</Badge>
              <span className="text-xs text-amber-200 font-medium">{currentUser.team}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Team Dynamics & Sprint Pulse</h1>
            <p className="text-sm text-amber-100 mt-1 max-w-xl">
              Team mood score is <strong className="text-white font-semibold">4.6 / 5.0</strong> this week! 2 team members received peer recognition today.
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
              onClick={onOpenShoutoutModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <Award className="w-4 h-4" /> Send Peer Recognition
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Weekly Team Mood"
          value="4.6 / 5.0"
          subtitle="92% Positive response"
          icon={Smile}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          trend={{ value: '0.4 vs last week', isPositive: true }}
        />
        <StatCard
          title="Sprint Velocity"
          value="94%"
          subtitle="Story points completed"
          icon={TrendingUp}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: 'On schedule', isPositive: true }}
        />
        <StatCard
          title="Shoutouts Received"
          value={shoutouts.length}
          subtitle="Core values recognition"
          icon={Award}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          title="Team Members Assigned"
          value={teamMembers.length}
          subtitle={`Squad: ${currentUser.team || 'Engineering Squad'}`}
          icon={Users}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
      </div>

      {/* Main Grid: Weekly Mood Trend & Recent Shoutouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mood Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Team Energy & Mood Flow</h3>
              <p className="text-xs text-slate-500">Daily quick check-in average score (1 - 5 rating)</p>
            </div>
            <Badge variant="success">High Energy</Badge>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[1, 5]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="mood" name="Mood Rating" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#moodColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Shoutouts Widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Team Shoutouts Feed</h3>
              <button
                onClick={() => onNavigateToView('shoutouts')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {shoutouts.slice(0, 3).map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={s.fromUserAvatar} alt={s.fromUserName} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs font-semibold text-slate-900">{s.fromUserName}</span>
                      <span className="text-slate-400 text-[10px]">to</span>
                      <span className="text-xs font-semibold text-indigo-600">{s.toUserName}</span>
                    </div>
                    <Badge variant="purple" size="sm">{s.category}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{s.message}"</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenShoutoutModal}
            className="mt-4 w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-xl border border-amber-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Award className="w-4 h-4" /> Send Peer Recognition
          </button>
        </div>
      </div>

      {/* Team Roster Live View */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Team Roster (Live Team Directory)</h3>
            <p className="text-xs text-slate-500">
              When a Manager assigns employees to {currentUser.team || 'your team'}, they immediately display here in live time.
            </p>
          </div>
          <button
            onClick={() => onNavigateToView('directory')}
            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
          >
            Open Team Directory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-y border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Department & Team</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                    No team members are assigned to this team yet. When your Manager assigns employees, they will appear here live!
                  </td>
                </tr>
              ) : (
                teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                        <div>
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-[11px] text-slate-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{member.title}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {member.department} • <span className="text-indigo-600 font-bold">{member.team}</span>
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
                    <td className="py-3.5 px-4 text-right text-slate-500">{member.location || 'Remote'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
