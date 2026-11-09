import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic, Upload, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAppNavigation } from '../router/useAppNavigation.ts'

export function ModalSheetHost() {
  const nav = useAppNavigation()

  const isOpen = nav.activeSheet !== null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
          {/* Backdrop mờ Miruku Glass */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#261333]/30 backdrop-blur-sm"
            onClick={() => nav.closeSheet()}
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-t-[36px] bg-white p-6 pb-10 shadow-2xl border-t border-white/80 z-10"
          >
            {/* Drag Handle Bar */}
            <div className="w-12 h-1.5 rounded-full bg-[#261333]/15 mx-auto mb-6" />

            {/* SHEET 13: Add Audio Bottom Sheet */}
            {nav.activeSheet === 'add-audio' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#261333] tracking-tight">
                      Thêm Bài Giảng Mới
                    </h3>
                    <p className="text-xs text-[#56423F]">
                      Chuyển đổi âm thanh lớp học thành ghi chú Cornell thông minh
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav.closeSheet()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#56423F] hover:bg-slate-100 transition-colors mochi-press"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3.5 mb-6">
                  {/* Option 1: Live Record */}
                  <button
                    type="button"
                    onClick={() => {
                      nav.closeSheet()
                      nav.goTo('/audio/record')
                    }}
                    className="p-4 rounded-[24px] bg-[#FFF7FD] border border-[#F47F72]/30 hover:border-[#F47F72] flex items-center gap-4 text-left mochi-press transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#F47F72] text-white flex items-center justify-center shadow-md shadow-[#F47F72]/20 group-hover:scale-105 transition-transform">
                      <Mic className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#261333]">
                        Ghi âm trực tiếp tại lớp
                      </h4>
                      <p className="text-xs text-[#56423F]">
                        Sử dụng micro máy tính/điện thoại, đánh dấu mốc thời gian tức thì
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Upload File */}
                  <button
                    type="button"
                    onClick={() => {
                      nav.closeSheet()
                      nav.goTo('/audio/processing/job-upload-demo')
                    }}
                    className="p-4 rounded-[24px] bg-[#FFF7FD] border border-[#A9D4E8]/50 hover:border-[#A9D4E8] flex items-center gap-4 text-left mochi-press transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#A9D4E8] text-[#261333] flex items-center justify-center shadow-md shadow-[#A9D4E8]/20 group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#261333]">
                        Tải tệp âm thanh lên
                      </h4>
                      <p className="text-xs text-[#56423F]">
                        Hỗ trợ MP3, M4A, WAV ghi âm sẵn từ máy ghi âm hoặc giảng viên
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* SHEET 07: Paywall Kitsune Plus */}
            {nav.activeSheet === 'paywall' && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <Sparkles className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#261333] mb-1">
                  Kitsune Plus
                </h3>
                <p className="text-xs text-[#56423F] max-w-xs mx-auto mb-6">
                  Mở khóa sức mạnh tối đa của AI học tập thông minh tiếng Việt
                </p>

                <div className="space-y-2.5 text-left mb-6 max-w-sm mx-auto">
                  <div className="flex items-center gap-3 text-xs text-[#261333]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Ghi âm bài giảng không giới hạn thời lượng</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#261333]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Hỏi đáp 2-Stage Neural RAG siêu tốc độ</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#261333]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Tự động sinh thẻ học Flashcard & Cornell PDF</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => nav.closeSheet()}
                    className="w-full py-3.5 px-6 rounded-full bg-[#F47F72] hover:bg-[#A03F36] text-white font-bold text-sm shadow-md transition-colors mochi-press"
                  >
                    Bắt đầu trải nghiệm Plus
                  </button>
                  <button
                    type="button"
                    onClick={() => nav.closeSheet()}
                    className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-[#56423F] hover:bg-slate-100 transition-colors mochi-press"
                  >
                    Để sau
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
