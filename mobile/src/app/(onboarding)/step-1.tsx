// [S02] Onboarding Step 1 (Record or Upload)
import React from 'react'
import { RouteSlot } from '../../components/navigation/RouteSlot'

export default function OnboardingStep1() {
  return (
    <RouteSlot
      id="S02"
      number="02"
      name="Onboarding - Step 1 (Record or Upload)"
      category="Linear Wizard"
      description="Giới thiệu tính năng ghi âm và trích xuất ASR tiếng Việt với PhoWhisper."
    />
  )
}
