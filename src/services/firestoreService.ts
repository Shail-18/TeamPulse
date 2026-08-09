import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { dbFirestore, auth } from './firebase';
import {
  User,
  Team,
  PulseSurvey,
  PulseResponse,
  LeaveRequest,
  PeerShoutout,
  NotificationItem,
  TaskItem,
  PerformanceReview
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export async function ensureFirebaseAuth() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    console.warn('Anonymous auth failed or not enabled:', err);
  }
}

// Collections
const USERS_COL = collection(dbFirestore, 'users');
const LEAVES_COL = collection(dbFirestore, 'leave_requests');
const TEAMS_COL = collection(dbFirestore, 'teams');
const TASKS_COL = collection(dbFirestore, 'tasks');
const SHOUTOUTS_COL = collection(dbFirestore, 'peer_shoutouts');
const SURVEYS_COL = collection(dbFirestore, 'pulse_surveys');
const RESPONSES_COL = collection(dbFirestore, 'pulse_responses');
const NOTIFICATIONS_COL = collection(dbFirestore, 'notifications');
const SKILLS_COL = collection(dbFirestore, 'skill_catalog');
const REVIEWS_COL = collection(dbFirestore, 'performance_reviews');

// Seed functions
export async function seedUsersIfEmpty(initialUsers: User[]) {
  try {
    const snap = await getDocs(USERS_COL);
    if (snap.empty) {
      for (const u of initialUsers) {
        await setDoc(doc(USERS_COL, u.id), u);
      }
    }
  } catch (e) {
    console.error('Error seeding users to Firestore:', e);
  }
}

export async function seedLeaveRequestsIfEmpty(initialLeaves: LeaveRequest[]) {
  try {
    const snap = await getDocs(LEAVES_COL);
    if (snap.empty) {
      for (const l of initialLeaves) {
        await setDoc(doc(LEAVES_COL, l.id), l);
      }
    }
  } catch (e) {
    console.error('Error seeding leave requests to Firestore:', e);
  }
}

export async function seedTeamsIfEmpty(initialTeams: Team[]) {
  try {
    const snap = await getDocs(TEAMS_COL);
    if (snap.empty) {
      for (const t of initialTeams) {
        await setDoc(doc(TEAMS_COL, t.id), t);
      }
    }
  } catch (e) {
    console.error('Error seeding teams to Firestore:', e);
  }
}

export async function seedTasksIfEmpty(initialTasks: TaskItem[]) {
  try {
    const snap = await getDocs(TASKS_COL);
    if (snap.empty) {
      for (const t of initialTasks) {
        await setDoc(doc(TASKS_COL, t.id), t);
      }
    }
  } catch (e) {
    console.error('Error seeding tasks to Firestore:', e);
  }
}

export async function seedShoutoutsIfEmpty(initialShoutouts: PeerShoutout[]) {
  try {
    const snap = await getDocs(SHOUTOUTS_COL);
    if (snap.empty) {
      for (const s of initialShoutouts) {
        await setDoc(doc(SHOUTOUTS_COL, s.id), s);
      }
    }
  } catch (e) {
    console.error('Error seeding shoutouts to Firestore:', e);
  }
}

export async function seedSurveysIfEmpty(initialSurveys: PulseSurvey[], initialResponses: PulseResponse[]) {
  try {
    const snapS = await getDocs(SURVEYS_COL);
    if (snapS.empty) {
      for (const s of initialSurveys) {
        await setDoc(doc(SURVEYS_COL, s.id), s);
      }
    }
    const snapR = await getDocs(RESPONSES_COL);
    if (snapR.empty) {
      for (const r of initialResponses) {
        await setDoc(doc(RESPONSES_COL, r.id), r);
      }
    }
  } catch (e) {
    console.error('Error seeding surveys to Firestore:', e);
  }
}

export async function seedNotificationsIfEmpty(initialNotifs: NotificationItem[]) {
  try {
    const snap = await getDocs(NOTIFICATIONS_COL);
    if (snap.empty) {
      for (const n of initialNotifs) {
        await setDoc(doc(NOTIFICATIONS_COL, n.id), n);
      }
    }
  } catch (e) {
    console.error('Error seeding notifications to Firestore:', e);
  }
}

export async function seedSkillCatalogIfEmpty(initialCatalog: string[]) {
  try {
    const snap = await getDocs(SKILLS_COL);
    if (snap.empty) {
      await setDoc(doc(SKILLS_COL, 'main'), { skills: initialCatalog });
    }
  } catch (e) {
    console.error('Error seeding skill catalog to Firestore:', e);
  }
}

export async function seedReviewsIfEmpty(initialReviews: PerformanceReview[]) {
  try {
    const snap = await getDocs(REVIEWS_COL);
    if (snap.empty) {
      for (const r of initialReviews) {
        await setDoc(doc(REVIEWS_COL, r.id), r);
      }
    }
  } catch (e) {
    console.error('Error seeding reviews to Firestore:', e);
  }
}

// User Profile CRUD
export async function setUserProfile(user: User) {
  await setDoc(doc(USERS_COL, user.id), user, { merge: true });
}

export async function updateUserProfile(id: string, updates: Partial<User>) {
  await updateDoc(doc(USERS_COL, id), updates);
}

export async function deleteUserProfile(id: string) {
  await deleteDoc(doc(USERS_COL, id));
}

// Leave Requests CRUD
export async function saveLeaveRequest(leave: LeaveRequest) {
  await setDoc(doc(LEAVES_COL, leave.id), leave, { merge: true });
}

export async function deleteLeaveRequest(id: string) {
  await deleteDoc(doc(LEAVES_COL, id));
}

// Teams CRUD
export async function saveTeam(team: Team) {
  await setDoc(doc(TEAMS_COL, team.id), team, { merge: true });
}

export async function deleteTeam(id: string) {
  await deleteDoc(doc(TEAMS_COL, id));
}

// Tasks CRUD
export async function saveTaskInFirestore(task: TaskItem) {
  await setDoc(doc(TASKS_COL, task.id), task, { merge: true });
}

export async function updateTaskInFirestore(id: string, updates: Partial<TaskItem>) {
  await updateDoc(doc(TASKS_COL, id), updates);
}

export async function deleteTaskFromFirestore(id: string) {
  await deleteDoc(doc(TASKS_COL, id));
}

// Peer Shoutouts CRUD
export async function saveShoutout(shoutout: PeerShoutout) {
  await setDoc(doc(SHOUTOUTS_COL, shoutout.id), shoutout, { merge: true });
}

export async function deleteShoutout(id: string) {
  await deleteDoc(doc(SHOUTOUTS_COL, id));
}

// Pulse Surveys & Responses CRUD
export async function saveSurvey(survey: PulseSurvey) {
  await setDoc(doc(SURVEYS_COL, survey.id), survey, { merge: true });
}

export async function saveSurveyResponse(response: PulseResponse) {
  await setDoc(doc(RESPONSES_COL, response.id), response, { merge: true });
}

export async function deleteSurvey(id: string) {
  await deleteDoc(doc(SURVEYS_COL, id));
}

export async function deleteSurveyResponse(id: string) {
  await deleteDoc(doc(RESPONSES_COL, id));
}

// Notifications CRUD
export async function saveNotification(notif: NotificationItem) {
  await setDoc(doc(NOTIFICATIONS_COL, notif.id), notif, { merge: true });
}

export async function markNotificationReadInFirestore(id: string) {
  await updateDoc(doc(NOTIFICATIONS_COL, id), { read: true });
}

// Skill Catalog
export async function saveSkillCatalogInFirestore(skills: string[]) {
  await setDoc(doc(SKILLS_COL, 'main'), { skills });
}

// Performance Reviews CRUD
export async function saveReviewInFirestore(review: PerformanceReview) {
  await setDoc(doc(REVIEWS_COL, review.id), review, { merge: true });
}

// Subscriptions
export function subscribeUserProfiles(callback: (users: User[]) => void) {
  return onSnapshot(USERS_COL, (snap) => {
    const users = snap.docs.map((d) => d.data() as User);
    callback(users);
  }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));
}

export function subscribeLeaveRequests(callback: (leaves: LeaveRequest[]) => void) {
  return onSnapshot(LEAVES_COL, (snap) => {
    const leaves = snap.docs.map((d) => d.data() as LeaveRequest);
    callback(leaves);
  }, (err) => handleFirestoreError(err, OperationType.GET, 'leave_requests'));
}

export function subscribeTeams(callback: (teams: Team[]) => void) {
  return onSnapshot(TEAMS_COL, (snap) => {
    const teams = snap.docs.map((d) => d.data() as Team);
    callback(teams);
  }, (err) => handleFirestoreError(err, OperationType.GET, 'teams'));
}

export function subscribeTasks(callback: (tasks: TaskItem[]) => void) {
  return onSnapshot(TASKS_COL, (snap) => {
    const tasks = snap.docs.map((d) => d.data() as TaskItem);
    callback(tasks);
  }, (err) => handleFirestoreError(err, OperationType.GET, 'tasks'));
}

export function subscribeShoutouts(callback: (shoutouts: PeerShoutout[]) => void) {
  return onSnapshot(SHOUTOUTS_COL, (snap) => {
    const shoutouts = snap.docs.map((d) => d.data() as PeerShoutout);
    callback(shoutouts);
  }, (err) => handleFirestoreError(err, OperationType.GET, 'peer_shoutouts'));
}

export function subscribeSurveys(callback: (surveys: PulseSurvey[]) => void) {
  return onSnapshot(SURVEYS_COL, (snap) => {
    const surveys = snap.docs.map((d) => d.data() as PulseSurvey);
    callback(surveys);
  }, (err) => handleFirestoreError(err, OperationType.GET, 'pulse_surveys'));
}

export function subscribeSurveyResponses(callback: (responses: PulseResponse[]) => void) {
  return onSnapshot(RESPONSES_COL, (snap) => {
    const responses = snap.docs.map((d) => d.data() as PulseResponse);
    callback(responses);
  }, (err) => handleFirestoreError(err, OperationType.GET, 'pulse_responses'));
}

export function subscribeNotifications(callback: (notifications: NotificationItem[]) => void) {
  return onSnapshot(NOTIFICATIONS_COL, (snap) => {
    const notifs = snap.docs.map((d) => d.data() as NotificationItem);
    callback(notifs);
  }, (err) => handleFirestoreError(err, OperationType.GET, 'notifications'));
}

export function subscribeSkillCatalog(callback: (skills: string[]) => void) {
  return onSnapshot(doc(SKILLS_COL, 'main'), (snap) => {
    if (snap.exists()) {
      callback(snap.data().skills || []);
    }
  }, (err) => handleFirestoreError(err, OperationType.GET, 'skill_catalog/main'));
}

export function subscribeReviews(callback: (reviews: PerformanceReview[]) => void) {
  return onSnapshot(REVIEWS_COL, (snap) => {
    const reviews = snap.docs.map((d) => d.data() as PerformanceReview);
    callback(reviews);
  }, (err) => handleFirestoreError(err, OperationType.GET, 'performance_reviews'));
}
