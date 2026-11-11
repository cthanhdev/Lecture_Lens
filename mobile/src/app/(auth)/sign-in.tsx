// [S05] Auth - Sign In
import React from 'react'
import { RouteSlot } from '../../components/navigation/RouteSlot'

export default function SignInScreen() {
  return (
    <RouteSlot
      id="S05"
      number="05"
      name="Auth - Sign In"
      category="Authentication"
      description="Đăng nhập tài khoản sinh viên với email và mật khẩu."
    />
  )
}
