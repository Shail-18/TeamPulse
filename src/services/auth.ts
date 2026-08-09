import { User, UserRole } from '../types';
import { db } from './db';

type AuthListener = (currentUser: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.init();
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

  public login(email: string, password?: string, role?: UserRole): User | null {
    const users = db.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email && u.email.trim().toLowerCase() === cleanEmail);

    if (found) {
      // Validate password if user has password saved in database
      if (found.password && password && password.trim()) {
        if (found.password.trim() !== password.trim()) {
          return null; // Password mismatch
        }
      }
      // Validate job role matches saved database role
      if (role && found.role !== role) {
        return null; // Role mismatch
      }
      this.currentUser = found;
      localStorage.setItem('teampulse_current_user_id', found.id);
      this.notify();
      return found;
    }
    return null;
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
