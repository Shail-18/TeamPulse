import { User, UserRole } from '../types';
import { db } from './db';

type AuthListener = (currentUser: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.init();
    db.subscribe(() => {
      if (this.currentUser) {
        const freshUser = db.getUserById(this.currentUser.id);
        if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(this.currentUser)) {
          this.currentUser = freshUser;
          this.notify();
        }
      }
    });
  }

  private init() {
    try {
      // Clear persistent session on launch so every app open/refresh starts on Login or Sign-Up page first
      localStorage.removeItem('teampulse_current_user_id');
      this.currentUser = null;
    } catch (e) {
      console.error('Auth initialization error', e);
      this.currentUser = null;
    }
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public switchUser(userId: string): void {
    const users = db.getUsers();
    const target = users.find((u) => u.id === userId);
    if (target) {
      this.currentUser = target;
      localStorage.setItem('teampulse_current_user_id', target.id);
      this.notify();
    }
  }

  public switchRole(role: UserRole): void {
    const users = db.getUsers();
    const target = users.find((u) => u.role === role);
    if (target) {
      this.switchUser(target.id);
    }
  }

  public login(email: string, password?: string, role?: UserRole): { success: boolean; user?: User; error?: string } {
    const users = db.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email && u.email.trim().toLowerCase() === cleanEmail);

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your account email address.' };
    }

    if (!found) {
      return { 
        success: false, 
        error: 'No registered account found with this email address. Please sign up for an account.' 
      };
    }

    if (!password || !password.trim()) {
      return { 
        success: false, 
        error: 'Password is required to sign in.' 
      };
    }

    if (found.password && found.password.trim() !== password.trim()) {
      return { 
        success: false, 
        error: 'Incorrect password entered. Please enter your correct account password.' 
      };
    }

    if (!role) {
      return {
        success: false,
        error: 'Please select your registered job role to access your dashboard.'
      };
    }

    if (found.role !== role) {
      return { 
        success: false, 
        error: `Security Access Denied: This account is registered under the role '${found.role}', not '${role}'. Please select '${found.role}' as your role to get access.` 
      };
    }

    this.currentUser = found;
    localStorage.setItem('teampulse_current_user_id', found.id);
    this.notify();
    return { success: true, user: found };
  }

  public signup(userData: Omit<User, 'id'>): User {
    const newUser = db.addUser(userData);
    this.currentUser = newUser;
    localStorage.setItem('teampulse_current_user_id', newUser.id);
    this.notify();
    return newUser;
  }

  public loginByRole(role: UserRole): User | null {
    const users = db.getUsers();
    const found = users.find((u) => u.role === role);
    if (found) {
      this.currentUser = found;
      localStorage.setItem('teampulse_current_user_id', found.id);
      this.notify();
      return found;
    }
    return null;
  }

  public logout(): void {
    this.currentUser = null;
    localStorage.removeItem('teampulse_current_user_id');
    this.notify();
  }
}

export const authService = new AuthService();
