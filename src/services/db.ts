import { 
  User, Team, PulseSurvey, PulseResponse, LeaveRequest, PeerShoutout, PerformanceReview, TeamMetric, NotificationItem, UserRole, TaskItem, TaskStatus
} from '../types';
import { 
  INITIAL_USERS, INITIAL_TEAMS, INITIAL_PULSE_SURVEYS, INITIAL_PULSE_RESPONSES, INITIAL_LEAVE_REQUESTS,
  INITIAL_PEER_SHOUTOUTS, INITIAL_PERFORMANCE_REVIEWS, INITIAL_TEAM_METRICS, INITIAL_NOTIFICATIONS, INITIAL_TASKS
} from './mockData';
import { sanitizeAvatar } from '../utils/avatar';
import {
  ensureFirebaseAuth,
  setUserProfile,
  updateUserProfile,
  deleteUserProfile,
  saveLeaveRequest,
  deleteLeaveRequest as deleteLeaveInFirestore,
  saveTeam as saveTeamInFirestore,
  deleteTeam as deleteTeamInFirestore,
  saveTaskInFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  saveShoutout as saveShoutoutInFirestore,
  deleteShoutout as deleteShoutoutInFirestore,
  saveSurvey as saveSurveyInFirestore,
  saveSurveyResponse as saveSurveyResponseInFirestore,
  deleteSurvey as deleteSurveyInFirestore,
  deleteSurveyResponse as deleteSurveyResponseInFirestore,
  saveNotification as saveNotifInFirestore,
  saveSkillCatalogInFirestore,
  saveReviewInFirestore,
  subscribeUserProfiles,
  subscribeLeaveRequests,
  subscribeTeams,
  subscribeTasks,
  subscribeShoutouts,
  subscribeSurveys,
  subscribeSurveyResponses,
  subscribeNotifications,
  subscribeSkillCatalog,
  subscribeReviews
} from './firestoreService';

type Listener = () => void;

class LocalDatabase {
  private listeners: Set<Listener> = new Set();

  private users: User[] = [];
  private teams: Team[] = [];
  private surveys: PulseSurvey[] = [];
  private responses: PulseResponse[] = [];
  private leaves: LeaveRequest[] = [];
  private shoutouts: PeerShoutout[] = [];
  private reviews: PerformanceReview[] = [];
  private metrics: TeamMetric[] = [];
  private notifications: NotificationItem[] = [];
  private tasks: TaskItem[] = [];
  private skillCatalog: string[] = [
    'React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'System Architecture',
    'UX Design', 'Project Management', 'DevOps', 'Cloud Infra', 'Data Analytics',
    'API Design', 'Security & Audit', 'Customer Success', 'Mobile Dev', 'Figma',
    'GraphQL', 'Tailwind CSS', 'Docker', 'Kubernetes'
  ];

  constructor() {
    this.init();
    this.initFirestoreSubscriptions();
  }

  private init() {
    try {
      // Clear legacy sample/demo data keys
      const resetFlag = localStorage.getItem('teampulse_purge_user_data_v2');
      if (!resetFlag) {
        localStorage.removeItem('teampulse_users');
        localStorage.removeItem('teampulse_teams');
        localStorage.removeItem('teampulse_surveys');
        localStorage.removeItem('teampulse_responses');
        localStorage.removeItem('teampulse_leaves');
        localStorage.removeItem('teampulse_shoutouts');
        localStorage.removeItem('teampulse_reviews');
        localStorage.removeItem('teampulse_metrics');
        localStorage.removeItem('teampulse_notifs');
        localStorage.removeItem('teampulse_tasks');
        localStorage.removeItem('teampulse_current_user_id');
        localStorage.setItem('teampulse_purge_user_data_v2', 'true');
      }

      const storedUsers = localStorage.getItem('teampulse_users');
      this.users = (storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS).map((u: User) => ({
        ...u,
        avatar: sanitizeAvatar(u.avatar, u.name)
      }));

      const storedTeams = localStorage.getItem('teampulse_teams');
      this.teams = storedTeams ? JSON.parse(storedTeams) : INITIAL_TEAMS;

      const storedSurveys = localStorage.getItem('teampulse_surveys');
      this.surveys = storedSurveys ? JSON.parse(storedSurveys) : INITIAL_PULSE_SURVEYS;

      const storedResponses = localStorage.getItem('teampulse_responses');
      this.responses = storedResponses ? JSON.parse(storedResponses) : INITIAL_PULSE_RESPONSES;

      const storedLeaves = localStorage.getItem('teampulse_leaves');
      const loadedLeaves: LeaveRequest[] = storedLeaves ? JSON.parse(storedLeaves) : INITIAL_LEAVE_REQUESTS;
      this.leaves = loadedLeaves.map((l) => ({
        ...l,
        userAvatar: sanitizeAvatar(l.userAvatar, l.userName),
        activityLogs: l.activityLogs?.map((log) => ({
          ...log,
          performedByAvatar: sanitizeAvatar(log.performedByAvatar, log.performedByName)
        }))
      }));

      const storedShoutouts = localStorage.getItem('teampulse_shoutouts');
      this.shoutouts = (storedShoutouts ? JSON.parse(storedShoutouts) : INITIAL_PEER_SHOUTOUTS).map((s: PeerShoutout) => ({
        ...s,
        fromUserAvatar: sanitizeAvatar(s.fromUserAvatar, s.fromUserName),
        toUserAvatar: sanitizeAvatar(s.toUserAvatar, s.toUserName)
      }));

      const storedReviews = localStorage.getItem('teampulse_reviews');
      this.reviews = (storedReviews ? JSON.parse(storedReviews) : INITIAL_PERFORMANCE_REVIEWS).map((r: PerformanceReview) => ({
        ...r,
        employeeAvatar: sanitizeAvatar(r.employeeAvatar, r.employeeName)
      }));

      const storedMetrics = localStorage.getItem('teampulse_metrics');
      this.metrics = storedMetrics ? JSON.parse(storedMetrics) : INITIAL_TEAM_METRICS;

      const storedNotifications = localStorage.getItem('teampulse_notifs');
      this.notifications = storedNotifications ? JSON.parse(storedNotifications) : INITIAL_NOTIFICATIONS;

      const storedTasks = localStorage.getItem('teampulse_tasks');
      this.tasks = (storedTasks ? JSON.parse(storedTasks) : INITIAL_TASKS).map((t: TaskItem) => ({
        ...t,
        assignedToUserAvatar: sanitizeAvatar(t.assignedToUserAvatar, t.assignedToUserName),
        assignedByUserAvatar: sanitizeAvatar(t.assignedByUserAvatar, t.assignedByName)
      }));

      const storedSkillCatalog = localStorage.getItem('teampulse_skill_catalog');
      if (storedSkillCatalog) {
        this.skillCatalog = JSON.parse(storedSkillCatalog);
      }
    } catch (e) {
      console.warn('Local database initialization error:', e);
      this.users = INITIAL_USERS;
      this.teams = INITIAL_TEAMS;
      this.surveys = INITIAL_PULSE_SURVEYS;
      this.responses = INITIAL_PULSE_RESPONSES;
      this.leaves = INITIAL_LEAVE_REQUESTS;
      this.shoutouts = INITIAL_PEER_SHOUTOUTS;
      this.reviews = INITIAL_PERFORMANCE_REVIEWS;
      this.metrics = INITIAL_TEAM_METRICS;
      this.notifications = INITIAL_NOTIFICATIONS;
      this.tasks = INITIAL_TASKS;
    }
  }

  private initFirestoreSubscriptions() {
    ensureFirebaseAuth().then(() => {
      subscribeUserProfiles((users) => {
        if (users && users.length > 0) {
          this.users = users.map((u) => ({ ...u, avatar: sanitizeAvatar(u.avatar, u.name) }));
          this.saveToStorage();
          this.notify();
        }
      });

      subscribeLeaveRequests((leaves) => {
        if (leaves) {
          this.leaves = leaves.map((l) => ({
            ...l,
            userAvatar: sanitizeAvatar(l.userAvatar, l.userName),
            activityLogs: l.activityLogs?.map((log) => ({
              ...log,
              performedByAvatar: sanitizeAvatar(log.performedByAvatar, log.performedByName)
            }))
          }));
          this.saveToStorage();
          this.notify();
        }
      });

      subscribeTeams((teams) => {
        if (teams) {
          this.teams = teams;
          this.saveToStorage();
          this.notify();
        }
      });

      subscribeTasks((tasks) => {
        if (tasks) {
          this.tasks = tasks.map((t) => ({
            ...t,
            assignedToUserAvatar: sanitizeAvatar(t.assignedToUserAvatar, t.assignedToUserName),
            assignedByUserAvatar: sanitizeAvatar(t.assignedByUserAvatar, t.assignedByName)
          }));
          this.saveToStorage();
          this.notify();
        }
      });

      subscribeShoutouts((shoutouts) => {
        if (shoutouts) {
          this.shoutouts = shoutouts.map((s) => ({
            ...s,
            fromUserAvatar: sanitizeAvatar(s.fromUserAvatar, s.fromUserName),
            toUserAvatar: sanitizeAvatar(s.toUserAvatar, s.toUserName)
          }));
          this.saveToStorage();
          this.notify();
        }
      });

      subscribeSurveys((surveys) => {
        if (surveys) {
          this.surveys = surveys;
          this.saveToStorage();
          this.notify();
        }
      });

      subscribeSurveyResponses((responses) => {
        if (responses) {
          this.responses = responses;
          this.saveToStorage();
          this.notify();
        }
      });

      subscribeNotifications((notifs) => {
        if (notifs) {
          this.notifications = notifs;
          this.saveToStorage();
          this.notify();
        }
      });

      subscribeSkillCatalog((skills) => {
        if (skills && skills.length > 0) {
          this.skillCatalog = skills;
          this.saveToStorage();
          this.notify();
        }
      });

      subscribeReviews((reviews) => {
        if (reviews) {
          this.reviews = reviews.map((r) => ({
            ...r,
            employeeAvatar: sanitizeAvatar(r.employeeAvatar, r.employeeName)
          }));
          this.saveToStorage();
          this.notify();
        }
      });
    }).catch((err) => {
      console.warn('Firestore subscription init warning:', err);
    });
  }

  private saveToStorage() {
    try {
      localStorage.setItem('teampulse_users', JSON.stringify(this.users));
      localStorage.setItem('teampulse_teams', JSON.stringify(this.teams));
      localStorage.setItem('teampulse_surveys', JSON.stringify(this.surveys));
      localStorage.setItem('teampulse_responses', JSON.stringify(this.responses));
      localStorage.setItem('teampulse_leaves', JSON.stringify(this.leaves));
      localStorage.setItem('teampulse_shoutouts', JSON.stringify(this.shoutouts));
      localStorage.setItem('teampulse_reviews', JSON.stringify(this.reviews));
      localStorage.setItem('teampulse_metrics', JSON.stringify(this.metrics));
      localStorage.setItem('teampulse_notifs', JSON.stringify(this.notifications));
      localStorage.setItem('teampulse_tasks', JSON.stringify(this.tasks));
      localStorage.setItem('teampulse_skill_catalog', JSON.stringify(this.skillCatalog));
    } catch (e) {
      console.error('Failed to write local database state to localStorage:', e);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // --- Skill Catalog Methods ---
  public getSkillCatalog(): string[] {
    return this.skillCatalog;
  }

  public addSkillToCatalog(skill: string): void {
    const trimmed = skill.trim();
    if (trimmed && !this.skillCatalog.includes(trimmed)) {
      this.skillCatalog.push(trimmed);
      this.saveToStorage();
      this.notify();
      saveSkillCatalogInFirestore(this.skillCatalog).catch((err) => console.error('Firestore err:', err));
    }
  }

  // --- Teams CRUD ---
  public getTeams(): Team[] {
    return this.teams;
  }

  public getTeamById(id: string): Team | undefined {
    return this.teams.find((t) => t.id === id);
  }

  public saveTeam(team: Team): Team {
    const existingIdx = this.teams.findIndex((t) => t.id === team.id);
    let fullTeam = { ...team };

    if (existingIdx >= 0) {
      this.teams[existingIdx] = fullTeam;
    } else {
      if (!fullTeam.id) {
        fullTeam.id = `team-${Date.now()}`;
      }
      this.teams.push(fullTeam);
    }

    if (fullTeam.teamLeadId) {
      const leadUser = this.getUserById(fullTeam.teamLeadId);
      if (leadUser) {
        fullTeam.teamLeadName = leadUser.name;
        fullTeam.teamLeadAvatar = leadUser.avatar;
      }
      this.teams.forEach((otherTeam, idx) => {
        if (otherTeam.id !== fullTeam.id && otherTeam.teamLeadId === fullTeam.teamLeadId) {
          const updatedOtherTeam = {
            ...otherTeam,
            teamLeadId: undefined,
            teamLeadName: undefined
          };
          this.teams[idx] = updatedOtherTeam;
          saveTeamInFirestore(updatedOtherTeam).catch((e) => console.error(e));
        }
      });
    }

    if (fullTeam.teamLeadId) {
      this.updateUser(fullTeam.teamLeadId, { team: fullTeam.name, managerId: fullTeam.managerId });
    }
    if (fullTeam.memberIds && fullTeam.memberIds.length > 0) {
      fullTeam.memberIds.forEach((mId) => {
        this.updateUser(mId, { team: fullTeam.name, managerId: fullTeam.managerId });
      });
    }

    this.saveToStorage();
    this.notify();
    saveTeamInFirestore(fullTeam).catch((err) => console.error('Firestore saveTeam error:', err));
    return fullTeam;
  }

  public deleteTeam(id: string): void {
    this.teams = this.teams.filter((t) => t.id !== id);
    this.saveToStorage();
    this.notify();
    deleteTeamInFirestore(id).catch((err) => console.error('Firestore deleteTeam error:', err));
  }

  // --- Users CRUD ---
  public getUsers(): User[] {
    return this.users;
  }

  public getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public addUser(user: Omit<User, 'id'>): User {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`
    };
    this.users.unshift(newUser);
    this.saveToStorage();
    this.notify();
    setUserProfile(newUser).catch((err) => console.error('Firestore addUser error:', err));
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): void {
    this.users = this.users.map((u) => (u.id === id ? { ...u, ...updates } : u));
    this.saveToStorage();
    this.notify();
    updateUserProfile(id, updates).catch((err) => console.error('Firestore updateUser error:', err));
  }

  public deleteUser(id: string): void {
    this.users = this.users.filter((u) => u.id !== id);
    this.saveToStorage();
    this.notify();
    deleteUserProfile(id).catch((err) => console.error('Firestore deleteUser error:', err));
  }

  public assignEmployeeToManager(employeeId: string, managerId: string, department?: string): void {
    const manager = this.users.find((u) => u.id === managerId);
    const dept = department || manager?.department || 'Engineering';
    
    this.updateUser(employeeId, {
      managerId: managerId,
      department: dept
    });

    if (manager) {
      this.addNotification({
        userId: manager.id,
        title: 'New Direct Report Assigned',
        message: `An employee has been assigned under your leadership by HR.`,
        type: 'info'
      });
    }
  }

  public assignEmployeeToTeam(employeeId: string, teamIdOrName: string): void {
    const team = this.teams.find((t) => t.id === teamIdOrName || t.name === teamIdOrName);
    if (!team) {
      this.updateUser(employeeId, { team: teamIdOrName });
      return;
    }

    const updatedMemberIds = Array.from(new Set([...(team.memberIds || []), employeeId]));
    
    this.updateUser(employeeId, {
      team: team.name,
      managerId: team.managerId || undefined,
      department: team.department
    });

    this.saveTeam({
      ...team,
      memberIds: updatedMemberIds
    });

    if (team.teamLeadId) {
      this.addNotification({
        userId: team.teamLeadId,
        title: 'New Team Member Assigned',
        message: `A new member has been assigned to your team: ${team.name}.`,
        type: 'info'
      });
    }
  }

  // --- Surveys & Responses CRUD ---
  public getSurveys(): PulseSurvey[] {
    return this.surveys;
  }

  public addSurvey(survey: Omit<PulseSurvey, 'id' | 'createdAt'>): PulseSurvey {
    const newSurvey: PulseSurvey = {
      ...survey,
      id: `survey-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.surveys.unshift(newSurvey);
    this.saveToStorage();
    this.notify();
    saveSurveyInFirestore(newSurvey).catch((err) => console.error('Firestore addSurvey error:', err));
    return newSurvey;
  }

  public getResponsesForSurvey(surveyId: string): PulseResponse[] {
    return this.responses.filter((r) => r.surveyId === surveyId);
  }

  public getAllResponses(): PulseResponse[] {
    return this.responses;
  }

  public submitPulseResponse(response: Omit<PulseResponse, 'id' | 'createdAt'>): PulseResponse {
    const existingIndex = this.responses.findIndex(
      (r) => r.surveyId === response.surveyId && r.userId === response.userId
    );

    const newResponse: PulseResponse = {
      ...response,
      id: `resp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (existingIndex >= 0) {
      this.responses[existingIndex] = newResponse;
    } else {
      this.responses.unshift(newResponse);
    }

    this.saveToStorage();
    this.notify();
    saveSurveyResponseInFirestore(newResponse).catch((err) => console.error('Firestore submitPulseResponse error:', err));
    return newResponse;
  }

  public deleteSurvey(surveyId: string): void {
    this.surveys = this.surveys.filter((s) => s.id !== surveyId);
    this.responses = this.responses.filter((r) => r.surveyId !== surveyId);
    this.saveToStorage();
    this.notify();
    deleteSurveyInFirestore(surveyId).catch((err) => console.error(err));
  }

  public deleteSurveyResponse(responseId: string): void {
    this.responses = this.responses.filter((r) => r.id !== responseId);
    this.saveToStorage();
    this.notify();
    deleteSurveyResponseInFirestore(responseId).catch((err) => console.error(err));
  }

  // --- Leave Requests CRUD ---
  public getLeaves(): LeaveRequest[] {
    return this.leaves;
  }

  public addLeaveRequest(leave: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>): LeaveRequest {
    const leaveId = `leave-${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const initialLog = {
      id: `log-${Date.now()}`,
      leaveId,
      performedByUserId: leave.userId,
      performedByName: leave.userName,
      performedByUserRole: leave.userRole,
      performedByAvatar: leave.userAvatar,
      action: 'Submitted' as const,
      previousStatus: 'None' as const,
      newStatus: 'Pending' as const,
      timestamp: nowStr,
      comment: `Application submitted for ${leave.leaveType} Leave (${leave.days} day(s))`
    };

    const newLeave: LeaveRequest = {
      ...leave,
      id: leaveId,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
      activityLogs: [initialLog]
    };
    this.leaves.unshift(newLeave);

    this.addNotification({
      userId: 'user-mgr-1',
      title: 'New Leave Request',
      message: `${leave.userName} requested ${leave.days} day(s) of ${leave.leaveType} leave.`,
      type: 'leave'
    });

    this.saveToStorage();
    this.notify();
    saveLeaveRequest(newLeave).catch((err) => console.error('Firestore addLeaveRequest error:', err));
    return newLeave;
  }

  public updateLeaveStatus(
    leaveId: string, 
    status: 'Approved' | 'Rejected', 
    approverName: string,
    performer?: { id: string; name: string; role: UserRole; avatar?: string }
  ): void {
    const leave = this.leaves.find((l) => l.id === leaveId);
    if (leave) {
      const prevStatus = leave.status;
      leave.status = status;
      leave.approvedBy = approverName;

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      if (!leave.activityLogs) {
        leave.activityLogs = [];
      }

      const performerName = performer ? performer.name : approverName;
      const performerRole = performer ? performer.role : (leave.userRole === 'Employee' ? 'Team Lead' : 'Manager');
      const performerId = performer ? performer.id : 'user-approver';
      const performerAvatar = performer?.avatar;

      leave.activityLogs.push({
        id: `log-${Date.now()}`,
        leaveId,
        performedByUserId: performerId,
        performedByName: performerName,
        performedByUserRole: performerRole,
        performedByAvatar: performerAvatar,
        action: status,
        previousStatus: prevStatus,
        newStatus: status,
        timestamp: nowStr,
        comment: `Status changed from '${prevStatus}' to '${status}' by ${performerName} (${performerRole})`
      });

      this.addNotification({
        userId: leave.userId,
        title: `Leave Request ${status}`,
        message: `Your leave request for ${leave.startDate} to ${leave.endDate} was ${status.toLowerCase()} by ${performerName}.`,
        type: 'leave'
      });

      this.saveToStorage();
      this.notify();
      saveLeaveRequest(leave).catch((err) => console.error('Firestore updateLeaveStatus error:', err));
    }
  }

  public getLeaveActivityLogs(leaveId?: string) {
    if (leaveId) {
      const leave = this.leaves.find((l) => l.id === leaveId);
      return leave?.activityLogs || [];
    }
    return this.leaves.flatMap((l) => l.activityLogs || []).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public deleteLeaveRequest(leaveId: string): void {
    this.leaves = this.leaves.filter((l) => l.id !== leaveId);
    this.saveToStorage();
    this.notify();
    deleteLeaveInFirestore(leaveId).catch((err) => console.error(err));
  }

  // --- Peer Shoutouts CRUD ---
  public getShoutouts(): PeerShoutout[] {
    return this.shoutouts;
  }

  public addShoutout(shoutout: Omit<PeerShoutout, 'id' | 'createdAt' | 'likes'>): PeerShoutout {
    const newShoutout: PeerShoutout = {
      ...shoutout,
      id: `shout-${Date.now()}`,
      likes: [],
      createdAt: new Date().toISOString()
    };
    this.shoutouts.unshift(newShoutout);

    this.addNotification({
      userId: shoutout.toUserId,
      title: 'New Peer Shoutout! 🎉',
      message: `${shoutout.fromUserName} recognized you for ${shoutout.category}!`,
      type: 'shoutout'
    });

    this.saveToStorage();
    this.notify();
    saveShoutoutInFirestore(newShoutout).catch((err) => console.error('Firestore addShoutout error:', err));
    return newShoutout;
  }

  public toggleLikeShoutout(shoutoutId: string, userId: string): void {
    const shoutout = this.shoutouts.find((s) => s.id === shoutoutId);
    if (shoutout) {
      if (shoutout.likes.includes(userId)) {
        shoutout.likes = shoutout.likes.filter((id) => id !== userId);
      } else {
        shoutout.likes.push(userId);
      }
      this.saveToStorage();
      this.notify();
      saveShoutoutInFirestore(shoutout).catch((err) => console.error(err));
    }
  }

  public deleteShoutout(shoutoutId: string): void {
    this.shoutouts = this.shoutouts.filter((s) => s.id !== shoutoutId);
    this.saveToStorage();
    this.notify();
    deleteShoutoutInFirestore(shoutoutId).catch((err) => console.error(err));
  }

  // --- Performance Reviews CRUD ---
  public getReviews(): PerformanceReview[] {
    return this.reviews;
  }

  public saveReview(review: PerformanceReview): void {
    const index = this.reviews.findIndex((r) => r.id === review.id);
    if (index >= 0) {
      this.reviews[index] = review;
    } else {
      this.reviews.unshift(review);
    }
    this.saveToStorage();
    this.notify();
    saveReviewInFirestore(review).catch((err) => console.error(err));
  }

  // --- Team Metrics ---
  public getMetrics(): TeamMetric[] {
    return this.metrics;
  }

  // --- Notifications ---
  public getNotifications(userId?: string): NotificationItem[] {
    if (!userId) return this.notifications;
    return this.notifications.filter((n) => n.userId === userId || n.userId === 'all');
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false
    };
    this.notifications.unshift(newNotif);
    this.saveToStorage();
    this.notify();
    saveNotifInFirestore(newNotif).catch((err) => console.error(err));
    return newNotif;
  }

  public markNotificationAsRead(notifId: string): void {
    const notif = this.notifications.find((n) => n.id === notifId);
    if (notif) {
      notif.read = true;
      this.saveToStorage();
      this.notify();
      saveNotifInFirestore(notif).catch((err) => console.error(err));
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.notifications = this.notifications.map((n) => {
      if (n.userId === userId || n.userId === 'all') {
        const updated = { ...n, read: true };
        saveNotifInFirestore(updated).catch((e) => console.error(e));
        return updated;
      }
      return n;
    });
    this.saveToStorage();
    this.notify();
  }

  // --- Tasks & To-Do List CRUD ---
  public getTasks(assignedToUserId?: string): TaskItem[] {
    if (assignedToUserId) {
      return this.tasks.filter((t) => t.assignedToUserId === assignedToUserId);
    }
    return this.tasks;
  }

  public getTasksAssignedBy(assignedByUserId: string): TaskItem[] {
    return this.tasks.filter((t) => t.assignedByUserId === assignedByUserId);
  }

  public addTask(taskData: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.tasks.unshift(newTask);

    if (taskData.assignedToUserId !== taskData.assignedByUserId) {
      this.addNotification({
        userId: taskData.assignedToUserId,
        title: 'New Task Assigned',
        message: `${taskData.assignedByName} (${taskData.assignedByUserRole}) assigned you a task: "${taskData.title}" (Due: ${taskData.dueDate})`,
        type: 'task'
      });
    }

    this.saveToStorage();
    this.notify();
    saveTaskInFirestore(newTask).catch((err) => console.error('Firestore addTask error:', err));
    return newTask;
  }

  public updateTaskStatus(taskId: string, status: TaskStatus): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      if (status === 'Completed') {
        task.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      } else {
        delete task.completedAt;
      }
      this.saveToStorage();
      this.notify();
      saveTaskInFirestore(task).catch((err) => console.error('Firestore updateTaskStatus error:', err));
    }
  }

  public updateTask(taskId: string, partialTask: Partial<TaskItem>): void {
    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...partialTask };
      this.saveToStorage();
      this.notify();
      saveTaskInFirestore(this.tasks[taskIndex]).catch((err) => console.error('Firestore updateTask error:', err));
    }
  }

  public reassignAllTasks(fromUserId: string, toUser: User): number {
    let count = 0;
    this.tasks = this.tasks.map((t) => {
      if (t.assignedToUserId === fromUserId && t.status !== 'Completed') {
        count++;
        const updated = {
          ...t,
          assignedToUserId: toUser.id,
          assignedToUserName: toUser.name,
          assignedToUserRole: toUser.role,
          assignedToUserAvatar: toUser.avatar
        };
        saveTaskInFirestore(updated).catch((e) => console.error(e));
        return updated;
      }
      return t;
    });
    if (count > 0) {
      this.addNotification({
        userId: toUser.id,
        title: 'Emergency Tasks Reassigned',
        message: `${count} active task(s) have been reassigned to you due to workload/leave management.`,
        type: 'task'
      });
      this.saveToStorage();
      this.notify();
    }
    return count;
  }

  public updateUserSkills(userId: string, skills: string[]): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.skills = skills;
      this.saveToStorage();
      this.notify();
      updateUserProfile(userId, { skills }).catch((err) => console.error(err));
    }
  }

  public deleteTask(taskId: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.saveToStorage();
    this.notify();
    deleteTaskFromFirestore(taskId).catch((err) => console.error(err));
  }
}

export const db = new LocalDatabase();
