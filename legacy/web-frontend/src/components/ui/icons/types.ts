// Types for LectureLens Kitsune Soft Iconography
import type { SVGProps } from 'react'

export type IconName =
  | 'home'
  | 'library'
  | 'subjects'
  | 'review'
  | 'profile'
  | 'plus'
  | 'arrow-left'
  | 'arrow-right'
  | 'close'
  | 'more-horizontal'
  | 'more-vertical'
  | 'search'
  | 'filter'
  | 'sort'
  | 'settings'
  | 'bell'
  | 'bell-dot'
  | 'mic'
  | 'mic-off'
  | 'upload'
  | 'cloud-upload'
  | 'link'
  | 'waveform'
  | 'play'
  | 'pause'
  | 'stop'
  | 'replay-10'
  | 'forward-10'
  | 'headphones'
  | 'speaker'
  | 'speed'
  | 'snippet-play'
  | 'sparkles'
  | 'file-text'
  | 'clock'
  | 'star'
  | 'bookmark'
  | 'highlighter'
  | 'flame'
  | 'help-circle'
  | 'list-tree'
  | 'download'
  | 'share'
  | 'copy'
  | 'robot-ai'
  | 'cards'
  | 'flip'
  | 'lightbulb'
  | 'trophy'
  | 'party-popper'
  | 'brain'
  | 'rating-again'
  | 'rating-hard'
  | 'rating-good'
  | 'rating-easy'
  | 'kitsune-fox'
  | 'crown'
  | 'check'
  | 'check-circle'
  | 'check-double'
  | 'wifi-off'
  | 'lock'
  | 'lock-check'
  | 'eye'
  | 'eye-off'
  | 'mail'
  | 'pencil'
  | 'trash'
  | 'refresh'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-right'
  | 'google'
  | 'apple'

export type BlobColor = 'sakura' | 'mist' | 'mochi' | 'matcha' | 'coral' | 'plum'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number

export interface IconPathDef {
  d: string
  fill?: string
  stroke?: string
  strokeWidth?: number
}

export interface IconDefinition {
  title: string
  category: 'navigation' | 'audio' | 'ai' | 'study' | 'review' | 'mascot' | 'system'
  blob?: BlobColor
  paths: IconPathDef[]
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'size'> {
  /** Tên biểu tượng chuẩn hóa trong từ điển */
  name?: IconName
  /** Kích thước biểu tượng: xs(14px), sm(16px), md(20px), lg(24px), xl(32px), 2xl(40px) hoặc số px */
  size?: IconSize
  /** Bật tấm lót đốm hữu cơ Soft-Blob chuẩn Kitsune Soft (độ mờ 0.45, lệch 2px) */
  blob?: boolean | BlobColor
  /** Độ dày nét vẽ outline (mặc định 1.75px chuẩn Kitsune Soft) */
  strokeWidth?: number
  /** Màu nét vẽ chính (mặc định 'currentColor' hoặc #261333) */
  strokeColor?: string
  /** Nhãn tiếp cận cho công nghệ hỗ trợ độc màn hình (Screen Reader) */
  ariaLabel?: string
  /** ClassName bổ sung */
  className?: string
}
