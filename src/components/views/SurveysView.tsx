import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Plus, CheckCircle2, PieChart, Send, 
  HelpCircle, Sparkles, Filter, User, ShieldCheck, Eye, EyeOff, Lock, Star, MessageSquare, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { User as UserType, PulseSurvey, PulseResponse, UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';

interface SurveysViewProps {
  currentUser: UserType;
  isCreateOpenInitially?: boolean;
  onCloseCreateInitial?: () => void;
}

export const SurveysView: React.FC<SurveysViewProps> = ({
  currentUser,
  isCreateOpenInitially = false,
  onCloseCreateInitial
}) => {
  const [surveys, setSurveys] = useState<PulseSurvey[]>(db.getSurveys());
  const [responses, setResponses] = useState<PulseResponse[]>(db.getAllResponses());

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(isCreateOpenInitially);
  const [selectedSurveyForResponse, setSelectedSurveyForResponse] = useState<PulseSurvey | null>(null);
  const [expandedSurveyIdForResponses, setExpandedSurveyIdForResponses] = useState<string | null>(null);

  // New Survey Form State
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newType, setNewType] = useState<'rating' | 'choice' | 'enps'>('rating');
  const [newTargetDept, setNewTargetDept] = useState('');

  // Response Form State
  const [selectedRating, setSelectedRating] = useState<number>(4);
  const [responseComment, setResponseComment] = useState('');

  const refreshData = () => {
    setSurveys(db.getSurveys());
    setResponses(db.getAllResponses());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => refreshData());
    return () => unsub();
  }, []);

  const handleDeleteSurvey = (surveyId: string, title: string) => {
    db.deleteSurvey(surveyId);
    refreshData();
  };

  const handleDeleteResponse = (responseId: string) => {
    db.deleteSurveyResponse(responseId);
    refreshData();
  };

  const handleCreateSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newQuestion) return;

    db.addSurvey({
      title: newTitle,
      question: newQuestion,
      type: newType,
      department: newTargetDept || undefined,
      status: 'active',
      createdByUserId: currentUser.id,
      createdByName: currentUser.name,
      createdByRole: currentUser.role,
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    });

    refreshData();
    setIsCreateOpen(false);
    if (onCloseCreateInitial) onCloseCreateInitial();

    setNewTitle('');
    setNewQuestion('');
  };

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurveyForResponse) return;

    db.submitPulseResponse({
      surveyId: selectedSurveyForResponse.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      department: currentUser.department,
      rating: selectedRating,
      comment: responseComment
    });

    refreshData();
    setSelectedSurveyForResponse(null);
    setResponseComment('');
  };

  const isHrOrManager = currentUser.role === 'HR' || currentUser.role === 'Manager';

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Pulse Surveys & Engagement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workplace satisfaction benchmarks, feedback analytics and eNPS trackers
          </p>
        </div>

        {isHrOrManager && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Pulse Survey
          </button>
        )}
      </div>

      {/* Survey List Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {surveys.map((survey) => {
          const surveyResps = responses.filter((r) => r.surveyId === survey.id);
          const hasUserResponded = surveyResps.some((r) => r.userId === currentUser.id);

          const isCreator = (survey.createdByUserId && survey.createdByUserId === currentUser.id) || (survey.createdByName === currentUser.name);

          // Calculate average score for rating surveys
          const avgScore =
            surveyResps.length > 0
              ? (surveyResps.reduce((acc, r) => acc + (r.rating || 0), 0) / surveyResps.length).toFixed(1)
              : 'N/A';

          return (
            <div
              key={survey.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={survey.status === 'active' ? 'success' : 'default'}>
                      {survey.status === 'active' ? 'Active Survey' : 'Closed'}
                    </Badge>
                    {isCreator && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" /> You Created This
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Closes: {survey.expiresAt}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSurvey(survey.id, survey.title)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Survey"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">{survey.title}</h3>
                <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  "{survey.question}"
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span>Created by: <strong className="text-slate-800">{survey.createdByName}</strong> ({survey.createdByRole})</span>
                  <span>Target: <strong className="text-indigo-600">{survey.department || 'All Company'}</strong></span>
                </div>
              </div>

              {/* Analytics Preview */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Responses</span>
                  <span className="text-lg font-bold text-slate-900">{surveyResps.length} answers</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Rating</span>
                  <span className="text-lg font-bold text-indigo-600">{avgScore} / 5.0</span>
                </div>
              </div>

              {/* Individual Respondent Breakdown (Creator Access Only) */}
              {isCreator ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setExpandedSurveyIdForResponses(expandedSurveyIdForResponses === survey.id ? null : survey.id)}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Ratings & Suggestions ({surveyResps.length})
                    </span>
                    {expandedSurveyIdForResponses === survey.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {expandedSurveyIdForResponses === survey.id && (
                    <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Individual Ratings & Feedback
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          Creator Access Only
                        </span>
                      </div>

                      {surveyResps.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2 text-center">No responses submitted yet for this survey.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {surveyResps.map((resp) => (
                            <div key={resp.id} className="p-2.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-indigo-600" />
                                  {resp.userName} <span className="text-[10px] font-normal text-slate-500">({resp.userRole} • {resp.department})</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-md text-[11px] flex items-center gap-1 shrink-0">
                                    {resp.rating ? `${resp.rating} ★` : (resp.selectedOptionId ? 'Choice' : 'Submitted')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteResponse(resp.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                    title="Delete response"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {resp.comment ? (
                                <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 italic flex items-start gap-1.5 mt-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <span>"{resp.comment}"</span>
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic">No suggestion comment provided.</p>
                              )}
                              <div className="text-[10px] text-slate-400 text-right">Submitted: {resp.createdAt}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="text-[11px]">
                      Confidential Survey • Only creator (<strong className="text-slate-800">{survey.createdByName}</strong>) can view ratings & suggestions.
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2">
                {hasUserResponded ? (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> You have submitted your response
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedSurveyForResponse(survey)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Answer Survey Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer Modal */}
      <Modal
        isOpen={!!selectedSurveyForResponse}
        onClose={() => setSelectedSurveyForResponse(null)}
        title={selectedSurveyForResponse?.title || 'Submit Pulse Answer'}
        subtitle="Your feedback is kept secure and confidential"
      >
        {selectedSurveyForResponse && (
          <form onSubmit={handleSubmitResponse} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-semibold text-slate-800">Question:</p>
              <p className="text-slate-600 mt-1">"{selectedSurveyForResponse.question}"</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-2">Select Rating (1 to 5 Stars):</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setSelectedRating(num)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                      selectedRating === num
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num} ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Optional Comments / Suggestions:</label>
              <textarea
                rows={3}
                placeholder="Share additional context or ideas..."
                value={responseComment}
                onChange={(e) => setResponseComment(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSurveyForResponse(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md"
              >
                Submit Response
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Survey Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Pulse Survey"
        subtitle="Broadcast a workplace sentiment check across departments"
      >
        <form onSubmit={handleCreateSurveySubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Survey Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Workload & Sprint Wellbeing Check"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Survey Question</label>
            <input
              type="text"
              required
              placeholder="e.g. How supported do you feel by your team lead?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Survey Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              >
                <option value="rating">1-5 Rating Scale</option>
                <option value="enps">eNPS 0-10 Rating</option>
                <option value="choice">Multiple Choice</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Department</label>
              <select
                value={newTargetDept}
                onChange={(e) => setNewTargetDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">All Company</option>
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="People Operations">People Operations</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md"
            >
              Launch Survey
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
