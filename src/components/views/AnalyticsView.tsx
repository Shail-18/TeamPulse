import React, { useState } from 'react';
import { 
  PieChart, BarChart2, TrendingUp, Users, Heart, ShieldAlert, Download, Calendar, Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line 
} from 'recharts';
import { User as UserType } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { db } from '../../services/db';
import { ManagerAnalyticsDashboard } from '../analytics/ManagerAnalyticsDashboard';

interface AnalyticsViewProps {
  currentUser: UserType;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'manager_trends' | 'executive_summary'>('manager_trends');
  const [, setTick] = useState(0);

  React.useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return () => unsub();
  }, []);

  const metrics = db.getMetrics();

  const enpsTrendData = [
    { quarter: 'Q3 2025', eNPS: 48 },
    { quarter: 'Q4 2025', eNPS: 52 },
    { quarter: 'Q1 2026', eNPS: 56 },
    { quarter: 'Q2 2026', eNPS: 60 },
    { quarter: 'Q3 2026', eNPS: 64 }
  ];

  const deptHeadcountData = metrics.map((m) => ({
    name: m.department,
    headcount: m.headcount
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  const [exportNotice, setExportNotice] = React.useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = React.useState(false);

  const handleExportData = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0];
    setIsExportOpen(false);

    if (format === 'json') {
      const dataObj = {
        exportedAt: new Date().toISOString(),
        companyMetrics: {
          eNPSBenchmark: "+64",
          retentionRate: "94.2%",
          satisfactionIndex: "86/100",
          burnoutRiskIndex: "Low"
        },
        eNPSTrend: enpsTrendData,
        departmentHeadcount: deptHeadcountData,
        departmentMetrics: metrics
      };
      const jsonStr = JSON.stringify(dataObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Executive_HR_Analytics_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportNotice('Executive Data exported as JSON successfully!');
    } else {
      const rows = [
        ['SECTION', 'METRIC / CATEGORY', 'VALUE', 'DETAILS'],
        ['Executive Summary', 'Company eNPS Benchmark', '+64', 'Top 10% Tech Industry'],
        ['Executive Summary', 'Average Retention Rate', '94.2%', '12-Month rolling average'],
        ['Executive Summary', 'Satisfaction Index', '86 / 100', 'Based on 1240 responses'],
        ['Executive Summary', 'Burnout Warning Index', 'Low', '2 Depts require monitoring'],
        [],
        ['eNPS Quarterly Trend', 'Quarter', 'eNPS Score', 'Status'],
        ...enpsTrendData.map((t) => ['eNPS Trend', t.quarter, t.eNPS, 'Verified']),
        [],
        ['Department Workforce Data', 'Department Name', 'Headcount', 'eNPS', 'Satisfaction Score', 'Burnout Risk', 'Retention Rate %'],
        ...metrics.map((m) => ['Department Data', `"${m.department}"`, m.headcount, m.eNPS, `${m.satisfactionScore}%`, `"${m.burnoutRisk}"`, `${m.retentionRate}%`])
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.map((r) => r.join(',')).join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `Executive_HR_Analytics_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportNotice('Executive Data exported as CSV successfully!');
    }

    setTimeout(() => {
      setExportNotice(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Export Notice Banner */}
      {exportNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 text-xs font-medium flex items-center justify-between transition-all">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-emerald-500 hover:text-emerald-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-purple-600" /> HR & Workforce Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Executive insights on eNPS, department retention, burnout risk, and headcount velocity
          </p>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Executive Data
          </button>

          {isExportOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 p-1.5 space-y-1">
              <button
                onClick={() => handleExportData('csv')}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
              >
                <span>Export as CSV</span>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">.csv</span>
              </button>
              <button
                onClick={() => handleExportData('json')}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
              >
                <span>Export as JSON</span>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">.json</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analytics View Selector Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('manager_trends')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'manager_trends'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> Manager Leave & Sentiment Dashboard
        </button>
        <button
          onClick={() => setActiveTab('executive_summary')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'executive_summary'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" /> Executive Org Metrics & eNPS
        </button>
      </div>

      {activeTab === 'manager_trends' ? (
        <ManagerAnalyticsDashboard currentUser={currentUser} />
      ) : (
        <>
          {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Company eNPS Benchmark"
          value="+64"
          subtitle="Top 10% Tech Industry"
          icon={Heart}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: '4 pts', isPositive: true }}
        />
        <StatCard
          title="Average Retention Rate"
          value="94.2%"
          subtitle="12-Month rolling average"
          icon={TrendingUp}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          title="Satisfaction Index"
          value="86 / 100"
          subtitle="Based on 1,240 responses"
          icon={BarChart2}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Burnout Warning Index"
          value="Low"
          subtitle="2 Depts require monitoring"
          icon={ShieldAlert}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* eNPS Trend Line Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">5-Quarter eNPS Trend Line</h3>
              <p className="text-xs text-slate-500">Employee Net Promoter Score evolution</p>
            </div>
            <Badge variant="purple">Quarterly Trend</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enpsTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="quarter" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[30, 80]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="eNPS" name="eNPS Score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Headcount Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Workforce Headcount Distribution</h3>
              <p className="text-xs text-slate-500">Department proportion across the enterprise</p>
            </div>
            <Badge variant="info">Active Headcount</Badge>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={deptHeadcountData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="headcount"
                >
                  {deptHeadcountData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
