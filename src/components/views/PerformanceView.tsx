import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, CheckCircle2, Target, Star, Calendar, 
  Sparkles, Award, Zap, ChevronRight, Activity, ArrowUpRight,
  Download, FileText, Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Line, ComposedChart
} from 'recharts';
import { User as UserType, PerformanceReview, MonthlyPerformancePoint } from '../../types';
import { Badge } from '../common/Badge';
import { db } from '../../services/db';
import { get12MonthPerformanceData, USER_12_MONTH_PERFORMANCE } from '../../services/performanceHistory';

interface PerformanceViewProps {
  currentUser: UserType;
}

type PerformanceMetricKey = 'score' | 'execution' | 'collaboration' | 'deliverablesCount';

export const PerformanceView: React.FC<PerformanceViewProps> = ({ currentUser }) => {
  const isEmployee = currentUser.role === 'Employee';

  const [reviews, setReviews] = useState<PerformanceReview[]>(() => {
    const all = db.getReviews();
    return isEmployee ? all.filter((r) => r.employeeId === currentUser.id) : all;
  });
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [selectedUserForGraph, setSelectedUserForGraph] = useState<string>(currentUser.id);
  const [activeMetric, setActiveMetric] = useState<PerformanceMetricKey>('score');

  const targetUserId = isEmployee ? currentUser.id : selectedUserForGraph;

  // Load 12-month graph data for selected user
  const monthlyData: MonthlyPerformancePoint[] = get12MonthPerformanceData(targetUserId);
  const [selectedMonthPoint, setSelectedMonthPoint] = useState<MonthlyPerformancePoint>(
    monthlyData[monthlyData.length - 1]
  );

  useEffect(() => {
    const unsub = db.subscribe(() => {
      const all = db.getReviews();
      setReviews(isEmployee ? all.filter((r) => r.employeeId === currentUser.id) : all);
    });
    return () => unsub();
  }, [currentUser.id, isEmployee]);

  // Sync selected month point when user switches
  useEffect(() => {
    const data = get12MonthPerformanceData(targetUserId);
    if (data.length > 0) {
      setSelectedMonthPoint(data[data.length - 1]);
    }
  }, [targetUserId]);

  const allUsersList = isEmployee ? [currentUser] : db.getUsers();
  const selectedUserObj = allUsersList.find((u) => u.id === targetUserId) || currentUser;

  const userReviews = reviews.filter((r) => r.employeeId === targetUserId);
  const activeReview = (selectedReview && selectedReview.employeeId === targetUserId ? selectedReview : userReviews[0]) || {
    id: `rev-draft-${targetUserId}`,
    employeeId: selectedUserObj.id,
    employeeName: selectedUserObj.name,
    employeeAvatar: selectedUserObj.avatar,
    employeeRole: selectedUserObj.role,
    employeeTitle: selectedUserObj.title,
    reviewerId: 'user-mgr-1',
    reviewerName: 'David Vance',
    period: 'H2 2026',
    ratings: {
      execution: 4.5,
      collaboration: 4.8,
      leadership: 4.2,
      communication: 4.6
    },
    goals: [
      { id: 'g1', title: 'Complete Modular App Architecture', category: 'Technical', progress: 85, targetDate: '2026-08-30', status: 'In Progress' },
      { id: 'g2', title: 'Mentor 2 Engineering Interns', category: 'Leadership', progress: 100, targetDate: '2026-06-30', status: 'Completed' },
      { id: 'g3', title: 'Optimize Web Performance Score to >95', category: 'Technical', progress: 60, targetDate: '2026-09-15', status: 'In Progress' }
    ],
    strengths: 'Consistently delivers high-quality production code and proactively assists cross-functional design partners.',
    areasOfGrowth: 'Further develop delegation for task distribution across junior team members.',
    overallScore: 4.5,
    status: 'Approved',
    updatedAt: new Date().toISOString().split('T')[0]
  };

  const handleGoalProgressChange = (goalId: string, newProgress: number) => {
    const updatedGoals = activeReview.goals.map((g) =>
      g.id === goalId
        ? {
            ...g,
            progress: newProgress,
            status: newProgress === 100 ? ('Completed' as const) : ('In Progress' as const)
          }
        : g
    );

    const updatedRev = { ...activeReview, goals: updatedGoals };
    setSelectedReview(updatedRev);
    db.saveReview(updatedRev);
  };

  // 12-Month Calculations
  const totalDeliverables = monthlyData.reduce((acc, curr) => acc + curr.deliverablesCount, 0);
  const avg12MonthScore = (
    monthlyData.reduce((acc, curr) => acc + curr.score, 0) / monthlyData.length
  ).toFixed(2);
  const startScore = monthlyData[0]?.score || 4.0;
  const latestScore = monthlyData[monthlyData.length - 1]?.score || 4.9;
  const growthPercentage = (((latestScore - startScore) / startScore) * 100).toFixed(1);

  const getMetricLabel = (key: PerformanceMetricKey) => {
    switch (key) {
      case 'score': return 'Overall Score (1-5)';
      case 'execution': return 'Technical Execution';
      case 'collaboration': return 'Collaboration Rating';
      case 'deliverablesCount': return 'Deliverables Delivered';
    }
  };

  const getYDomain = (): [number, number] => {
    if (activeMetric === 'deliverablesCount') return [0, 15];
    return [3.0, 5.0];
  };

  const getYTicks = () => {
    if (activeMetric === 'deliverablesCount') return [0, 3, 6, 9, 12, 15];
    return [3.0, 3.5, 4.0, 4.5, 5.0];
  };

  const handleExportCSV = () => {
    const headers = ['Month', 'Full Month', 'Overall Score', 'Technical Execution', 'Collaboration', 'Deliverables Count', 'Key Highlight', 'Team Target Benchmark'];
    const csvRows = [
      headers.join(','),
      ...monthlyData.map((row) => [
        `"${row.month}"`,
        `"${row.fullMonthName}"`,
        row.score,
        row.execution,
        row.collaboration,
        row.deliverablesCount,
        `"${row.highlight.replace(/"/g, '""')}"`,
        row.targetBenchmark
      ].join(','))
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${selectedUserObj.name.replace(/\s+/g, '_')}_Performance_12Months.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = monthlyData.map((m) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${m.fullMonthName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #4f46e5; font-weight: bold;">${m.score} / 5.0</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${m.execution}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${m.collaboration}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${m.deliverablesCount}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${m.highlight}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedUserObj.name} - Annual Performance Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 32px; max-width: 900px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 22px; font-weight: 800; color: #1e1b4b; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; }
            .stat-val { font-size: 20px; font-weight: 800; color: #4f46e5; }
            .stat-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
            .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">12-Month Performance & Evaluation Report</div>
              <div class="subtitle">Employee: <strong>${selectedUserObj.name}</strong> (${selectedUserObj.title}) | Department: ${selectedUserObj.department || 'Engineering'}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 700; color: #4f46e5;">TeamPulse Enterprise</div>
              <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-lbl">12-Month Average</div>
              <div class="stat-val">${avg12MonthScore} / 5.0</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Peak Month Rating</div>
              <div class="stat-val" style="color: #059669;">${latestScore} / 5.0</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Annual Deliverables</div>
              <div class="stat-val" style="color: #7c3aed;">${totalDeliverables} Tasks</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Annual Growth</div>
              <div class="stat-val" style="color: #059669;">+${growthPercentage}%</div>
            </div>
          </div>

          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">12-Month Trajectory (Aug 2025 - Jul 2026)</h3>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th style="text-align: center;">Score</th>
                <th style="text-align: center;">Execution</th>
                <th style="text-align: center;">Collaboration</th>
                <th style="text-align: center;">Deliverables</th>
                <th>Key Milestone Highlight</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Official Performance Document • TeamPulse Performance Management System
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" /> Performance Reviews & 12-Month Trajectory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track annual performance trends across all 12 months, quarterly OKRs, and manager evaluations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Download 12-Month performance data as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer shadow-xs"
            title="Export full performance report as PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export to PDF</span>
          </button>
          <Badge variant="purple">Period: {activeReview.period}</Badge>
          <Badge variant="success">Status: {activeReview.status}</Badge>
        </div>
      </div>

      {/* 12-MONTH PERFORMANCE GRAPH SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">12-Month Performance Trajectory</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                12 Monthly Points (Aug 2025 – Jul 2026)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Click any monthly point on the chart or selector pills below to view detailed milestones and ratings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Employee Selector */}
            {isEmployee ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-medium text-slate-500">Employee:</span>
                <span className="text-xs font-bold text-slate-800">{currentUser.name} ({currentUser.title})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-medium text-slate-500">Employee:</span>
                <select
                  value={selectedUserForGraph}
                  onChange={(e) => {
                    setSelectedUserForGraph(e.target.value);
                    setSelectedReview(null);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {allUsersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Metric Selector Pills */}
            <div className="inline-flex p-1 bg-slate-100/80 rounded-xl gap-1">
              {(['score', 'execution', 'collaboration', 'deliverablesCount'] as PerformanceMetricKey[]).map((mKey) => (
                <button
                  key={mKey}
                  onClick={() => setActiveMetric(mKey)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeMetric === mKey
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {getMetricLabel(mKey).split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 12-Month Key Performance Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">12-Month Avg Rating</span>
            <div className="text-xl font-bold text-indigo-700 mt-0.5">{avg12MonthScore} / 5.0</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Consistent high performance</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peak Month Rating</span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{latestScore} / 5.0</div>
            <p className="text-[10px] text-slate-500 mt-0.5">{monthlyData[monthlyData.length - 1]?.fullMonthName}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Annual Deliverables</span>
            <div className="text-xl font-bold text-purple-600 mt-0.5">{totalDeliverables} Tasks</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Completed over 12 months</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trajectory Growth</span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              +{growthPercentage}% <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Year-over-year improvement</p>
          </div>
        </div>

        {/* Recharts 12-Month Line Graph */}
        <div className="pt-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 15, right: 15, bottom: 5, left: -20 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const point = e.activePayload[0].payload as MonthlyPerformancePoint;
                    setSelectedMonthPoint(point);
                  }
                }}
              >
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  dy={8}
                />
                <YAxis
                  domain={getYDomain()}
                  ticks={getYTicks()}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as MonthlyPerformancePoint;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 z-50">
                          <div className="font-bold border-b border-slate-800 pb-1 text-indigo-300 flex items-center justify-between gap-4">
                            <span>{data.fullMonthName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-900/80 text-indigo-200 rounded">Point {monthlyData.indexOf(data) + 1}/12</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Overall Rating:</span>
                            <span className="font-bold text-amber-400">{data.score} / 5.0</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Technical Execution:</span>
                            <span className="font-bold text-emerald-400">{data.execution}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Collaboration:</span>
                            <span className="font-bold text-indigo-400">{data.collaboration}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Deliverables:</span>
                            <span className="font-bold text-purple-300">{data.deliverablesCount} completed</span>
                          </div>
                          <p className="text-[10px] text-slate-300 pt-1 italic max-w-[200px]">"{data.highlight}"</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                />
                {/* Team Target Benchmark Dashed Reference Line */}
                {activeMetric !== 'deliverablesCount' && (
                  <Line
                    type="monotone"
                    dataKey="targetBenchmark"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="Team Target Benchmark"
                  />
                )}
                {/* Points indicator on every single month */}
                <Line
                  type="monotone"
                  dataKey={activeMetric}
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal 12-Month Point Indicator Buttons */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Select Monthly Point (12 Months):</span>
            <span className="text-[11px] text-indigo-600 font-normal">Active: {selectedMonthPoint.fullMonthName}</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {monthlyData.map((point, index) => {
              const isSelected = selectedMonthPoint.month === point.month;
              return (
                <button
                  key={point.month}
                  onClick={() => setSelectedMonthPoint(point)}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                      : 'bg-slate-50 hover:bg-indigo-50/60 text-slate-700 border-slate-200/80'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                    M{index + 1}
                  </span>
                  <span className="text-xs font-extrabold mt-0.5">{point.month}</span>
                  <span className={`text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {point.score}★
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Month Detailed Card */}
        {selectedMonthPoint && (
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded-md uppercase">
                  Monthly Highlight
                </span>
                <h3 className="text-sm font-bold text-slate-900">{selectedMonthPoint.fullMonthName} Review Point</h3>
              </div>
              <p className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5 pt-0.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>"{selectedMonthPoint.highlight}"</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-2xs text-center min-w-[90px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Score</span>
                <span className="text-sm font-black text-indigo-700">{selectedMonthPoint.score} / 5.0</span>
              </div>

              <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-2xs text-center min-w-[90px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Execution</span>
                <span className="text-sm font-bold text-emerald-600">{selectedMonthPoint.execution}</span>
              </div>

              <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-2xs text-center min-w-[90px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Collaboration</span>
                <span className="text-sm font-bold text-purple-600">{selectedMonthPoint.collaboration}</span>
              </div>

              <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-2xs text-center min-w-[90px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Deliverables</span>
                <span className="text-sm font-bold text-indigo-900">{selectedMonthPoint.deliverablesCount} Tasks</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Competency Ratings & OKRs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Competency Matrix & Ratings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <img
              src={activeReview.employeeAvatar}
              alt={activeReview.employeeName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-900">{activeReview.employeeName}</h3>
              <p className="text-xs text-slate-500">{activeReview.employeeTitle}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Reviewer: {activeReview.reviewerName}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Competency Ratings (1 - 5)</h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Technical Execution</span>
                  <span className="text-indigo-600">{activeReview.ratings.execution} ★</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(activeReview.ratings.execution / 5) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Cross-Team Collaboration</span>
                  <span className="text-emerald-600">{activeReview.ratings.collaboration} ★</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(activeReview.ratings.collaboration / 5) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Leadership & Initiative</span>
                  <span className="text-amber-600">{activeReview.ratings.leadership} ★</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(activeReview.ratings.leadership / 5) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Communication Skills</span>
                  <span className="text-purple-600">{activeReview.ratings.communication} ★</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(activeReview.ratings.communication / 5) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Score</span>
              <span className="text-3xl font-extrabold text-indigo-700">{activeReview.overallScore} / 5.0</span>
            </div>
          </div>
        </div>

        {/* Right Column: Quarterly Goals & Qualitative Feedback */}
        <div className="lg:col-span-2 space-y-6">
          {/* Goals & Progress Sliders */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Quarterly OKRs & Goals Progress</h3>
                <p className="text-xs text-slate-500">Drag sliders to update current completion percentage</p>
              </div>
              <Badge variant="purple">Interactive OKRs</Badge>
            </div>

            <div className="space-y-4">
              {activeReview.goals.map((goal) => (
                <div key={goal.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{goal.title}</span>
                    <Badge variant={goal.status === 'Completed' ? 'success' : 'info'} size="sm">
                      {goal.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.progress}
                      onChange={(e) => handleGoalProgressChange(goal.id, Number(e.target.value))}
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-indigo-600 w-12 text-right">{goal.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualitative Feedback */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Manager Evaluation & Feedback</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-900 uppercase text-[10px] block">Key Strengths</span>
                <p className="text-emerald-950 font-medium leading-relaxed">"{activeReview.strengths}"</p>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 space-y-1">
                <span className="font-bold text-amber-900 uppercase text-[10px] block">Growth Opportunities</span>
                <p className="text-amber-950 font-medium leading-relaxed">"{activeReview.areasOfGrowth}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
