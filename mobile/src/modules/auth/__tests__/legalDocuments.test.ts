import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  LEGAL_LAST_UPDATED,
  LEGAL_PRODUCT_SUBTITLE,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
  getLegalDocument,
} from '../domain/legalDocuments.ts'

describe('LectureLens Legal Documents (Terms & Privacy Policy)', () => {
  it('provides non-empty structured Terms of Service and Privacy Policy sections', () => {
    assert.ok(LEGAL_LAST_UPDATED.length > 0)
    assert.ok(LEGAL_PRODUCT_SUBTITLE.includes('LectureLens'))
    assert.ok(TERMS_SECTIONS.length >= 4)
    assert.ok(PRIVACY_SECTIONS.length >= 4)

    for (const section of [...TERMS_SECTIONS, ...PRIVACY_SECTIONS]) {
      assert.ok(section.id.trim().length > 0)
      assert.ok(section.title.trim().length > 0)
      assert.ok(section.body.trim().length >= 60)
    }
  })

  it('accurately describes LectureLens study workspace, Spring Boot gateway, and Kitsune Plus in Terms', () => {
    const termsText = TERMS_SECTIONS.map((s) => `${s.title} ${s.body}`).join('\n')

    assert.match(termsText, /LectureLens/i)
    assert.match(termsText, /Cornell Notes/i)
    assert.match(termsText, /Kitsune Flashcard/i)
    assert.match(termsText, /2-Stage Neural RAG/i)
    assert.match(termsText, /Spring Boot/i)
    assert.match(termsText, /Kitsune Plus/i)
    assert.match(termsText, /\[MM:SS\]/)
  })

  it('accurately enforces ADR 0001 Privacy-First On-Premise AI & PostgreSQL pgvector scope in Privacy Policy', () => {
    const privacyText = PRIVACY_SECTIONS.map((s) => `${s.title} ${s.body}`).join('\n')

    assert.match(privacyText, /PhoWhisper/i)
    assert.match(privacyText, /BGE-M3/i)
    assert.match(privacyText, /BGE-Reranker-v2-m3/i)
    assert.match(privacyText, /Gemma 4 E4B/i)
    assert.match(privacyText, /pgvector/i)
    assert.match(privacyText, /AsyncStorage/i)
    assert.match(privacyText, /zero third-party cloud AI|never sent to external cloud/i)
    assert.match(privacyText, /authorizedLectureIds|course access/i)
  })

  it('returns dedicated tab metadata and sections via getLegalDocument seam', () => {
    const terms = getLegalDocument('terms')
    const privacy = getLegalDocument('privacy')

    assert.equal(terms.tab, 'terms')
    assert.equal(terms.heading, 'Terms of Service')
    assert.deepEqual(terms.sections, TERMS_SECTIONS)

    assert.equal(privacy.tab, 'privacy')
    assert.equal(privacy.heading, 'Privacy Policy')
    assert.deepEqual(privacy.sections, PRIVACY_SECTIONS)
  })
})
