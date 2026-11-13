export type * from './domain/auth.types.ts'
export { calculatePasswordStrength } from './domain/passwordEntropy.ts'
export {
  type LegalDocumentTab,
  type LegalSection,
  type LegalDocumentView,
  LEGAL_LAST_UPDATED,
  LEGAL_PRODUCT_SUBTITLE,
  TERMS_SECTIONS,
  PRIVACY_SECTIONS,
  getLegalDocument,
} from './domain/legalDocuments.ts'
export {
  type ValidationResult,
  type SignInFormErrors,
  type RegistrationFormErrors,
  type FormValidationResult,
  validateUniversityEmail,
  validateFullName,
  validatePassword,
  validateSignInForm,
  validateRegistrationForm,
} from './domain/validation.ts'
export {
  type AuthSeam,
  type SpringBootAuthConfig,
  AUTH_SESSION_KEY,
  AUTH_TOKEN_KEY,
  MOCK_ACCOUNTS_KEY,
  AUTH_MODE_KEY,
  DEMO_CREDENTIALS,
  MockAuthAdapter,
  SpringBootAuthAdapter,
  BackendAuthAdapter,
  getAuthSeam,
  setAuthSeam,
} from './infrastructure/authSeam.ts'
