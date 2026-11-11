export type * from './domain/auth.types'
export { calculatePasswordStrength } from './domain/passwordEntropy'
export {
  validateUniversityEmail,
  validateFullName,
  validatePassword,
} from './domain/validation'
export {
  type AuthSeam,
  MockAuthAdapter,
  BackendAuthAdapter,
  getAuthSeam,
  setAuthSeam,
} from './infrastructure/authSeam'
