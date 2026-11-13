// Project-accurate Terms of Service & Privacy Policy definitions for LectureLens
// Grounded strictly in ADR 0001–0003, GLOSSARY.md, backend architecture, and mobile/app.json.

export type LegalDocumentTab = 'terms' | 'privacy'

export interface LegalSection {
  id: string
  title: string
  body: string
}

export interface LegalDocumentView {
  tab: LegalDocumentTab
  heading: string
  subtitle: string
  sections: readonly LegalSection[]
}

export const LEGAL_LAST_UPDATED = 'November 2026'

export const LEGAL_PRODUCT_SUBTITLE =
  'LectureLens Mobile (Expo SDK 58) · On-Premise 2-Stage Neural RAG Workspace'

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: 'scope-study-hub',
    title: '1. Scope of LectureLens Workspace',
    body: 'LectureLens provides a native mobile study hub (Expo SDK 58) for capturing or uploading university lecture recordings (MP3, WAV, M4A), generating timestamped transcripts ([MM:SS]), organizing structured Cornell Notes (Summary, Cues, Notes), querying lectures with 2-Stage Neural RAG, and reviewing Kitsune Flashcards with Spaced Repetition.',
  },
  {
    id: 'recording-integrity',
    title: '2. Academic Recording Rights & Ownership',
    body: 'You retain full ownership of your personal study notes, flashcards, and uploaded materials. Before recording or importing lectures, you agree to comply with your university policies and respect instructor intellectual property so recordings are used strictly for personal academic study and review.',
  },
  {
    id: 'account-auth-modes',
    title: '3. Student Accounts, Mock Mode & Spring Boot Gateway',
    body: 'When testing in Mock Mode, demo and newly registered accounts stay stored locally on your device. When linked to an institutional Spring Boot Gateway (port 8080, /api/v1/auth/*), you are responsible for safeguarding your university email credentials, signed Bearer JWT session, and optional Apple or Google OAuth sign-in access.',
  },
  {
    id: 'rag-accuracy-tiers',
    title: '4. Grounded AI Outputs & Kitsune Plus',
    body: '2-Stage Neural RAG answers attach [MM:SS] transcript citations so you can verify original lecturer audio before relying on generated summaries or flashcards for coursework and exams. Expanded ASR recording hours and advanced RAG quotas are governed by your institutional workspace or optional Kitsune Plus plan.',
  },
] as const

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    id: 'zero-cloud-leakage',
    title: '1. Privacy-First On-Premise AI (Zero Cloud Leakage)',
    body: 'Under LectureLens Architecture Decision ADR 0001, speech-to-text (PhoWhisper-base / PhoWhisper-medium), 1024-dimensional dense embeddings (BGE-M3), cross-encoder precision reranking (BGE-Reranker-v2-m3), and grounded LLM synthesis (Ollama Gemma 4 E4B) execute 100% locally on institutional on-premise servers. Zero third-party cloud AI services (such as OpenAI, Anthropic, or external cloud STT APIs) ever receive your lecture audio, transcripts, or questions.',
  },
  {
    id: 'data-processed',
    title: '2. Data Processed & Stored',
    body: 'Account profile details (full name, university email, hashed password or Apple/Google OAuth assertion), uploaded lecture audio normalized to 16kHz mono PCM, immutable transcript.json segments, and halfvec(1024) vector chunks indexed in PostgreSQL with pgvector (rag.lecture_chunks) are stored strictly within your configured gateway. Local preferences, test accounts, and session tokens cache safely on your device via AsyncStorage.',
  },
  {
    id: 'network-isolation',
    title: '3. Network Isolation & Course-Scoped Access',
    body: 'The LectureLens mobile app communicates solely with the Spring Boot Gateway (EXPO_PUBLIC_GATEWAY_URL); PostgreSQL, FastAPI, and Ollama expose zero public network ports and communicate inside an isolated subnet authenticated via X-Internal-Secret. RAG retrieval enforces per-user authorizedLectureIds course access boundaries.',
  },
  {
    id: 'device-permissions-control',
    title: '4. Microphone Permission & Data Control',
    body: 'Microphone recording (RECORD_AUDIO / NSMicrophoneUsageDescription) and background audio playback via expo-audio run only while actively recording or listening via the Capsule Audio Player. You may clear locally cached credentials from device storage or request deletion of uploaded lectures and account data through your campus gateway administrator.',
  },
] as const

export function getLegalDocument(tab: LegalDocumentTab): LegalDocumentView {
  if (tab === 'privacy') {
    return {
      tab: 'privacy',
      heading: 'Privacy Policy',
      subtitle: 'Zero third-party cloud AI transmission — verified on-premise architecture.',
      sections: PRIVACY_SECTIONS,
    }
  }

  return {
    tab: 'terms',
    heading: 'Terms of Service',
    subtitle: 'Student academic usage, recording responsibilities, and gateway access.',
    sections: TERMS_SECTIONS,
  }
}
