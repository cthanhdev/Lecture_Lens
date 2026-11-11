import { motion } from 'framer-motion'
import {
  HomeIcon,
  LibraryIcon,
  PlusIcon,
  SubjectsIcon,
  ReviewIcon,
  ProfileIcon,
} from '../components/ui/icons/index.tsx'
import { useAppNavigation } from '../router/useAppNavigation.ts'
import type { TabRoute } from '../router/types.ts'

interface TabItem {
  route: TabRoute
  label: string
  icon: typeof HomeIcon
}

const TABS: TabItem[] = [
  { route: '/home', label: 'Bàn học', icon: HomeIcon },
  { route: '/library', label: 'Kho bài giảng', icon: LibraryIcon },
  { route: '/subjects', label: 'Môn học', icon: SubjectsIcon },
  { route: '/review', label: 'Ôn tập', icon: ReviewIcon },
  { route: '/profile', label: 'Hồ sơ', icon: ProfileIcon },
]

export function FloatingIslandTabBar() {
  const nav = useAppNavigation()

  // Ẩn tab bar nếu ở các màn hình con sâu (như /audio/record, /review/session)
  const isHidden =
    nav.currentRoute === '/audio/record' ||
    nav.currentRoute.startsWith('/review/session/') ||
    nav.currentRoute.startsWith('/onboarding') ||
    nav.currentRoute.startsWith('/auth')

  if (isHidden) {
    return null
  }

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="w-full max-w-[370px] mx-auto pointer-events-auto">
        <nav
          aria-label="Điều hướng chính"
          className="rounded-full miruku-glass-elevated border border-white/95 px-3 py-2 flex items-center justify-between shadow-2xl relative"
        >
          {/* 2 Tab Bên Trái: Home & Library */}
          <div className="flex items-center gap-1">
            {TABS.slice(0, 2).map((tab) => {
              const isActive = nav.activeTab === tab.route
              const Icon = tab.icon

              return (
                <button
                  key={tab.route}
                  type="button"
                  onClick={() => nav.goTo(tab.route)}
                  className={`relative px-3.5 py-2 rounded-full flex flex-col items-center gap-0.5 mochi-press transition-colors ${
                    isActive ? 'text-[#F47F72]' : 'text-[#56423F] hover:text-[#261333]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBadge"
                      className="absolute inset-0 bg-[#F47F72]/15 rounded-full -z-10"
                      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    />
                  )}
                  <Icon className="w-5 h-5 stroke-[2]" />
                  <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Nút FAB Thêm Bài Giảng Ở Giữa */}
          <div className="px-1 -my-3">
            <button
              type="button"
              onClick={() => nav.openSheet('add-audio')}
              aria-label="Thêm bài giảng mới"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#F47F72] to-[#F5C3C9] text-white flex items-center justify-center shadow-lg shadow-[#F47F72]/30 hover:brightness-105 transition-all mochi-press"
            >
              <PlusIcon size="lg" strokeWidth={2.2} />
            </button>
          </div>

          {/* 3 Tab Bên Phải: Subjects, Review & Profile */}
          <div className="flex items-center gap-1">
            {TABS.slice(2).map((tab) => {
              const isActive = nav.activeTab === tab.route
              const Icon = tab.icon

              return (
                <button
                  key={tab.route}
                  type="button"
                  onClick={() => nav.goTo(tab.route)}
                  className={`relative px-3 py-2 rounded-full flex flex-col items-center gap-0.5 mochi-press transition-colors ${
                    isActive ? 'text-[#F47F72]' : 'text-[#56423F] hover:text-[#261333]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBadge"
                      className="absolute inset-0 bg-[#F47F72]/15 rounded-full -z-10"
                      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    />
                  )}
                  <Icon className="w-5 h-5 stroke-[2]" />
                  <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
