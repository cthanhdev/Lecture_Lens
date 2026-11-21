import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { shouldExitOnBack } from '../backExitGuard.ts'

describe('Home Android Double-Back Exit Guard', () => {
  it('requires a second press within 2000ms before exiting', () => {
    assert.equal(shouldExitOnBack(null, 1000), false)
    assert.equal(shouldExitOnBack(1000, 1500), true)
    assert.equal(shouldExitOnBack(1000, 3000), true)
    assert.equal(shouldExitOnBack(1000, 3001), false)
    assert.equal(shouldExitOnBack(1000, 900), false)
  })
})
