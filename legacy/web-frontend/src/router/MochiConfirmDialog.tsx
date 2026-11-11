import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface MochiConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function MochiConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Rời khỏi trang',
  cancelText = 'Tiếp tục ở lại',
  onConfirm,
  onCancel,
}: MochiConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop mờ Miruku Glass */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#261333]/30 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog Card Squircle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm rounded-[28px] bg-white p-6 plum-shadow-modal border border-white/80 z-10 overflow-hidden"
          >
            {/* Header with icon & close */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100/80 flex items-center justify-center text-amber-600 border border-amber-200">
                <AlertTriangle className="w-6 h-6 stroke-[2]" />
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#56423F] hover:bg-slate-100 transition-colors mochi-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Message */}
            <h3 className="text-lg font-bold text-[#261333] mb-2 leading-snug">
              {title}
            </h3>
            <p className="text-sm text-[#56423F] leading-relaxed mb-6">
              {message}
            </p>

            {/* Action buttons (Pill Shape) */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 px-4 rounded-full bg-[#F47F72] hover:bg-[#A03F36] text-white font-semibold text-sm shadow-sm transition-colors mochi-press"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full py-2.5 px-4 rounded-full bg-transparent hover:bg-red-50 text-red-600 font-semibold text-xs transition-colors mochi-press"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
