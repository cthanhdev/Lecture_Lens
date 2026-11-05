import { AuthRepository } from '../repositories';
import { User } from '../../domain/types';
import { mockUser } from '../../mock/fixtures';

const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

export class MockAuthRepository implements AuthRepository {
  private currentUser: User | null = mockUser;

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await delay();
    const user: User = {
      ...mockUser,
      email,
      fullName: email.split('@')[0] || 'Minh Nguyen',
    };
    this.currentUser = user;
    return {
      user,
      token: `mock-jwt-token-${Date.now()}`,
    };
  }

  async register(fullName: string, email: string, password: string): Promise<{ user: User; token: string }> {
    await delay();
    const user: User = {
      id: `usr-${Date.now()}`,
      fullName,
      email,
      role: 'STUDENT',
      university: 'Ho Chi Minh City Open University',
      major: 'Economics & Computing',
      year: 'Class of 2027',
      isPlusSubscriber: false,
    };
    this.currentUser = user;
    return {
      user,
      token: `mock-jwt-token-${Date.now()}`,
    };
  }

  async loginAsGuest(): Promise<{ user: User; token: string }> {
    await delay(150);
    const guestUser: User = {
      id: 'usr-guest',
      fullName: 'Student Guest',
      email: 'guest@lecturelens.edu.vn',
      role: 'STUDENT',
      university: 'LectureLens Demo Campus',
      major: 'General Studies',
      isPlusSubscriber: false,
    };
    this.currentUser = guestUser;
    return {
      user: guestUser,
      token: 'mock-guest-token',
    };
  }

  async getCurrentUser(): Promise<User | null> {
    await delay(100);
    return this.currentUser;
  }

  async logout(): Promise<void> {
    await delay(100);
    this.currentUser = null;
  }
}
