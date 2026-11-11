// [S08, S09] Home - Study Hub Dashboard
import React from 'react'
import { RouteSlot } from '../../components/navigation/RouteSlot'

export default function HomeScreen() {
  return (
    <RouteSlot
      id="S08_09"
      number="08-09"
      name="Home - Study Hub Dashboard"
      category="Tab Root 1"
      description="Bàn học điện tử trung tâm. Bao gồm cả trạng thái Offline [09] khi mất kết nối."
    />
  )
}
