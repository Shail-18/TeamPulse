import React, { useState } from 'react';
import { 
  Calendar, Award, BarChart3, CheckCircle2, Clock, 
  Send, Heart, ArrowRight, Plus, Target, CheckSquare, ListTodo, Tag
} from 'lucide-react';
import { User, PulseSurvey } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { db } from '../../services/db';

interface EmployeeDashboardProps {
  currentUser: User;
  onNavigateToView: (view: string) => void;
  onOpenLeaveModal: () => void;
  onOpenShoutoutModal: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  onNavigateToView,
  onOpenLeaveModal,
  onOpenShoutoutModal
}) => {
  const [, setTick] = useState(0);

  React.useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return () => unsub();
  }, []);

  const activeSurveys = db.getSurveys().filter((s) => s.status === 'active');
  const myLeaves = db.getLeaves().filter((l) => l.userId === currentUser.id);
  const myShoutouts = db.getShoutouts().filter((s) => s.toUserId === currentUser.id || s.fromUserId === currentUser.id);
  const reviews = db.getReviews().filter((r) => r.employeeId === currentUser.id);
  const myTasks = db.getTasks(currentUser.id);

  const [surveyRatings, setSurveyRatings] = useState<Record<string, number>>({});
  const [submittedSurveys, setSubmittedSurveys] = useState<Record<string, boolean>>({});

  const myGoals = reviews[0]?.goals || [
    { id: 'g1', title: 'Deliver Modular Design Tokens & UI Kit', category: 'Technical', progress: 85, targetDate: '2026-08-30', status: 'In Progress' },
    { id: 'g2', title: 'Complete Advanced React 19 Certification', category: 'Soft Skills', progress: 100, targetDate: '2026-06-30', status: 'Completed' },
    { id: 'g3', title: 'Optimize API Bundle Initial Load', category: 'Technical', progress: 60, targetDate: '2026-09-15', status: 'In Progress' }
  ];

  const handleRatingSelect = (surveyId: string, rating: number) => {
    setSurveyRatings({ ...surveyRatings, [surveyId]: rating });
  };

  const handleQuickSubmitSurvey = (survey: PulseSurvey) => {
    const rating = surveyRatings[survey.id] || 4;
    db.submitPulseResponse({
      surveyId: survey.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      department: currentUser.department,
      rating: rating,
      comment: 'Submitted from personal dashboard quick response'
    });
    setSubmittedSurveys({ ...submittedSurveys, [survey.id]: true });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="success">Employee Workspace</Badge>
              <span className="text-xs text-emerald-200 font-medium">{currentUser.title}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {currentUser.name}!</h1>
            <p className="text-sm text-emerald-100 mt-1 max-w-xl">
              You have <strong className="text-white">14 annual leave days remaining</strong>. You completed 2 out of 3 quarterly goals. Keep up the amazing momentum!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenLeaveModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Apply for Leave
            </button>
            <button
              onClick={onOpenShoutoutModal}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all border border-white/10 flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-emerald-300" /> Send Shoutout
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Annual Leave Balance"
          value="14 Days"
          subtitle="Out of 20 days total allowance"
          icon={Calendar}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Sick Leave Balance"
          value="8 Days"
          subtitle="Out of 10 days yearly allowance"
          icon={Clock}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
        <StatCard
          title="Quarterly Goals"
          value={`${myGoals.filter((g) => g.status === 'Completed').length} / ${myGoals.length}`}
          subtitle="82% Average goal completion"
          icon={Target}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          title="Shoutouts Received"
          value={myShoutouts.length}
          subtitle="Recognized by teammates"
          icon={Award}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Active Pulse Survey Quick Response & Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pulse Survey Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" /> Active Pulse Survey
              </h3>
              <p className="text-xs text-slate-500">Your feedback is anonymous and helps shape company culture</p>
            </div>
            <Badge variant="purple">Open for Response</Badge>
          </div>

          {activeSurveys.length > 0 ? (
            <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                  {activeSurveys[0].department || 'Company Wide'} • Closes {activeSurveys[0].expiresAt}
                </span>
                <h4 className="text-sm font-semibold text-slate-900 mt-1">{activeSurveys[0].title}</h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">"{activeSurveys[0].question}"</p>
              </div>

              {submittedSurveys[activeSurveys[0].id] ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Thank you! Your survey feedback has been recorded.
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-slate-200/60">
                  <p className="text-xs font-semibold text-slate-700">Select rating (1 = Poor, 5 = Excellent):</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleRatingSelect(activeSurveys[0].id, num)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          (surveyRatings[activeSurveys[0].id] || 4) === num
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleQuickSubmitSurvey(activeSurveys[0])}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Confidential Answer
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No active surveys requiring response right now.
            </div>
          )}
        </div>

        {/* Goals & OKRs Progress */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">My Quarterly Goals</h3>
              <button
                onClick={() => onNavigateToView('performance')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                View OKRs →
              </button>
            </div>

            <div className="space-y-4">
              {myGoals.map((goal) => (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">{goal.title}</span>
                    <span className="font-bold text-slate-900">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateToView('performance')}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
          >
            Review Annual Performance Self-Assessment
          </button>
        </div>
      </div>

      {/* My To-Do List & Deliverables Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-indigo-600" /> My Active To-Do List & Deliverables
            </h3>
            <p className="text-xs text-slate-500">Tasks assigned by managers and personal items</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="indigo">{myTasks.filter(t => t.status !== 'Completed').length} Pending</Badge>
            <button
              onClick={() => onNavigateToView('tasks')}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1"
            >
              View Full Task Board <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {myTasks.length === 0 ? (
            <div className="col-span-full text-center py-6 text-slate-400 text-xs">
              No active tasks assigned yet. Click "View Full Task Board" to add personal tasks.
            </div>
          ) : (
            myTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-2 hover:bg-slate-100/60 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        task.priority === 'Urgent' ? 'danger' :
                        task.priority === 'High' ? 'warning' : 'indigo'
                      }
                      size="sm"
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-medium">Due {task.dueDate}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs mt-2 line-clamp-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                  <span className="text-slate-500 truncate max-w-[140px]">
                    {task.assignedToUserId === task.assignedByUserId ? 'Personal To-Do' : `By ${task.assignedByName}`}
                  </span>
                  <button
                    onClick={() => {
                      const next = task.status === 'Completed' ? 'To Do' : 'Completed';
                      db.updateTaskStatus(task.id, next);
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      task.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-white border border-slate-300 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {task.status}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Leave Requests & Peer Shoutout list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Leave Application Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">My Leave Application Status</h3>
              <p className="text-[11px] text-slate-500">Live approval tracking for your time-off requests</p>
            </div>
            <button
              onClick={onOpenLeaveModal}
              className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Request Leave
            </button>
          </div>

          <div className="space-y-3">
            {myLeaves.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No leave requests submitted yet.</p>
            ) : (
              myLeaves.map((l) => (
                <div key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{l.leaveType} Leave</span>
                      <span className="text-[11px] text-slate-500">({l.days} days)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{l.startDate} to {l.endDate}</p>
                  </div>
                  <Badge variant={l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : 'danger'}>
                    {l.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Peer Recognition Received */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Peer Recognition Feed</h3>
            <button
              onClick={onOpenShoutoutModal}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Give Shoutout →
            </button>
          </div>

          <div className="space-y-3">
            {myShoutouts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No shoutouts yet. Be the first to recognize a teammate!</p>
            ) : (
              myShoutouts.map((s) => (
                <div key={s.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">From {s.fromUserName}</span>
                    <Badge variant="purple" size="sm">{s.category}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{s.message}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
