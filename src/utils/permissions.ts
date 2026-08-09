import { User, LeaveRequest, UserRole } from '../types';

/**
 * Leave Request Visibility Rules:
 * - Employee's leave application: Everyone except any employee can view (Team Lead, Manager, HR), plus applicant employee.
 * - Team Lead's leave application: Everyone except any employee and team leads can view (Manager, HR), plus applicant Team Lead.
 * - Manager's leave application: Everyone except any employee, team leads, and manager can view (HR), plus applicant Manager.
 * - HR's leave application: HR can view, plus applicant HR.
 */
export function canViewLeaveRequest(leave: LeaveRequest, currentUser: User): boolean {
  // Applicant can always view their own request and status
  if (leave.userId === currentUser.id) {
    return true;
  }

  const role: string = leave.userRole;
  switch (role) {
    case 'Employee':
      // Viewable by Team Lead, Manager, HR (everyone except other employees)
      return currentUser.role === 'Team Lead' || currentUser.role === 'Manager' || currentUser.role === 'HR';

    case 'Team Lead':
      // Viewable by Manager, HR (everyone except employees and team leads)
      return currentUser.role === 'Manager' || currentUser.role === 'HR';

    case 'Manager':
      // Viewable by HR (everyone except employees, team leads, and other managers)
      return currentUser.role === 'HR';

    case 'HR':
      // Viewable by HR
      return currentUser.role === 'HR';

    default:
      return false;
  }
}

/**
 * Leave Request Edit/Approval Rules:
 * - Employee's leave application should be edited by Team Lead only
 * - Team Lead's leave application should be edited by Manager only
 * - Manager's leave application should be edited by HR only
 * - HR's leave application should be edited by HR only
 */
export function canEditLeaveRequest(leave: LeaveRequest, currentUser: User): boolean {
  switch (leave.userRole) {
    case 'Employee':
      return currentUser.role === 'Team Lead';

    case 'Team Lead':
      return currentUser.role === 'Manager';

    case 'Manager':
      return currentUser.role === 'HR';

    case 'HR':
      return currentUser.role === 'HR' && leave.userId !== currentUser.id;

    default:
      return false;
  }
}

/**
 * Returns the role responsible for approving this applicant's leave
 */
export function getApproverRoleLabel(applicantRole: UserRole): string {
  switch (applicantRole) {
    case 'Employee':
      return 'Team Lead';
    case 'Team Lead':
      return 'Manager';
    case 'Manager':
      return 'HR Manager';
    case 'HR':
      return 'HR Operations';
    default:
      return 'Manager';
  }
}

export const ROLE_LEVELS: Record<UserRole, number> = {
  'HR': 4,
  'Manager': 3,
  'Team Lead': 2,
  'Employee': 1
};

/**
 * Checks if assigner can delegate tasks to target role
 * High position roles can assign tasks to lower position roles or peers if allowed.
 */
export function canAssignTaskToRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_LEVELS[assignerRole] > ROLE_LEVELS[targetRole];
}

