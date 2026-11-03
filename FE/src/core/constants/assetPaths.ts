import React from 'react';
import { SvgProps } from 'react-native-svg';
import { LlIcon, LlIconName } from '../../shared/widgets/icons/LlIcon';

// Illustrations
import CuMeoHappySvg from '../../../assets/svg/illustrations/cu_meo_happy.svg';
import CuMeoListeningSvg from '../../../assets/svg/illustrations/cu_meo_listening.svg';
import EmptyLibrarySvg from '../../../assets/svg/illustrations/empty_library.svg';
import UploadZoneSvg from '../../../assets/svg/illustrations/upload_zone.svg';

// Logo
import LogoFullSvg from '../../../assets/svg/logo/logo_full.svg';
import LogoIconSvg from '../../../assets/svg/logo/logo_icon.svg';
import LogoSplashSvg from '../../../assets/svg/logo/logo_splash.svg';

interface SvgIconCompatProps extends SvgProps {
  size?: number;
  filled?: boolean;
}

const createSvgIconAdapter = (iconName: LlIconName, defaultFilled = false) => {
  const IconComponent: React.FC<SvgIconCompatProps> = ({
    width,
    height,
    fill,
    stroke,
    color,
    size: propSize,
    filled,
    style,
  }) => {
    const parsedWidth = typeof width === 'number' ? width : typeof width === 'string' && !isNaN(Number(width)) ? Number(width) : undefined;
    const parsedHeight = typeof height === 'number' ? height : typeof height === 'string' && !isNaN(Number(height)) ? Number(height) : undefined;
    const size = propSize ?? parsedWidth ?? parsedHeight ?? 24;
    const resolvedColor = (color || stroke || (fill && fill !== 'none' ? fill : undefined) || '#6d5fd0') as string;
    const isFilled = filled ?? (fill === 'none' ? false : defaultFilled);

    return React.createElement(LlIcon, {
      name: iconName,
      size,
      color: resolvedColor,
      filled: isFilled,
      style,
    });
  };
  return IconComponent;
};

export const SvgIcons = {
  // Actions
  Bell: createSvgIconAdapter('notifications'),
  Bookmark: createSvgIconAdapter('bookmark', true),
  Forward: createSvgIconAdapter('fast_forward', true),
  Forward10: createSvgIconAdapter('forward_10'),
  Mic: createSvgIconAdapter('mic'),
  Pause: createSvgIconAdapter('pause', true),
  Play: createSvgIconAdapter('play_arrow', true),
  Rewind: createSvgIconAdapter('fast_rewind', true),
  Replay10: createSvgIconAdapter('replay_10'),
  Send: createSvgIconAdapter('send'),
  Share: createSvgIconAdapter('share'),
  UploadCloud: createSvgIconAdapter('cloud_upload'),

  // Navigation
  CuMeoAi: createSvgIconAdapter('auto_awesome'),
  Library: createSvgIconAdapter('local_library'),
  Search: createSvgIconAdapter('search'),
  Settings: createSvgIconAdapter('settings'),

  // Status & Indicators
  CheckCircle: createSvgIconAdapter('check_circle', true),
  Clock: createSvgIconAdapter('clock'),
  Error: createSvgIconAdapter('error'),
  Warning: createSvgIconAdapter('warning'),
  Info: createSvgIconAdapter('info'),
  Pin: createSvgIconAdapter('push_pin'),
  Processing: createSvgIconAdapter('sync'),
  Star: createSvgIconAdapter('star', true),
  Mail: createSvgIconAdapter('mail'),
  Close: createSvgIconAdapter('close'),
  ArrowForward: createSvgIconAdapter('arrow_forward'),
  OpenInNew: createSvgIconAdapter('open_in_new'),
  SwapVert: createSvgIconAdapter('swap_vert'),
  ArrowDropDown: createSvgIconAdapter('arrow_drop_down', true),
  Add: createSvgIconAdapter('add'),
  School: createSvgIconAdapter('school'),
  Pets: createSvgIconAdapter('pets', true),
  Bedtime: createSvgIconAdapter('bedtime', true),
  Translate: createSvgIconAdapter('translate'),
  NorthWest: createSvgIconAdapter('north_west'),
  Person: createSvgIconAdapter('person'),
  AccountBalance: createSvgIconAdapter('account_balance'),
  Logout: createSvgIconAdapter('logout'),
  Description: createSvgIconAdapter('description'),
  Toc: createSvgIconAdapter('toc'),
  MusicNote: createSvgIconAdapter('music_note'),
};

export const SvgIllustrations = {
  CuMeoHappy: CuMeoHappySvg,
  CuMeoListening: CuMeoListeningSvg,
  EmptyLibrary: EmptyLibrarySvg,
  UploadZone: UploadZoneSvg,
};

export const SvgLogos = {
  Full: LogoFullSvg,
  Icon: LogoIconSvg,
  Splash: LogoSplashSvg,
};

// Unified SVG Icon System
export { LlIcon, LlIconName } from '../../shared/widgets/icons/LlIcon';
