import { authRepo } from '../src/core/data';
import { tokenStorage } from '../src/core/auth';

describe('Auth & Onboarding Flow Verification Suite', () => {
  it('manages onboarding state in local tokenStorage', async () => {
    await tokenStorage.setOnboardingCompleted(false);
    expect(await tokenStorage.getOnboardingCompleted()).toBe(false);

    await tokenStorage.setOnboardingCompleted(true);
    expect(await tokenStorage.getOnboardingCompleted()).toBe(true);
  });

  it('manages student login and session token storage', async () => {
    const loginResult = await authRepo.login('minh.nguyen@lecturelens.edu.vn', '123456');
    expect(loginResult.user).toBeDefined();
    expect(loginResult.user.fullName).toBe('minh.nguyen');
    expect(loginResult.token).toBeDefined();

    await tokenStorage.saveToken(loginResult.token);
    expect(await tokenStorage.getToken()).toBe(loginResult.token);

    await tokenStorage.clearToken();
    expect(await tokenStorage.getToken()).toBeNull();
  });

  it('supports instant 1-touch student guest demo mode', async () => {
    const guestResult = await authRepo.loginAsGuest();
    expect(guestResult.user.role).toBe('STUDENT');
    expect(guestResult.user.fullName).toBe('Student Guest');
    expect(guestResult.token).toBe('mock-guest-token');
  });

  it('handles account creation registration flow', async () => {
    const registerResult = await authRepo.register(
      'Lan Tran',
      'lan.tran@lecturelens.edu.vn',
      'secretPassword'
    );
    expect(registerResult.user.fullName).toBe('Lan Tran');
    expect(registerResult.user.email).toBe('lan.tran@lecturelens.edu.vn');
    expect(registerResult.token).toBeDefined();
  });
});
