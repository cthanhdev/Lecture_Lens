// Barrel export for Kitsune Soft Icon System on React Native
// BẮT BUỘC SỬ DỤNG BỘ ICON NÀY TRONG MOBILE - TUYỆT ĐỐI KHÔNG DÙNG LUCIDE-REACT

export type * from './types'
export { ICON_REGISTRY, SOFT_BLOB_PALETTE, ORGANIC_BLOB_PATH } from './registry'
export { SoftBlob } from './SoftBlob'
export { Icon } from './Icon'

import React from 'react'
import { Icon } from './Icon'
import type { IconProps } from './types'

// === 74 Named Icon Components (Tree-Shakeable) ===
export const HomeIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="home" {...props} />
HomeIcon.displayName = 'HomeIcon'

export const LibraryIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="library" {...props} />
LibraryIcon.displayName = 'LibraryIcon'

export const SubjectsIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="subjects" {...props} />
SubjectsIcon.displayName = 'SubjectsIcon'

export const ReviewIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="review" {...props} />
ReviewIcon.displayName = 'ReviewIcon'

export const ProfileIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="profile" {...props} />
ProfileIcon.displayName = 'ProfileIcon'

export const PlusIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="plus" {...props} />
PlusIcon.displayName = 'PlusIcon'

export const ArrowLeftIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-left" {...props} />
ArrowLeftIcon.displayName = 'ArrowLeftIcon'

export const ArrowRightIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-right" {...props} />
ArrowRightIcon.displayName = 'ArrowRightIcon'

export const CloseIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="close" {...props} />
CloseIcon.displayName = 'CloseIcon'

export const MoreHorizontalIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="more-horizontal" {...props} />
MoreHorizontalIcon.displayName = 'MoreHorizontalIcon'

export const MoreVerticalIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="more-vertical" {...props} />
MoreVerticalIcon.displayName = 'MoreVerticalIcon'

export const SearchIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="search" {...props} />
SearchIcon.displayName = 'SearchIcon'

export const FilterIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="filter" {...props} />
FilterIcon.displayName = 'FilterIcon'

export const SortIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="sort" {...props} />
SortIcon.displayName = 'SortIcon'

export const SettingsIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="settings" {...props} />
SettingsIcon.displayName = 'SettingsIcon'

export const BellIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="bell" {...props} />
BellIcon.displayName = 'BellIcon'

export const BellDotIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="bell-dot" {...props} />
BellDotIcon.displayName = 'BellDotIcon'

export const MicIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="mic" {...props} />
MicIcon.displayName = 'MicIcon'

export const MicOffIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="mic-off" {...props} />
MicOffIcon.displayName = 'MicOffIcon'

export const UploadIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="upload" {...props} />
UploadIcon.displayName = 'UploadIcon'

export const CloudUploadIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="cloud-upload" {...props} />
CloudUploadIcon.displayName = 'CloudUploadIcon'

export const LinkIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="link" {...props} />
LinkIcon.displayName = 'LinkIcon'

export const WaveformIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="waveform" {...props} />
WaveformIcon.displayName = 'WaveformIcon'

export const PlayIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="play" {...props} />
PlayIcon.displayName = 'PlayIcon'

export const PauseIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="pause" {...props} />
PauseIcon.displayName = 'PauseIcon'

export const StopIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="stop" {...props} />
StopIcon.displayName = 'StopIcon'

export const Replay10Icon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="replay-10" {...props} />
Replay10Icon.displayName = 'Replay10Icon'

export const Forward10Icon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="forward-10" {...props} />
Forward10Icon.displayName = 'Forward10Icon'

export const HeadphonesIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="headphones" {...props} />
HeadphonesIcon.displayName = 'HeadphonesIcon'

export const SpeakerIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="speaker" {...props} />
SpeakerIcon.displayName = 'SpeakerIcon'

export const SpeedIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="speed" {...props} />
SpeedIcon.displayName = 'SpeedIcon'

export const SnippetPlayIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="snippet-play" {...props} />
SnippetPlayIcon.displayName = 'SnippetPlayIcon'

export const SparklesIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="sparkles" {...props} />
SparklesIcon.displayName = 'SparklesIcon'

export const FileTextIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-text" {...props} />
FileTextIcon.displayName = 'FileTextIcon'

export const ClockIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="clock" {...props} />
ClockIcon.displayName = 'ClockIcon'

export const StarIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="star" {...props} />
StarIcon.displayName = 'StarIcon'

export const BookmarkIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="bookmark" {...props} />
BookmarkIcon.displayName = 'BookmarkIcon'

export const HighlighterIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="highlighter" {...props} />
HighlighterIcon.displayName = 'HighlighterIcon'

export const FlameIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="flame" {...props} />
FlameIcon.displayName = 'FlameIcon'

export const HelpCircleIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="help-circle" {...props} />
HelpCircleIcon.displayName = 'HelpCircleIcon'

export const ListTreeIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="list-tree" {...props} />
ListTreeIcon.displayName = 'ListTreeIcon'

export const DownloadIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="download" {...props} />
DownloadIcon.displayName = 'DownloadIcon'

export const ShareIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="share" {...props} />
ShareIcon.displayName = 'ShareIcon'

export const CopyIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="copy" {...props} />
CopyIcon.displayName = 'CopyIcon'

export const RobotAiIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="robot-ai" {...props} />
RobotAiIcon.displayName = 'RobotAiIcon'

export const CardsIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="cards" {...props} />
CardsIcon.displayName = 'CardsIcon'

export const FlipIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="flip" {...props} />
FlipIcon.displayName = 'FlipIcon'

export const LightbulbIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="lightbulb" {...props} />
LightbulbIcon.displayName = 'LightbulbIcon'

export const TrophyIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="trophy" {...props} />
TrophyIcon.displayName = 'TrophyIcon'

export const PartyPopperIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="party-popper" {...props} />
PartyPopperIcon.displayName = 'PartyPopperIcon'

export const BrainIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="brain" {...props} />
BrainIcon.displayName = 'BrainIcon'

export const RatingAgainIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="rating-again" {...props} />
RatingAgainIcon.displayName = 'RatingAgainIcon'

export const RatingHardIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="rating-hard" {...props} />
RatingHardIcon.displayName = 'RatingHardIcon'

export const RatingGoodIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="rating-good" {...props} />
RatingGoodIcon.displayName = 'RatingGoodIcon'

export const RatingEasyIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="rating-easy" {...props} />
RatingEasyIcon.displayName = 'RatingEasyIcon'

export const KitsuneFoxIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="kitsune-fox" {...props} />
KitsuneFoxIcon.displayName = 'KitsuneFoxIcon'

export const CrownIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="crown" {...props} />
CrownIcon.displayName = 'CrownIcon'

export const CheckIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="check" {...props} />
CheckIcon.displayName = 'CheckIcon'

export const CheckCircleIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="check-circle" {...props} />
CheckCircleIcon.displayName = 'CheckCircleIcon'

export const CheckDoubleIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="check-double" {...props} />
CheckDoubleIcon.displayName = 'CheckDoubleIcon'

export const WifiOffIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="wifi-off" {...props} />
WifiOffIcon.displayName = 'WifiOffIcon'

export const LockIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="lock" {...props} />
LockIcon.displayName = 'LockIcon'

export const LockCheckIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="lock-check" {...props} />
LockCheckIcon.displayName = 'LockCheckIcon'

export const EyeIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="eye" {...props} />
EyeIcon.displayName = 'EyeIcon'

export const EyeOffIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="eye-off" {...props} />
EyeOffIcon.displayName = 'EyeOffIcon'

export const MailIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="mail" {...props} />
MailIcon.displayName = 'MailIcon'

export const PencilIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="pencil" {...props} />
PencilIcon.displayName = 'PencilIcon'

export const TrashIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="trash" {...props} />
TrashIcon.displayName = 'TrashIcon'

export const RefreshIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="refresh" {...props} />
RefreshIcon.displayName = 'RefreshIcon'

export const ChevronDownIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-down" {...props} />
ChevronDownIcon.displayName = 'ChevronDownIcon'

export const ChevronUpIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-up" {...props} />
ChevronUpIcon.displayName = 'ChevronUpIcon'

export const ChevronRightIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-right" {...props} />
ChevronRightIcon.displayName = 'ChevronRightIcon'

export const GoogleIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="google" {...props} />
GoogleIcon.displayName = 'GoogleIcon'

export const AppleIcon: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="apple" {...props} />
AppleIcon.displayName = 'AppleIcon'
