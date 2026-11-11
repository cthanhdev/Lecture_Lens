import { useState } from 'react'
import { Icon } from '../../../components/ui/icons/Icon.tsx'
import type { BackendConnectionState } from '../domain/auth.types.ts'

interface BackendStatusBannerProps {
  connectionState: BackendConnectionState
  onRetry: () => Promise<void>
  isSimulatedLoading?: boolean
  onToggleSimulatedLoading?: () => void
}

export function BackendStatusBanner({
  connectionState,
  onRetry,
  isSimulatedLoading,
  onToggleSimulatedLoading,
}: BackendStatusBannerProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  if (connectionState === 'connected' && !isSimulatedLoading) {
    return null
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const isOffline = connectionState === 'offline'
  const isBackendDown = connectionState === 'backend_unreachable'

  return (
    <div className="w-full mb-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#F5C3C9] p-3.5 shadow-sm text-left transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 text-[#F47F72]">
          <Icon name="wifi-off" size="md" blob="sakura" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-[#261333]">
              {isOffline
                ? 'Thiết bị đang Ngoại tuyến (Offline)'
                : 'Chế độ Xem trước Ngoại tuyến (Offline Preview)'}
            </h4>

            {onToggleSimulatedLoading && (
              <button
                type="button"
                onClick={onToggleSimulatedLoading}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE27A]/40 text-[#56423F] hover:bg-[#FFE27A]/70 transition-colors mochi-press cursor-pointer"
              >
                {isSimulatedLoading ? 'Tắt Skeleton' : 'Mô phỏng Skeleton'}
              </button>
            )}
          </div>

          <p className="text-[11px] text-[#56423F]/85 leading-relaxed mt-0.5">
            {isOffline
              ? 'Không phát hiện kết nối Internet. Dữ liệu xác thực sẽ được lưu tạm cục bộ.'
              : isBackendDown
                ? 'Backend Spring Boot (Cổng 8080) chưa khởi chạy. Bạn vẫn có thể nhập form và trải nghiệm toàn bộ giao diện bình thường.'
                : 'Đang kiểm tra kết nối máy chủ...'}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5C3C9]/50 hover:bg-[#F5C3C9] text-[#261333] text-[11px] font-bold transition-all mochi-press cursor-pointer"
            >
              <span className={isRetrying ? 'animate-spin' : ''}>
                <Icon name="refresh" size="xs" />
              </span>
              <span>{isRetrying ? 'Đang kiểm tra...' : 'Thử kết nối lại'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
