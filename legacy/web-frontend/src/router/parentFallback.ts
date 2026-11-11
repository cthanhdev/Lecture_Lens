/**
 * Bản đồ Hierarchy Fallback Matrix (Định luật 1 - Hiến chương điều hướng)
 * Đảm bảo người dùng truy cập trực tiếp bằng Deep Link không bao giờ gặp tình trạng cụt đường.
 */

export const ROUTE_PARENT_FALLBACK: Record<string, string> = {
  '/lectures/:id/chapters/:chId': '/lectures/:id/cornell',
  '/lectures/:id/transcript': '/library',
  '/lectures/:id/highlights': '/library',
  '/lectures/:id/cornell': '/library',
  '/subjects/:courseId': '/subjects',
  '/settings': '/profile',
  '/review/session/:deckId': '/review',
  '/review/complete/:deckId': '/review',
  '/search': '/home',
  '/auth/create-account': '/auth/sign-in',
  '/library': '/home',
  '/subjects': '/home',
  '/review': '/home',
  '/profile': '/home',
}

/**
 * Tìm route cha tương ứng cho đường dẫn hiện tại (hỗ trợ dynamic params)
 */
export function getParentFallback(pathname: string): string {
  // Kiểm tra khớp trực tiếp
  if (ROUTE_PARENT_FALLBACK[pathname]) {
    return ROUTE_PARENT_FALLBACK[pathname]
  }

  // Khớp dynamic chapter drilldown: /lectures/:id/chapters/:chId
  const chapterMatch = pathname.match(/^\/lectures\/([^/]+)\/chapters\/[^/]+$/)
  if (chapterMatch) {
    return `/lectures/${chapterMatch[1]}/cornell`
  }

  // Khớp dynamic lecture detail: /lectures/:id/...
  const lectureMatch = pathname.match(/^\/lectures\/([^/]+)\/(transcript|highlights|cornell)$/)
  if (lectureMatch) {
    return '/library'
  }

  // Khớp dynamic subject detail: /subjects/:courseId
  const subjectMatch = pathname.match(/^\/subjects\/[^/]+$/)
  if (subjectMatch) {
    return '/subjects'
  }

  // Khớp review session & complete
  const reviewMatch = pathname.match(/^\/review\/(session|complete)\/[^/]+$/)
  if (reviewMatch) {
    return '/review'
  }

  // Khớp audio processing
  const audioMatch = pathname.match(/^\/audio\/processing\/[^/]+$/)
  if (audioMatch) {
    return '/library'
  }

  if (pathname === '/audio/record') {
    return '/home'
  }

  // Mặc định về trang chủ an toàn
  return '/home'
}
