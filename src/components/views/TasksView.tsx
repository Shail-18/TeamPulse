import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Plus, Search, Filter, Calendar, Clock, 
  AlertCircle, CheckCircle2, UserCheck, Trash2, Tag, 
  ArrowRight, Shield, Sparkles, User as UserIcon, ListTodo, ChevronRight, X, Award, Zap, Check 
} from 'lucide-react';
import { User, TaskItem, TaskPriority, TaskStatus, TaskCategory } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import { canAssignTaskToRole } from '../../utils/permissions';

export function calculateUserSkillMatch(
  user: User,
  title: string,
  desc: string,
  category: string
): { matchedSkills: string[]; matchScore: number; matchLabel: string } {
  const combinedText = `${title} ${desc} ${category}`.toLowerCase();
  const userSkills = user.skills || [];

  if (!combinedText.trim()) {
    return { matchedSkills: [], matchScore: 0, matchLabel: 'Default Alignment' };
  }

  const matched = userSkills.filter((skill) => {
    const sLower = skill.toLowerCase();
    if (combinedText.includes(sLower)) return true;
    const parts = sLower.split(/[\s/]+/);
    return parts.some((p) => p.length >= 3 && combinedText.includes(p));
  });

  let score = matched.length * 40;

  if (user.title && combinedText.includes(user.title.toLowerCase())) {
    score += 25;
  }
  if (user.department && combinedText.includes(user.department.toLowerCase())) {
    score += 20;
  }

  const finalScore = Math.min(100, score);

  let label = 'General Alignment';
  if (finalScore >= 80) label = '🎯 Highest Skill Match';
  else if (finalScore >= 50) label = '✨ Good Competency Match';
  else if (matched.length > 0) label = 'Relevant Skills';

  return {
    matchedSkills: matched,
    matchScore: finalScore,
    matchLabel: label
  };
}

interface TasksViewProps {
  currentUser: User;
  isCreateOpenInitially?: boolean;
  onCloseCreateInitial?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  currentUser,
  isCreateOpenInitially = false,
  onCloseCreateInitial
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>(db.getTasks());
  const [allUsers, setAllUsers] = useState<User[]>(db.getUsers());

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'my-todo' | 'assigned-by-me' | 'blockers' | 'workload' | 'meeting-actions' | 'team-matrix'>('my-todo');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isCreateOpenInitially);
  const [assignMode, setAssignMode] = useState<'delegate' | 'personal'>('personal');
  const [blockerModalTask, setBlockerModalTask] = useState<TaskItem | null>(null);
  const [reassignModalUser, setReassignModalUser] = useState<User | null>(null);
  const [transferTaskModalItem, setTransferTaskModalItem] = useState<TaskItem | null>(null);
  const [singleTransferTargetUserId, setSingleTransferTargetUserId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('Workload capacity rebalancing');

  // New Task Form State
  const [targetUserId, setTargetUserId] = useState<string>(currentUser.id);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Medium');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('Project Work');
  const [taskEstimatedHours, setTaskEstimatedHours] = useState<number>(8);
  const [taskCrossTeam, setTaskCrossTeam] = useState<string>('None');
  const [taskIsMeetingAction, setTaskIsMeetingAction] = useState<boolean>(false);
  const [taskMeetingTitle, setTaskMeetingTitle] = useState<string>('');
  const [taskDueDate, setTaskDueDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Blocker Modal Form State
  const [blockerReason, setBlockerReason] = useState('');
  const [blockerCategory, setBlockerCategory] = useState<'API/Specs' | '3rd-Party' | 'Design Assets' | 'Approval' | 'Resource/Staff' | 'Cross-Team'>('API/Specs');
  const [blockedCount, setBlockedCount] = useState<number>(1);

  // Reassign Target User State
  const [reassignTargetUserId, setReassignTargetUserId] = useState<string>('');

  // Toast / Inline Notice state (replaces window.alert for iframe compatibility)
  const [toastBanner, setToastBanner] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Inline Quick Skill Add State for Create / Delegate Modal
  const [inlineSkillInput, setInlineSkillInput] = useState('');

  const isAdminOrHr = currentUser.role === 'HR';

  const handleAddInlineSkill = (userId: string, skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return;
    const existing = target.skills || [];
    if (existing.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;

    if (isAdminOrHr) {
      db.addSkillToCatalog(trimmed);
    }

    const updated = [...existing, trimmed];
    db.updateUserSkills(userId, updated);
    setAllUsers([...db.getUsers()]);
    setInlineSkillInput('');
    setToastBanner({
      type: 'success',
      text: `Added skill "${trimmed}" to ${target.name}'s profile!`
    });
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setTasks([...db.getTasks()]);
      setAllUsers([...db.getUsers()]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isCreateOpenInitially) {
      setIsModalOpen(true);
    }
  }, [isCreateOpenInitially]);

  const refreshData = () => {
    setTasks([...db.getTasks()]);
  };

  // Eligible assignees (lower position employees or all depending on role)
  const assignableUsers = allUsers.filter((u) => {
    if (u.id === currentUser.id) return false;
    // HR & Manager can assign to anyone below or in team; Team Lead can assign to Employees
    return canAssignTaskToRole(currentUser.role, u.role);
  });

  const canDelegateTasks = assignableUsers.length > 0;

  // Auto-sync targetUserId when switching to delegate mode
  useEffect(() => {
    if (assignMode === 'delegate' && assignableUsers.length > 0) {
      if (!assignableUsers.some(u => u.id === targetUserId)) {
        setTargetUserId(assignableUsers[0].id);
      }
    } else if (assignMode === 'personal' && targetUserId !== currentUser.id) {
      setTargetUserId(currentUser.id);
    }
  }, [assignMode, assignableUsers, targetUserId, currentUser.id]);

  // Handler for creating task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let targetUser = currentUser;
    if (assignMode === 'delegate' && targetUserId !== currentUser.id) {
      const found = allUsers.find((u) => u.id === targetUserId);
      if (found) targetUser = found;
    }

    db.addTask({
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      assignedToUserId: targetUser.id,
      assignedToUserName: targetUser.name,
      assignedToUserRole: targetUser.role,
      assignedToUserAvatar: targetUser.avatar,
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.name,
      assignedByUserRole: currentUser.role,
      assignedByUserAvatar: currentUser.avatar,
      priority: taskPriority,
      status: 'To Do',
      category: assignMode === 'personal' ? 'Personal' : taskCategory,
      dueDate: taskDueDate,
      estimatedHours: taskEstimatedHours || 8,
      crossTeamDependency: taskCrossTeam !== 'None' ? taskCrossTeam : undefined,
      isMeetingActionItem: taskIsMeetingAction,
      meetingTitle: taskIsMeetingAction && taskMeetingTitle ? taskMeetingTitle.trim() : undefined
    });

    // Reset Form
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('Medium');
    setTaskCategory('Project Work');
    setTaskEstimatedHours(8);
    setTaskCrossTeam('None');
    setTaskIsMeetingAction(false);
    setTaskMeetingTitle('');
    setIsModalOpen(false);
    if (onCloseCreateInitial) onCloseCreateInitial();
    refreshData();
  };

  const handleToggleBlocker = (task: TaskItem) => {
    if (task.isBlocked) {
      db.updateTask(task.id, {
        isBlocked: false,
        blockerReason: undefined,
        blockerCategory: undefined,
        blockedTasksCount: undefined
      });
      refreshData();
    } else {
      setBlockerModalTask(task);
      setBlockerReason(task.blockerReason || '');
      setBlockerCategory(task.blockerCategory || 'API/Specs');
      setBlockedCount(task.blockedTasksCount || 1);
    }
  };

  const handleSaveBlocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerModalTask) return;
    db.updateTask(blockerModalTask.id, {
      isBlocked: true,
      blockerReason: blockerReason.trim() || 'Awaiting resolution',
      blockerCategory: blockerCategory,
      blockedTasksCount: blockedCount || 1
    });
    setBlockerModalTask(null);
    refreshData();
  };

  const handleExecuteEmergencyReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalUser || !reassignTargetUserId) return;
    const targetUser = allUsers.find(u => u.id === reassignTargetUserId);
    if (!targetUser) return;

    const count = db.reassignAllTasks(reassignModalUser.id, targetUser);
    setToastBanner({
      type: 'success',
      text: `Successfully reassigned ${count} active task(s) from ${reassignModalUser.name} to ${targetUser.name}.`
    });
    setReassignModalUser(null);
    refreshData();
  };

  const handleSingleTaskTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTaskModalItem || !singleTransferTargetUserId) return;
    const targetUser = allUsers.find(u => u.id === singleTransferTargetUserId);
    if (!targetUser) return;

    const previousAssigneeName = transferTaskModalItem.assignedToUserName;

    db.updateTask(transferTaskModalItem.id, {
      assignedToUserId: targetUser.id,
      assignedToUserName: targetUser.name,
      assignedToUserRole: targetUser.role,
      assignedToUserAvatar: targetUser.avatar
    });

    db.addNotification({
      userId: targetUser.id,
      title: 'Task Transferred to You',
      message: `Task "${transferTaskModalItem.title}" was transferred from ${previousAssigneeName} to you (${transferReason || 'Capacity rebalancing'}).`,
      type: 'task'
    });

    setToastBanner({
      type: 'success',
      text: `Task "${transferTaskModalItem.title}" transferred from ${previousAssigneeName} to ${targetUser.name}.`
    });
    setTransferTaskModalItem(null);
    refreshData();
  };

  const handleAutoSelectBestSkillMatch = (assignableList: User[]) => {
    if (assignableList.length === 0) return;

    let bestUser = assignableList[0];
    let bestScore = -999;

    assignableList.forEach((u) => {
      const uActiveTasks = tasks.filter(t => t.assignedToUserId === u.id && t.status !== 'Completed');
      const uHours = uActiveTasks.reduce((sum, t) => sum + (t.estimatedHours || 8), 0);
      const uMax = u.maxWeeklyHours || 40;
      const uCapPct = Math.round((uHours / uMax) * 100);

      const match = calculateUserSkillMatch(u, taskTitle, taskDescription, taskCategory);

      // Combine skill match score and available capacity
      let score = (match.matchScore * 1.5) + (100 - uCapPct);
      if (uCapPct >= 85) score -= 300; // Penalize overloaded employees (>85%)

      if (score > bestScore) {
        bestScore = score;
        bestUser = u;
      }
    });

    setTargetUserId(bestUser.id);
    const bestMatch = calculateUserSkillMatch(bestUser, taskTitle, taskDescription, taskCategory);
    setToastBanner({
      type: 'info',
      text: `💡 Auto-Matched ${bestUser.name}: ${bestMatch.matchScore}% Skill Competency Match (${bestMatch.matchLabel})`
    });
  };

  const handleStatusToggle = (taskId: string, currentStatus: TaskStatus) => {
    let newStatus: TaskStatus = 'In Progress';
    if (currentStatus === 'To Do') newStatus = 'In Progress';
    else if (currentStatus === 'In Progress') newStatus = 'Completed';
    else if (currentStatus === 'Completed') newStatus = 'To Do';

    db.updateTaskStatus(taskId, newStatus);
    refreshData();
  };

  const handleDeleteTask = (taskId: string) => {
    db.deleteTask(taskId);
    refreshData();
  };

  // Filtered Task Sets
  const myTasks = tasks.filter((t) => t.assignedToUserId === currentUser.id);
  const delegatedTasks = tasks.filter((t) => t.assignedByUserId === currentUser.id && t.assignedToUserId !== currentUser.id);
  const blockedTasksList = tasks.filter((t) => t.isBlocked);
  const meetingActionTasksList = tasks.filter((t) => t.isMeetingActionItem);

  // Apply filters function
  const filterTaskList = (list: TaskItem[]) => {
    return list.filter((t) => {
      const matchesSearch = !searchQuery || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.assignedToUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.blockerReason && t.blockerReason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.meetingTitle && t.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  };

  const currentDisplayList = 
    activeTab === 'my-todo' ? filterTaskList(myTasks) :
    activeTab === 'assigned-by-me' ? filterTaskList(delegatedTasks) :
    activeTab === 'blockers' ? filterTaskList(blockedTasksList) :
    activeTab === 'meeting-actions' ? filterTaskList(meetingActionTasksList) :
    filterTaskList(tasks);

  // Statistics calculation dynamic per active tab
  const activeTabTasks = 
    activeTab === 'my-todo' ? myTasks :
    activeTab === 'assigned-by-me' ? delegatedTasks :
    activeTab === 'blockers' ? blockedTasksList :
    activeTab === 'meeting-actions' ? meetingActionTasksList :
    tasks;

  const completedCount = activeTabTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = activeTabTasks.filter((t) => t.status === 'In Progress').length;
  const pendingCount = activeTabTasks.filter((t) => t.status === 'To Do').length;
  const urgentCount = activeTabTasks.filter((t) => (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Completed').length;
  const completionPercentage = activeTabTasks.length > 0 ? Math.round((completedCount / activeTabTasks.length) * 100) : 0;

  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'Urgent': return 'danger';
      case 'High': return 'warning';
      case 'Medium': return 'indigo';
      case 'Low': default: return 'neutral';
    }
  };

  const getStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'indigo';
      case 'To Do': default: return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="w-7 h-7 text-indigo-600" /> Tasks & To-Do List
            </h1>
            <Badge variant="indigo">
              {currentUser.role} Level
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track deliverables, delegate tasks to team members, and manage daily priorities
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canDelegateTasks && (
            <button
              onClick={() => {
                setAssignMode('delegate');
                if (assignableUsers.length > 0) {
                  setTargetUserId(assignableUsers[0].id);
                }
                setIsModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <UserCheck className="w-4 h-4" /> Assign Task to Team
            </button>
          )}

          <button
            onClick={() => {
              setAssignMode('personal');
              setTargetUserId(currentUser.id);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Personal Task
          </button>
        </div>
      </div>

      {/* Progress & Quick Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Progress Card */}
        <div 
          onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); }}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 group-hover:text-emerald-700 transition-colors">Overall Progress</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{completionPercentage}%</div>
              <p className="text-[10px] text-slate-400 mt-0.5">{completedCount} of {activeTabTasks.length} tasks completed</p>
            </div>
            <div 
              className="w-12 h-12 rounded-full p-1 flex items-center justify-center shrink-0 shadow-2xs transition-all duration-500"
              style={{
                background: `conic-gradient(#10b981 ${completionPercentage}%, #e2e8f0 0)`
              }}
              title={`Completion: ${completionPercentage}%`}
            >
              <div className="w-full h-full bg-emerald-50/90 rounded-full flex items-center justify-center text-[11px] font-bold text-emerald-700">
                {completionPercentage}%
              </div>
            </div>
          </div>
          {/* Animated Visual Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }} 
            />
          </div>
        </div>

        {/* In Progress Card */}
        <div 
          onClick={() => setStatusFilter('In Progress')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-indigo-700 transition-colors">In Progress</span>
            <div className="text-2xl font-bold text-indigo-600 mt-0.5">{inProgressCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Active deliverables</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* High / Urgent Priority Card */}
        <div 
          onClick={() => setPriorityFilter(priorityFilter === 'High' ? 'Urgent' : 'High')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-rose-700 transition-colors">High / Urgent Priority</span>
            <div className="text-2xl font-bold text-rose-600 mt-0.5">{urgentCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Requires immediate focus</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Delegated Tasks Card */}
        <div 
          onClick={() => {
            if (canDelegateTasks) setActiveTab('assigned-by-me');
          }}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-purple-700 transition-colors">Delegated Tasks</span>
            <div className="text-2xl font-bold text-purple-600 mt-0.5">{delegatedTasks.length}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Assigned to team members</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('my-todo')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'my-todo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-4 h-4 text-emerald-600" /> My To-Do List ({myTasks.length})
            </button>

            {canDelegateTasks && (
              <button
                onClick={() => setActiveTab('assigned-by-me')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'assigned-by-me'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Assigned by Me ({delegatedTasks.length})
              </button>
            )}

            <button
              onClick={() => setActiveTab('blockers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'blockers'
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Blockers ({blockedTasksList.length})
            </button>

            <button
              onClick={() => setActiveTab('workload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'workload'
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-300 shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Workload & Capacity
            </button>

            <button
              onClick={() => setActiveTab('meeting-actions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'meeting-actions'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Meeting Actions ({meetingActionTasksList.length})
            </button>

            {currentUser.role !== 'Employee' && (
              <button
                onClick={() => setActiveTab('team-matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'team-matrix'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" /> All Team Tasks ({tasks.length})
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500 font-medium shrink-0">
            Showing {currentDisplayList.length} task(s)
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks or team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-9 pr-8 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="All">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium shrink-0">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium shrink-0">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="All">All Categories</option>
              <option value="Project Work">Project Work</option>
              <option value="Review & Approval">Review & Approval</option>
              <option value="Training & Onboarding">Training & Onboarding</option>
              <option value="Administrative">Administrative</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
        </div>

        {/* Workload & Capacity Matrix View */}
        {activeTab === 'workload' ? (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> Team Workload Distribution & Overload Risk Radar
                </h3>
                <p className="text-xs text-indigo-800 mt-0.5">
                  Proactively detect team bottlenecks, unassigned hours, and emergency task reassignment risks before deadlines slip.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allUsers.map((user) => {
                const userActiveTasks = tasks.filter((t) => t.assignedToUserId === user.id && t.status !== 'Completed');
                const userActiveHours = userActiveTasks.reduce((sum, t) => sum + (t.estimatedHours || 8), 0);
                const maxHours = user.maxWeeklyHours || 40;
                const capacityPct = Math.round((userActiveHours / maxHours) * 100);
                const isOverloaded = capacityPct >= 85;

                return (
                  <div key={user.id} className={`p-4 rounded-2xl border transition-all ${
                    isOverloaded ? 'bg-rose-50/40 border-rose-200 shadow-xs' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            {user.name}
                            {user.isKeyPersonRisk && (
                              <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-black shrink-0" title="Key Person Risk: High Single Point of Failure">
                                🔑 Key Person Risk
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-500">{user.title} • {user.department}</p>
                        </div>
                      </div>

                      {isOverloaded ? (
                        <Badge variant="danger" size="sm">⚠️ OVERLOADED</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Healthy</Badge>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                        <span>Active Hours Loaded:</span>
                        <span className={`font-bold ${isOverloaded ? 'text-rose-600' : 'text-slate-800'}`}>
                          {userActiveHours}h / {maxHours}h ({capacityPct}%)
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            capacityPct > 100 ? 'bg-rose-600' : capacityPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(capacityPct, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Active Tasks: <strong>{userActiveTasks.length}</strong></span>
                        <span>Blocked Tasks: <strong className="text-amber-600">{userActiveTasks.filter(t => t.isBlocked).length}</strong></span>
                      </div>
                    </div>

                    {/* Active Tasks Breakdown for Transfer */}
                    {userActiveTasks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Loaded Tasks ({userActiveTasks.length}):
                        </span>
                        {userActiveTasks.map((t) => (
                          <div key={t.id} className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 truncate">{t.title}</p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <span className={`font-bold ${t.priority === 'Urgent' ? 'text-rose-600' : 'text-slate-600'}`}>{t.priority}</span>
                                • {t.estimatedHours || 8}h • Due {t.dueDate}
                              </p>
                            </div>

                            {(currentUser.role === 'HR' || currentUser.role === 'Manager' || currentUser.role === 'Team Lead' || t.assignedByUserId === currentUser.id) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTransferTaskModalItem(t);
                                  const eligible = allUsers.filter(u => u.id !== user.id);
                                  if (eligible.length > 0) setSingleTransferTargetUserId(eligible[0].id);
                                }}
                                className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg font-bold text-[10px] shrink-0 transition-all flex items-center gap-0.5"
                                title="Transfer this task to relieve capacity"
                              >
                                <ArrowRight className="w-3 h-3 text-indigo-600" /> Transfer
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {userActiveTasks.length > 0 && (currentUser.role === 'HR' || currentUser.role === 'Manager' || currentUser.role === 'Team Lead') && (
                      <button
                        type="button"
                        onClick={() => {
                          setReassignModalUser(user);
                          const eligible = allUsers.filter(u => u.id !== user.id);
                          if (eligible.length > 0) setReassignTargetUserId(eligible[0].id);
                        }}
                        className="mt-3 w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Emergency Reassign All Tasks
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : currentDisplayList.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">No tasks found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || statusFilter !== 'All' || priorityFilter !== 'All'
                ? 'Try adjusting your search query or status/priority filters.'
                : 'All clear! No pending tasks in this list.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentDisplayList.map((task) => {
              const isAssignedToMe = task.assignedToUserId === currentUser.id;
              const isAssignedByMe = task.assignedByUserId === currentUser.id;
              const isOverdue = task.status !== 'Completed' && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    task.status === 'Completed'
                      ? 'bg-slate-50/70 border-slate-200 opacity-80'
                      : isOverdue
                      ? 'bg-rose-50/30 border-rose-200'
                      : 'bg-white border-slate-200/90 hover:border-indigo-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Checkbox & Task details */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(task.id, task.status)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : task.status === 'In Progress'
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-600'
                            : 'border-slate-300 hover:border-slate-400 bg-white'
                        }`}
                        title="Click to cycle status (To Do -> In Progress -> Completed)"
                      >
                        {task.status === 'Completed' && <CheckCircle2 className="w-4 h-4" />}
                        {task.status === 'In Progress' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </button>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold tracking-tight ${
                            task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}>
                            {task.title}
                          </h4>

                          <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                            {task.priority} Priority
                          </Badge>

                          <Badge variant={getStatusBadgeVariant(task.status)} size="sm">
                            {task.status}
                          </Badge>

                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-slate-400" /> {task.category}
                          </span>

                          {task.estimatedHours && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-slate-500" /> {task.estimatedHours}h
                            </span>
                          )}

                          {task.crossTeamDependency && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                              <ArrowRight className="w-2.5 h-2.5 text-purple-500" /> Dep: {task.crossTeamDependency}
                            </span>
                          )}

                          {task.isMeetingActionItem && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                              <CheckSquare className="w-2.5 h-2.5 text-indigo-500" /> Action from: {task.meetingTitle || 'Meeting'}
                            </span>
                          )}
                        </div>

                        {/* Blocker Alert Banner on Task Card */}
                        {task.isBlocked && (
                          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-900">BLOCKED [{task.blockerCategory || 'General'}]: </span>
                                <span className="text-amber-800">{task.blockerReason || 'Waiting on dependencies'}</span>
                                {task.blockedTasksCount && task.blockedTasksCount > 1 && (
                                  <span className="ml-2 font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[10px]">
                                    ⚠️ Delays {task.blockedTasksCount} downstream tasks
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleBlocker(task)}
                              className="text-[11px] font-bold text-amber-800 hover:text-emerald-700 underline shrink-0"
                            >
                              Resolve Blocker
                            </button>
                          </div>
                        )}

                        {task.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                          {/* Assignee / Assigner Info */}
                          <div className="flex items-center gap-1.5">
                            {task.assignedToUserId === task.assignedByUserId ? (
                              <span className="text-slate-500 font-medium">Personal Task</span>
                            ) : (
                              <>
                                <span className="text-slate-400">Assigned by:</span>
                                <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                  {task.assignedByUserAvatar && (
                                    <img src={task.assignedByUserAvatar} alt={task.assignedByName} className="w-4 h-4 rounded-full object-cover" />
                                  )}
                                  <span>{task.assignedByName} ({task.assignedByUserRole})</span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Target user if viewing delegated */}
                          {activeTab !== 'my-todo' && task.assignedToUserId !== task.assignedByUserId && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">Assignee:</span>
                              <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                {task.assignedToUserAvatar && (
                                  <img src={task.assignedToUserAvatar} alt={task.assignedToUserName} className="w-4 h-4 rounded-full object-cover" />
                                )}
                                <span>{task.assignedToUserName} ({task.assignedToUserRole})</span>
                              </div>
                            </div>
                          )}

                          {/* Due Date */}
                          <div className={`flex items-center gap-1 font-semibold ${
                            isOverdue ? 'text-rose-600' : 'text-slate-600'
                          }`}>
                            <Calendar className="w-3 h-3" /> Due: {task.dueDate}
                            {isOverdue && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold ml-1">Overdue</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleToggleBlocker(task)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                          task.isBlocked
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700'
                        }`}
                        title="Flag or manage blockers delaying this task"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {task.isBlocked ? 'Blocked' : 'Blocker?'}
                      </button>

                      {(isAssignedByMe || currentUser.role === 'HR' || currentUser.role === 'Manager' || currentUser.role === 'Team Lead') && (
                        <button
                          type="button"
                          onClick={() => {
                            setTransferTaskModalItem(task);
                            const eligible = allUsers.filter(u => u.id !== task.assignedToUserId);
                            if (eligible.length > 0) setSingleTransferTargetUserId(eligible[0].id);
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                          title="Transfer task to another team member to relieve workload"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-600" /> Transfer
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStatusToggle(task.id, task.status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                          task.status === 'Completed'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80'
                        }`}
                      >
                        {task.status === 'Completed' ? 'Mark To-Do' : task.status === 'In Progress' ? 'Mark Complete' : 'Start Task'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Assign Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={assignMode === 'delegate' ? 'Assign Task to Team Member' : 'Add Personal To-Do Task'}
        subtitle={assignMode === 'delegate' 
          ? 'Delegate work items to lower-position team members with priority and due date' 
          : 'Create a personal work item or task for your personal checklist'}
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          {/* Toast / Notification Banner */}
          {toastBanner && (
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-semibold ${
              toastBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                {toastBanner.text}
              </span>
              <button
                type="button"
                onClick={() => setToastBanner(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Assign Mode Toggle */}
          {canDelegateTasks && (
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl mb-2">
              <button
                type="button"
                onClick={() => {
                  setAssignMode('delegate');
                  if (assignableUsers.length > 0) setTargetUserId(assignableUsers[0].id);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  assignMode === 'delegate' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> Delegate to Team Member
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignMode('personal');
                  setTargetUserId(currentUser.id);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  assignMode === 'personal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Personal To-Do
              </button>
            </div>
          )}

          {/* Delegate Employee Selector & Live Capacity / Skill Match Indicator */}
          {assignMode === 'delegate' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  Select Team Member (Assignee) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoSelectBestSkillMatch(assignableUsers)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 transition-all flex items-center gap-1 shadow-2xs"
                  title="Auto-selects assignee with optimal skill competency match and low workload"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" /> Auto-Match Best Skill & Capacity
                </button>
              </div>

              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                required
              >
                {assignableUsers.map((u) => {
                  const uActiveTasks = tasks.filter(t => t.assignedToUserId === u.id && t.status !== 'Completed');
                  const uHours = uActiveTasks.reduce((sum, t) => sum + (t.estimatedHours || 8), 0);
                  const uMax = u.maxWeeklyHours || 40;
                  const uCapPct = Math.round((uHours / uMax) * 100);
                  const isOverloaded = uCapPct >= 85;
                  const match = calculateUserSkillMatch(u, taskTitle, taskDescription, taskCategory);

                  return (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.title} ({uCapPct}% Load | {match.matchScore > 0 ? `${match.matchScore}% Skill Match` : 'General Fit'}) {isOverloaded ? '⚠️ Overloaded (>85%)' : ''}
                    </option>
                  );
                })}
              </select>

              {/* Live Skill Breakdown Panel for Selected Assignee */}
              {(() => {
                const target = allUsers.find(u => u.id === targetUserId);
                if (!target) return null;
                const match = calculateUserSkillMatch(target, taskTitle, taskDescription, taskCategory);

                return (
                  <div className="p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-600" /> Skill Alignment for {target.name}:
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                        match.matchScore >= 70 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {match.matchLabel} ({match.matchScore}%)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {target.skills && target.skills.length > 0 ? (
                        target.skills.map((sk, idx) => {
                          const isMatched = match.matchedSkills.includes(sk);
                          return (
                            <span
                              key={idx}
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                                isMatched
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-white text-indigo-900 border border-indigo-200'
                              }`}
                            >
                              {isMatched ? <Check className="w-3 h-3 text-white" /> : <Zap className="w-2.5 h-2.5 text-indigo-500" />}
                              {sk}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No skills documented in employee profile yet.</span>
                      )}
                    </div>

                    {/* Inline Quick Add Skill Box */}
                    <div className="pt-2 border-t border-indigo-200/60 space-y-1.5">
                      {isAdminOrHr ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder={`Add new custom skill to catalog (e.g., Python)...`}
                            value={inlineSkillInput}
                            onChange={(e) => setInlineSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddInlineSkill(target.id, inlineSkillInput);
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddInlineSkill(target.id, inlineSkillInput)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all flex items-center gap-1 shrink-0"
                          >
                            <Plus className="w-3 h-3" /> Add Skill
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-indigo-800 font-medium italic block">
                          Select skills from pre-approved catalog below:
                        </span>
                      )}

                      {/* Quick skill chips from catalog */}
                      <div className="flex flex-wrap gap-1">
                        {db.getSkillCatalog()
                          .filter((s) => !(target.skills || []).some((sk) => sk.toLowerCase() === s.toLowerCase()))
                          .slice(0, 8)
                          .map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleAddInlineSkill(target.id, s)}
                              className="px-2 py-0.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-semibold transition-colors flex items-center gap-0.5"
                            >
                              <Plus className="w-2.5 h-2.5" /> {s}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Live Overload Warning Banner */}
              {(() => {
                const target = allUsers.find(u => u.id === targetUserId);
                if (!target) return null;
                const activeCount = tasks.filter(t => t.assignedToUserId === target.id && t.status !== 'Completed').length;
                const activeHours = tasks.filter(t => t.assignedToUserId === target.id && t.status !== 'Completed').reduce((sum, t) => sum + (t.estimatedHours || 8), 0);
                const targetMax = target.maxWeeklyHours || 40;
                const targetCapPct = Math.round((activeHours / targetMax) * 100);
                const isOverloaded = targetCapPct >= 85;

                if (isOverloaded) {
                  return (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>Overload Warning ({targetCapPct}% Capacity):</strong> {target.name} currently has {activeCount} active tasks ({activeHours}h / {targetMax}h loaded, {targetCapPct}%). Assigning work here exceeds the 85% safe workload threshold.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              <p className="text-[10px] text-slate-400 mt-0.5">
                Authorized role hierarchy: As a {currentUser.role}, you can assign tasks to lower-position roles.
              </p>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Complete Q3 Security Review, Update Design Tokens"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Description / Action Steps
            </label>
            <textarea
              rows={2}
              placeholder="Add key deliverables, links, or context instructions..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Priority & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Category</label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
              >
                <option value="Project Work">Project Work</option>
                <option value="Review & Approval">Review & Approval</option>
                <option value="Training & Onboarding">Training & Onboarding</option>
                <option value="Administrative">Administrative</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Est. Hours</label>
              <input
                type="number"
                min={1}
                max={80}
                value={taskEstimatedHours}
                onChange={(e) => setTaskEstimatedHours(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Cross-Team Dependency & Meeting Action Item Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Cross-Team Dependency</label>
              <select
                value={taskCrossTeam}
                onChange={(e) => setTaskCrossTeam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
              >
                <option value="None">None (Internal to Team)</option>
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing & Growth">Marketing & Growth</option>
                <option value="Sales & Customer Success">Sales & Customer Success</option>
                <option value="Finance & Legal">Finance & Legal</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Meeting Action Item?</label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="meetingActionCheck"
                  checked={taskIsMeetingAction}
                  onChange={(e) => setTaskIsMeetingAction(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="meetingActionCheck" className="font-semibold text-slate-700">
                  Created from a meeting decision
                </label>
              </div>
            </div>
          </div>

          {taskIsMeetingAction && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">Meeting Title / Subject</label>
              <input
                type="text"
                placeholder="e.g. Q3 Sprint Planning Sync, Design Review Meeting"
                value={taskMeetingTitle}
                onChange={(e) => setTaskMeetingTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
            >
              {assignMode === 'delegate' ? 'Assign Task Now' : 'Create Personal Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Flag / Manage Blocker Modal */}
      {blockerModalTask && (
        <Modal
          isOpen={!!blockerModalTask}
          onClose={() => setBlockerModalTask(null)}
          title={`Flag Task Blocker: "${blockerModalTask.title}"`}
          subtitle="Document the root cause of delay to prevent hidden bottlenecks and track cascading delays"
        >
          <form onSubmit={handleSaveBlocker} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Blocker Root Cause / Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain what is blocking this task (e.g. Missing API docs, pending design sign-off, third party outage)..."
                value={blockerReason}
                onChange={(e) => setBlockerReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Blocker Category</label>
                <select
                  value={blockerCategory}
                  onChange={(e) => setBlockerCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                >
                  <option value="API/Specs">API / Specs Missing</option>
                  <option value="3rd-Party">3rd-Party Service Dependency</option>
                  <option value="Design Assets">Design Assets Missing</option>
                  <option value="Approval">Awaiting Executive Approval</option>
                  <option value="Resource/Staff">Resource / Staffing Shortage</option>
                  <option value="Cross-Team">Cross-Team Delay</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Downstream Tasks Delayed</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={blockedCount}
                  onChange={(e) => setBlockedCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockerModalTask(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md"
              >
                Save Blocker Record
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Emergency Reassign Modal */}
      {reassignModalUser && (
        <Modal
          isOpen={!!reassignModalUser}
          onClose={() => setReassignModalUser(null)}
          title={`Emergency Reassign Tasks for ${reassignModalUser.name}`}
          subtitle={`Bulk transfer all ${tasks.filter(t => t.assignedToUserId === reassignModalUser.id && t.status !== 'Completed').length} active tasks to another team member`}
        >
          <form onSubmit={handleExecuteEmergencyReassign} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
              ⚠️ Use emergency reassignment when team members go on unplanned leave, face high workload stress, or leave without handover.
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Select Replacement Recipient <span className="text-rose-500">*</span>
              </label>
              <select
                value={reassignTargetUserId}
                onChange={(e) => setReassignTargetUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                required
              >
                {allUsers
                  .filter((u) => u.id !== reassignModalUser.id)
                  .map((u) => {
                    const uActive = tasks.filter(t => t.assignedToUserId === u.id && t.status !== 'Completed');
                    const uHours = uActive.reduce((sum, t) => sum + (t.estimatedHours || 8), 0);
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.title} ({uActive.length} active tasks, {uHours}h loaded)
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassignModalUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" /> Transfer All Active Tasks
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transfer Single Task Modal */}
      {transferTaskModalItem && (
        <Modal
          isOpen={!!transferTaskModalItem}
          onClose={() => setTransferTaskModalItem(null)}
          title={`Transfer Task: "${transferTaskModalItem.title}"`}
          subtitle={`Reassign this task from ${transferTaskModalItem.assignedToUserName} to relieve workload or balance team capacity.`}
        >
          <form onSubmit={handleSingleTaskTransfer} className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 font-medium">
              💡 Reassigning tasks when employees are overloaded prevents burnout, reduces project bottleneck risks, and maintains sprint velocity.
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Select New Assignee <span className="text-rose-500">*</span>
              </label>
              <select
                value={singleTransferTargetUserId}
                onChange={(e) => setSingleTransferTargetUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 text-xs"
                required
              >
                {allUsers
                  .filter((u) => u.id !== transferTaskModalItem.assignedToUserId)
                  .map((u) => {
                    const uActive = tasks.filter(t => t.assignedToUserId === u.id && t.status !== 'Completed');
                    const uHours = uActive.reduce((sum, t) => sum + (t.estimatedHours || 8), 0);
                    const uMax = u.maxWeeklyHours || 40;
                    const uCapPct = Math.round((uHours / uMax) * 100);
                    const isOverloaded = uCapPct >= 85;
                    const match = calculateUserSkillMatch(u, transferTaskModalItem.title, transferTaskModalItem.description, transferTaskModalItem.category);
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.title} ({uCapPct}% Load | {match.matchScore > 0 ? `${match.matchScore}% Skill Match` : 'General Fit'}) {isOverloaded ? '⚠️ Overloaded (>85%)' : '✅ Available (<85%)'}
                      </option>
                    );
                  })}
              </select>

              {/* Live Skill Match Preview for Transfer Destination */}
              {(() => {
                const target = allUsers.find(u => u.id === singleTransferTargetUserId);
                if (!target) return null;
                const match = calculateUserSkillMatch(target, transferTaskModalItem.title, transferTaskModalItem.description, transferTaskModalItem.category);
                return (
                  <div className="mt-2 p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-indigo-950">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-indigo-600" /> Transfer Target Competency:
                      </span>
                      <span className="text-[10px] text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        {match.matchLabel} ({match.matchScore}%)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {target.skills && target.skills.length > 0 ? (
                        target.skills.map((sk, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              match.matchedSkills.includes(sk)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-indigo-800 border border-indigo-200'
                            }`}
                          >
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No skills documented</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Transfer Reason / Handover Note
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Workload capacity rebalancing, priority reallocation..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferTaskModalItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" /> Execute Task Transfer
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
