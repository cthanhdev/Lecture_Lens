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
  '/(guarded)/review/session/:deckId': '/review',
  '/(guarded)/review/complete/:deckId': '/review',
  '/search': '/home',
  '/(modal)/search': '/home',
  '/auth/create-account': '/auth/sign-in',
  '/(auth)/create-account': '/(auth)/sign-in',
  '/library': '/home',
  '/subjects': '/home',
  '/review': '/home',
  '/profile': '/home',
  '/(tabs)/library': '/(tabs)/home',
  '/(tabs)/subjects': '/(tabs)/home',
  '/(tabs)/review': '/(tabs)/home',
  '/(tabs)/profile': '/(tabs)/home',
}

/**
 * Tìm route cha tương ứng cho đường dẫn hiện tại (hỗ trợ dynamic params)
 */
export function getParentFallback(pathname: string): string {
  // Chuẩn hóa bỏ bớt group route nếu cần
  const cleanPath = pathname

  // Kiểm tra khớp trực tiếp
  if (ROUTE_PARENT_FALLBACK[cleanPath]) {
    return ROUTE_PARENT_FALLBACK[cleanPath]
  }

  // Khớp dynamic chapter drilldown: /lectures/:id/chapters/:chId
  const chapterMatch = cleanPath.match(/^\/lectures\/([^/]+)\/chapters\/[^/]+$/)
  if (chapterMatch) {
    return `/lectures/${chapterMatch[1]}/cornell`
  }

  // Khớp dynamic lecture detail: /lectures/:id/...
  const lectureMatch = cleanPath.match(/^\/lectures\/([^/]+)\/(transcript|highlights|cornell)$/)
  if (lectureMatch) {
    return '/library'
  }

  // Khớp dynamic subject detail: /subjects/:courseId
  const subjectMatch = cleanPath.match(/^\/subjects\/[^/]+$/)
  if (subjectMatch) {
    return '/subjects'
  }

  // Khớp review session & complete
  const reviewMatch = cleanPath.match(/^(\/\(guarded\))?\/review\/(session|complete)\/[^/]+$/)
  if (reviewMatch) {
    return '/review'
  }

  // Khớp audio processing
  const audioMatch = cleanPath.match(/^(\/\(guarded\))?\/audio\/processing\/[^/]+$/)
  if (audioMatch) {
    return '/library'
  }

  if (cleanPath === '/audio/record' || cleanPath === '/(guarded)/audio/record') {
    return '/home'
  }

  // Mặc định về trang chủ an toàn
  return '/home'
}
