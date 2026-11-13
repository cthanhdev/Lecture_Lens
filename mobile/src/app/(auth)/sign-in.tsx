import React from 'react'
import { AuthCarousel } from '../../components/auth'

/**
 * Screen 05 — Auth - Sign In route entrypoint.
 * Hosts unified swipeable AuthCarousel anchored initially at Sign In (step 0).
 */
export default function SignInScreen() {
  return <AuthCarousel initialScreen="sign-in" />
}
