import React from 'react'
import { AuthCarousel } from '../../components/auth'

/**
 * Screen 06 — Auth - Create Account route entrypoint.
 * Hosts unified swipeable AuthCarousel anchored initially at Create Account (step 1).
 */
export default function CreateAccountScreen() {
  return <AuthCarousel initialScreen="create-account" />
}
