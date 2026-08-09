export type UserRole = 'Manager' | 'HR' | 'Team Lead' | 'Employee';

export interface Team {
  id: string;
  name: string;
  department: string;
  managerId: string;
  managerName?: string;
  teamLeadId?: string;
  teamLeadName?: string;
  memberIds: string[];
  description?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  role: UserRole;
  department: string;
  team: string;
  title: string;
  joinedDate: string;
  status: 'Active' | 'On Leave' | 'Remote';
  phone?: string;
  location?: string;
  managerId?: string;
  skills?: string[];
  maxWeeklyHours?: number; // Default 40
  isKeyPersonRisk?: boolean;
}

export interface PulseSurveyOption {
  id: string;
  text: string;
}

export interface PulseResponse {
  id: string;
  surveyId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  department: string;
  selectedOptionId?: string;
  rating?: number; // 1-5 or 1-10 scale
  comment?: string;
  createdAt: string;
}

export interface PulseSurvey {
  id: string;
  title: string;
  question: string;
  type: 'rating' | 'choice' | 'enps'; // enps is 0-10
  options?: PulseSurveyOption[];
  department?: string; // empty means all
  targetRole?: UserRole; // empty means all
  status: 'active' | 'closed';
  createdByUserId?: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
  expiresAt: string;
}

export interface LeaveActivityLog {
  id: string;
  leaveId: string;
  performedByUserId: string;
  performedByName: string;
  performedByUserRole: UserRole;
  performedByAvatar?: string;
  action: 'Submitted' | 'Approved' | 'Rejected' | 'Status Change';
  previousStatus?: 'Pending' | 'Approved' | 'Rejected' | 'None';
  newStatus: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
  comment?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: UserRole;
  department: string;
  leaveType: 'Annual' | 'Sick' | 'Casual' | 'Parental' | 'Unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  handoverNotes?: string;
  backupUserId?: string;
  backupUserName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  createdAt: string;
  activityLogs?: LeaveActivityLog[];
}

export interface PeerShoutout {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar: string;
  category: 'Innovation' | 'Team Player' | 'Excellence' | 'Leadership' | 'Customer First';
  message: string;
  likes: string[]; // array of userIds who liked
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  category: 'Technical' | 'Soft Skills' | 'Leadership' | 'Company Impact';
  progress: number; // 0 - 100
  targetDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  employeeRole: UserRole;
  employeeTitle: string;
  reviewerId: string;
  reviewerName: string;
  period: string; // e.g. "Q3 2026", "Annual 2026"
  ratings: {
    execution: number; // 1-5
    collaboration: number; // 1-5
    leadership: number; // 1-5
    communication: number; // 1-5
  };
  goals: Goal[];
  strengths: string;
  areasOfGrowth: string;
  overallScore: number; // average
  status: 'Draft' | 'Submitted' | 'Approved';
  updatedAt: string;
}

export interface MonthlyPerformancePoint {
  month: string;             // e.g. "Aug 25", "Sep 25"
  fullMonthName: string;     // e.g. "August 2025"
  score: number;             // Overall score 1.0 - 5.0
  execution: number;         // Execution score 1.0 - 5.0
  collaboration: number;     // Collaboration score 1.0 - 5.0
  deliverablesCount: number; // Deliverables count
  highlight: string;         // Key monthly milestone
  targetBenchmark: number;   // Department target 1.0 - 5.0
}

export interface TeamMetric {
  department: string;
  headcount: number;
  eNPS: number;
  satisfactionScore: number; // 0 - 100
  burnoutRisk: 'Low' | 'Medium' | 'High';
  activeProjects: number;
  retentionRate: number; // %
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Completed';
export type TaskCategory = 'Project Work' | 'Review & Approval' | 'Training & Onboarding' | 'Administrative' | 'Personal';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedToUserRole: UserRole;
  assignedToUserAvatar?: string;
  assignedByUserId: string;
  assignedByName: string;
  assignedByUserRole: UserRole;
  assignedByUserAvatar?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  estimatedHours?: number;
  isBlocked?: boolean;
  blockerReason?: string;
  blockerCategory?: 'API/Specs' | '3rd-Party' | 'Design Assets' | 'Approval' | 'Resource/Staff' | 'Cross-Team';
  blockedTasksCount?: number;
  crossTeamDependency?: string;
  isMeetingActionItem?: boolean;
  meetingTitle?: string;
  reviewerUserId?: string;
  reviewerUserName?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'leave' | 'survey' | 'shoutout' | 'review' | 'task' | 'system';
}
