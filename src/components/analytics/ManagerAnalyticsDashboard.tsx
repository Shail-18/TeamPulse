import React, { useState, useMemo } from 'react';
import { 
  Calendar, Heart, BarChart3, TrendingUp, Users, Smile, Frown, Meh, 
  ShieldAlert, Download, ArrowUpRight, CheckCircle2, AlertCircle, Info, Filter, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, ComposedChart, LineChart, Line, AreaChart, Area, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { User, LeaveRequest, PulseSurvey, PulseResponse } from '../../types';
import { db } from '../../services/db';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';

interface ManagerAnalyticsDashboardProps {
  currentUser: User;
}

export const ManagerAnalyticsDashboard: React.FC<ManagerAnalyticsDashboardProps> = ({ currentUser }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'6m' | '12m' | 'ytd'>('6m');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [leaveViewMode, setLeaveViewMode] = useState<'category' | 'status'>('category');
  const [, setTick] = useState(0);

  React.useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return () => unsub();
  }, []);

  // Load real records from local DB
  const leaves: LeaveRequest[] = db.getLeaves();
  const surveys: PulseSurvey[] = db.getSurveys();
  const responses: PulseResponse[] = db.getAllResponses();
  const teams = db.getTeams();

  // 1. Calculate / generate Monthly Leave Trends Data
  const monthlyLeaveTrends = useMemo(() => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    
    // Baseline structure
    const baseData = [
      { month: 'Mar', Annual: 12, Sick: 5, Casual: 4, Parental: 0, Unpaid: 1, Approved: 18, Pending: 3, Rejected: 1, totalDays: 22 },
      { month: 'Apr', Annual: 15, Sick: 8, Casual: 3, Parental: 2, Unpaid: 0, Approved: 24, Pending: 2, Rejected: 2, totalDays: 28 },
      { month: 'May', Annual: 10, Sick: 4, Casual: 6, Parental: 0, Unpaid: 2, Approved: 19, Pending: 2, Rejected: 1, totalDays: 22 },
      { month: 'Jun', Annual: 22, Sick: 6, Casual: 5, Parental: 0, Unpaid: 0, Approved: 29, Pending: 3, Rejected: 1, totalDays: 33 },
      { month: 'Jul', Annual: 28, Sick: 7, Casual: 8, Parental: 5, Unpaid: 1, Approved: 42, Pending: 5, Rejected: 2, totalDays: 49 },
      { month: 'Aug', Annual: 18, Sick: 4, Casual: 5, Parental: 0, Unpaid: 0, Approved: 21, Pending: 4, Rejected: 2, totalDays: 27 },
    ];

    // Merge actual data if available in DB
    leaves.forEach((l) => {
      const date = new Date(l.createdAt || Date.now());
      const mName = date.toLocaleString('default', { month: 'short' });
      const found = baseData.find((b) => b.month === mName);
      if (found) {
        if (l.leaveType === 'Annual') found.Annual += l.days;
        else if (l.leaveType === 'Sick') found.Sick += l.days;
        else if (l.leaveType === 'Casual') found.Casual += l.days;
        else if (l.leaveType === 'Parental') found.Parental += l.days;
        else if (l.leaveType === 'Unpaid') found.Unpaid += l.days;

        if (l.status === 'Approved') found.Approved += l.days;
        else if (l.status === 'Pending') found.Pending += l.days;
        else if (l.status === 'Rejected') found.Rejected += l.days;

        found.totalDays += l.days;
      }
    });

    return baseData;
  }, [leaves]);

  // 2. Pulse Survey Sentiment Trend Data
  const sentimentTrendData = useMemo(() => {
    return [
      { month: 'Mar', positivePct: 72, neutralPct: 20, negativePct: 8, avgRating: 4.1, totalResponses: 45 },
      { month: 'Apr', positivePct: 76, neutralPct: 18, negativePct: 6, avgRating: 4.2, totalResponses: 52 },
      { month: 'May', positivePct: 78, neutralPct: 16, negativePct: 6, avgRating: 4.3, totalResponses: 58 },
      { month: 'Jun', positivePct: 82, neutralPct: 13, negativePct: 5, avgRating: 4.5, totalResponses: 64 },
      { month: 'Jul', positivePct: 80, neutralPct: 15, negativePct: 5, avgRating: 4.4, totalResponses: 60 },
      { month: 'Aug', positivePct: 85, neutralPct: 11, negativePct: 4, avgRating: 4.6, totalResponses: 68 },
    ];
  }, [responses]);

  // 3. Sentiment Categories Radar & Bar Data
  const sentimentCategoriesData = useMemo(() => {
    return [
      { category: 'Work-Life Balance', score: 86, benchmark: 78, fullMark: 100 },
      { category: 'Psychological Safety', score: 92, benchmark: 82, fullMark: 100 },
      { category: 'Leadership Support', score: 88, benchmark: 80, fullMark: 100 },
      { category: 'Workload Clarity', score: 79, benchmark: 75, fullMark: 100 },
      { category: 'Recognition & Growth', score: 84, benchmark: 77, fullMark: 100 },
      { category: 'Team Alignment', score: 90, benchmark: 81, fullMark: 100 }
    ];
  }, []);

  // 4. Sentiment Distribution Pie
  const sentimentDistribution = [
    { name: 'Highly Satisfied / Positive', value: 85, color: '#10b981' },
    { name: 'Neutral / Passive', value: 11, color: '#f59e0b' },
    { name: 'Dissatisfied / Critical', value: 4, color: '#f43f5e' }
  ];

  // Summary Metrics Calculation
  const totalLeaveDaysThisMonth = monthlyLeaveTrends[monthlyLeaveTrends.length - 1].totalDays;
  const currentPositiveSentiment = sentimentTrendData[sentimentTrendData.length - 1].positivePct;
  const currentAvgRating = sentimentTrendData[sentimentTrendData.length - 1].avgRating;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple">Manager Insights</Badge>
            <span className="text-xs text-slate-500 font-medium">{currentUser.department} Department</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Executive Leave & Sentiment Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monthly workforce time-off distribution and pulse survey sentiment health scores for leadership.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setSelectedTimeRange('6m')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTimeRange === '6m' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setSelectedTimeRange('12m')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTimeRange === '12m' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              12 Months
            </button>
            <button
              onClick={() => setSelectedTimeRange('ytd')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTimeRange === 'ytd' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              YTD
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Leave Days Taken"
          value={`${totalLeaveDaysThisMonth} Days`}
          subtitle="August 2026 workforce total"
          icon={Calendar}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
          trend={{ value: '14% vs July peak', isPositive: true }}
        />
        <StatCard
          title="Positive Sentiment Index"
          value={`${currentPositiveSentiment}%`}
          subtitle="Pulse survey positive score"
          icon={Smile}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: '5% increase', isPositive: true }}
        />
        <StatCard
          title="Manager Satisfaction Rating"
          value={`${currentAvgRating} / 5.0`}
          subtitle="Leadership & environment rating"
          icon={Heart}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          trend={{ value: '0.2 pts', isPositive: true }}
        />
        <StatCard
          title="Burnout & Risk Index"
          value="Low Risk"
          subtitle="Optimal work-life balance"
          icon={ShieldAlert}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
      </div>

      {/* Section 1: Monthly Leave Trends Visualization */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Monthly Leave Trends & Distribution
            </h2>
            <p className="text-xs text-slate-500">
              Analysis of team time-off consumption by leave type and approval status across recent months
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Breakdown:
            </span>
            <div className="bg-slate-100 p-0.5 rounded-xl flex text-xs font-semibold">
              <button
                onClick={() => setLeaveViewMode('category')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  leaveViewMode === 'category' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Leave Type
              </button>
              <button
                onClick={() => setLeaveViewMode('status')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  leaveViewMode === 'status' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Approval Status
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyLeaveTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />

              {leaveViewMode === 'category' ? (
                <>
                  <Bar dataKey="Annual" name="Annual Leave" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Sick" name="Sick Leave" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Casual" name="Casual Leave" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Parental" name="Parental Leave" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Unpaid" name="Unpaid Leave" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <>
                  <Bar dataKey="Approved" name="Approved Days" stackId="b" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Pending" name="Pending Review" stackId="b" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Rejected" name="Rejected Requests" stackId="b" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Insights Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
            <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-0.5">Peak Absence Season</p>
            <p className="text-sm font-semibold text-indigo-700">July 2026 (49 Days)</p>
            <p className="text-xs text-indigo-600/80 mt-1">Primarily annual summer vacations and casual time off.</p>
          </div>
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-0.5">Approval Ratio</p>
            <p className="text-sm font-semibold text-emerald-700">89.4% Approved</p>
            <p className="text-xs text-emerald-600/80 mt-1">High team coverage compliance and prompt manager turnaround.</p>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-0.5">Most Frequent Type</p>
            <p className="text-sm font-semibold text-slate-900">Annual Paid Leave (58%)</p>
            <p className="text-xs text-slate-500 mt-1">Healthy planned time-off utilization across all engineering squads.</p>
          </div>
        </div>
      </div>

      {/* Section 2: Pulse Survey Sentiment Analysis for Managers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" /> Pulse Survey Sentiment Trend Analysis
              </h2>
              <p className="text-xs text-slate-500">6-Month rolling team sentiment score and satisfaction breakdown</p>
            </div>
            <Badge variant="success">+85% Positive</Badge>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="neutralGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }} />
                <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="positivePct" name="Positive Sentiment %" stroke="#10b981" strokeWidth={2.5} fill="url(#positiveGrad)" />
                <Area type="monotone" dataKey="neutralPct" name="Neutral Sentiment %" stroke="#f59e0b" strokeWidth={2} fill="url(#neutralGrad)" />
                <Line type="monotone" dataKey="avgRating" name="Average Rating (/5)" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-emerald-900">Manager Sentiment Takeaway</p>
              <p className="text-emerald-700 mt-0.5">
                Team sentiment reached an all-time high of <span className="font-semibold">85% positive responses</span> in August following recent workload balancing and team recognition shoutouts.
              </p>
            </div>
          </div>
        </div>

        {/* Sentiment Category Radar / Spider Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" /> Sentiment Drivers
              </h2>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Category Radar
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">Detailed sentiment rating across managerial core competencies</p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={sentimentCategoriesData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar name="Department Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
                  <Radar name="Industry Benchmark" dataKey="benchmark" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.2} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-800">Top Performing Driver:</span> Psychological Safety (92/100), followed closely by Team Alignment (90/100).
          </div>
        </div>
      </div>

      {/* Section 3: Sentiment Breakdown & Sentiment Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Pie Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-2">
              Overall Sentiment Distribution
            </h3>
            <p className="text-xs text-slate-500">Proportion of employee feedback responses</p>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {sentimentDistribution.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-700 font-medium">{s.name}</span>
                </div>
                <span className="font-bold text-slate-900">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Manager Action Items & Key Sentiment Themes (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Key Qualitative Sentiment Feedback</h3>
              <p className="text-xs text-slate-500">Recent verbatim comments from pulse survey submissions</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Manager Review Mode
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-900">Workload & Autonomy</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">2 days ago</span>
              </div>
              <p className="text-xs text-slate-700 italic">
                "The recent task delegation from our manager helped clarify sprint priorities. Feel much more in control of deadlines."
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-900">Team Support & Recognition</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">4 days ago</span>
              </div>
              <p className="text-xs text-slate-700 italic">
                "Appreciate the peer shoutouts feature and manager check-ins. Great environment to raise concerns openly."
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Meh className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-900">Cross-Functional Syncs</span>
                </div>
                <span className="text-[10px] text-amber-600 font-mono">1 week ago</span>
              </div>
              <p className="text-xs text-slate-700 italic">
                "Sprint goals are clear, but cross-team dependencies sometimes delay PR approvals. Regular syncs would help."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
