import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, G, Text as SvgText } from 'react-native-svg';
import { StyleProp, ViewStyle } from 'react-native';

export type LlIconName =
  | 'local_library'
  | 'search'
  | 'settings'
  | 'dashboard'
  | 'arrow_back'
  | 'arrow_forward'
  | 'notifications'
  | 'play_arrow'
  | 'pause'
  | 'replay_10'
  | 'forward_10'
  | 'mic'
  | 'graphic_eq'
  | 'auto_awesome'
  | 'headphones'
  | 'chat_bubble'
  | 'push_pin'
  | 'style'
  | 'lightbulb'
  | 'cloud_upload'
  | 'sync'
  | 'cloud_done'
  | 'folder_open'
  | 'picture_as_pdf'
  | 'share'
  | 'wifi_off'
  | 'network_check'
  | 'refresh'
  | 'check_circle'
  | 'lock'
  | 'visibility'
  | 'light_mode'
  | 'dark_mode'
  | 'contrast'
  | 'palette'
  | 'format_size'
  | 'code'
  | 'clock'
  | 'mail'
  | 'close'
  | 'open_in_new'
  | 'swap_vert'
  | 'arrow_drop_down'
  | 'add'
  | 'school'
  | 'pets'
  | 'bedtime'
  | 'translate'
  | 'north_west'
  | 'bookmark'
  | 'send'
  | 'star'
  | 'error'
  | 'warning'
  | 'info'
  | 'person'
  | 'account_balance'
  | 'logout'
  | 'description'
  | 'toc'
  | 'fast_forward'
  | 'fast_rewind'
  | 'music_note';

export interface LlIconProps {
  name: LlIconName;
  size?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export const LlIcon: React.FC<LlIconProps> = ({
  name,
  size = 24,
  color = '#6d5fd0',
  filled,
  strokeWidth = 2,
  style,
}) => {
  const isActuallyFilled =
    filled ??
    [
      'play_arrow',
      'pause',
      'auto_awesome',
      'check_circle',
      'dark_mode',
      'contrast',
      'arrow_drop_down',
      'pets',
      'bedtime',
      'star',
      'fast_forward',
      'fast_rewind',
    ].includes(name);

  const renderIconContent = () => {
    switch (name) {
      // Navigation
      case 'local_library':
        return (
          <>
            <Circle cx="12" cy="5.5" r="2.5" />
            <Path d="M4 19.5v-7A2.5 2.5 0 0 1 6.5 10H12m8 9.5v-7A2.5 2.5 0 0 0 17.5 10H12m0 0v9.5" />
            <Path d="M2 20h20" />
          </>
        );
      case 'search':
        return (
          <>
            <Circle cx="11" cy="11" r="7" fill="none" />
            <Path d="m20 20-3.5-3.5" />
          </>
        );
      case 'settings':
        return (
          <>
            <Circle cx="12" cy="12" r="3" fill="none" />
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" />
          </>
        );
      case 'dashboard':
        return (
          <>
            <Rect x="3" y="3" width="7" height="9" rx="2" />
            <Rect x="14" y="3" width="7" height="5" rx="2" />
            <Rect x="14" y="12" width="7" height="9" rx="2" />
            <Rect x="3" y="16" width="7" height="5" rx="2" />
          </>
        );
      case 'arrow_back':
        return <Path d="M19 12H5m0 0 6 6m-6-6 6-6" />;
      case 'notifications':
        return (
          <>
            <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <Path d="M10.3 21a2 2 0 0 0 3.4 0" />
          </>
        );

      // Audio
      case 'play_arrow':
        return <Path d="m8 5.14 11 6.86-11 6.86V5.14z" fill={color} stroke={color} />;
      case 'pause':
        return (
          <>
            <Rect x="6" y="4" width="4" height="16" rx="2" fill={color} />
            <Rect x="14" y="4" width="4" height="16" rx="2" fill={color} />
          </>
        );
      case 'replay_10':
        return (
          <>
            <Path d="M4 12a8 8 0 1 0 2.34-5.66L3 9" />
            <Path d="M3 3v6h6" />
            <SvgText x="12" y="14.5" fontSize="6.5" fontWeight="700" textAnchor="middle" fill={color} stroke="none">10</SvgText>
          </>
        );
      case 'forward_10':
        return (
          <>
            <Path d="M20 12a8 8 0 1 1-2.34-5.66L21 9" />
            <Path d="M21 3v6h-6" />
            <SvgText x="12" y="14.5" fontSize="6.5" fontWeight="700" textAnchor="middle" fill={color} stroke="none">10</SvgText>
          </>
        );
      case 'mic':
        return (
          <>
            <Rect x="9" y="2" width="6" height="12" rx="3" />
            <Path d="M5 10a7 7 0 0 0 14 0m-7 7v4m-4 0h8" />
          </>
        );
      case 'graphic_eq':
        return <Path d="M4 10v4m4-7v10m4-14v18m4-13v8m4-5v2" strokeWidth={2.5} />;

      // AI & Mascot
      case 'auto_awesome':
        return (
          <>
            <Path d="m12 2 2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2z" fill={isActuallyFilled ? color : 'none'} />
            <Path d="m19 15 1.2 2.8L23 19l-2.8 1.2L19 23l-1.2-2.8L15 19l2.8-1.2L19 15z" fill={isActuallyFilled ? color : 'none'} />
            <Circle cx="5" cy="4" r="1.5" fill={isActuallyFilled ? color : 'none'} />
          </>
        );
      case 'headphones':
        return <Path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5a10 10 0 0 1 20 0v5a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />;
      case 'chat_bubble':
        return <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />;
      case 'push_pin':
        return <Path d="m15 4.5 4.5 4.5m-3-1.5 2 2-4 4-5.5-1.5L5 20l-1-1 8-4-1.5-5.5 4-4z" />;
      case 'style':
        return (
          <>
            <Rect x="3.5" y="6.5" width="13" height="14" rx="2.5" transform="rotate(-6 10 13.5)" />
            <Rect x="7.5" y="3.5" width="13" height="14" rx="2.5" transform="rotate(6 14 10.5)" />
          </>
        );
      case 'lightbulb':
        return (
          <>
            <Path d="M9 18h6m-5 3h4m-7-9a6 6 0 1 1 8 0c-.8.8-1.5 1.8-1.5 3h-5c0-1.2-.7-2.2-1.5-3z" />
          </>
        );

      // Files & Cloud
      case 'cloud_upload':
        return <Path d="M4 16.2A5.5 5.5 0 0 1 6.5 6a6 6 0 0 1 11.4 2A4.5 4.5 0 0 1 18 16.5M12 11v9m-3-6 3-3 3 3" />;
      case 'sync':
        return <Path d="M21.5 2v6h-6m-11 14v-6h6M3.5 13a9 9 0 0 1 15-6.7L21.5 8M2.5 16l3 1.7A9 9 0 0 0 20.5 11" />;
      case 'cloud_done':
        return <Path d="M4 16.2A5.5 5.5 0 0 1 6.5 6a6 6 0 0 1 11.4 2A4.5 4.5 0 0 1 18 16.5m-9-3 3 3 5-5" />;
      case 'folder_open':
        return <Path d="M2 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H2zm0 4h20l-2 9H4z" />;
      case 'picture_as_pdf':
        return (
          <>
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <Path d="M14 2v6h6" />
            <Path d="M7 14h2a1 1 0 0 0 0-2H7v4m5-4v4m0-2h1.5m2.5-2v4h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
          </>
        );
      case 'share':
        return (
          <>
            <Circle cx="18" cy="5" r="3" />
            <Circle cx="6" cy="12" r="3" />
            <Circle cx="18" cy="19" r="3" />
            <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </>
        );

      // States & Connectivity
      case 'wifi_off':
        return <Path d="M1 1l22 22m-5.3-5.3a10.9 10.9 0 0 0 4.3-2.7m-8 0a6 6 0 0 0 1.5-.2m-5.5 2.2a2 2 0 0 0 3 0M5 7.8A15 15 0 0 1 21.8 7m-13.6 4a11 11 0 0 1 6.8-1.5" />;
      case 'network_check':
        return (
          <>
            <Path d="M12 4a10 10 0 0 0-8 16h16a10 10 0 0 0-8-16z" />
            <Path d="m12 12 3-3" />
            <Circle cx="12" cy="12" r="1.5" fill={color} />
          </>
        );
      case 'refresh':
        return <Path d="M21 12a9 9 0 1 1-2.6-6.4L21 8m0-5v5h-5" />;
      case 'clock':
        return (
          <>
            <Circle cx="12" cy="12" r="10" />
            <Polyline points="12 6 12 12 16 14" />
          </>
        );
      case 'mail':
        return (
          <>
            <Rect x="3" y="5" width="18" height="14" rx="2" />
            <Polyline points="3 7 12 13 21 7" />
          </>
        );
      case 'check_circle': {
        const checkColor = isActuallyFilled
          ? (color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff' || color.toLowerCase() === 'white' ? '#6d5fd0' : '#FFFFFF')
          : color;
        return (
          <>
            <Circle cx="12" cy="12" r="9" fill={isActuallyFilled ? color : 'none'} stroke={color} />
            <Path d="m8.5 12 2.5 2.5 5-5" stroke={checkColor} fill="none" />
          </>
        );
      }
      case 'lock':
        return (
          <>
            <Rect x="5" y="11" width="14" height="10" rx="2" />
            <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
            <Circle cx="12" cy="16" r="1" fill={color} />
          </>
        );
      case 'visibility':
        return (
          <>
            <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
            <Circle cx="12" cy="12" r="3" />
          </>
        );

      // Themes & Customization
      case 'light_mode':
        return (
          <>
            <Circle cx="12" cy="12" r="4" />
            <Path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14-1.41 1.41" />
          </>
        );
      case 'dark_mode':
        return <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} />;
      case 'contrast':
        return (
          <>
            <Circle cx="12" cy="12" r="9" />
            <Path d="M12 3v18a9 9 0 0 0 0-18z" fill={color} />
          </>
        );
      case 'palette':
        return (
          <>
            <Path d="M12 2a10 10 0 0 0-2 19.8c.6.1 1.1-.3 1.1-.9v-.9a2 2 0 0 1 2-2h1.5a5.5 5.5 0 0 0 5.5-5.5C20.1 7.2 16.5 2 12 2z" />
            <Circle cx="8" cy="8" r="1.5" fill={color} />
            <Circle cx="12" cy="6.5" r="1.5" fill={color} />
            <Circle cx="16" cy="8" r="1.5" fill={color} />
          </>
        );
      case 'format_size':
        return <Path d="M3 7h8m-4-3v14m9-8h6m-3-2v8" />;
      case 'code':
        return (
          <>
            <Polyline points="16 18 22 12 16 6" />
            <Polyline points="8 6 2 12 8 18" />
            <Line x1="14" y1="4" x2="10" y2="20" />
          </>
        );
      case 'arrow_forward':
        return <Path d="M5 12h14m-6-6 6 6-6 6" />;
      case 'close':
        return <Path d="M18 6 6 18M6 6l12 12" />;
      case 'open_in_new':
        return (
          <>
            <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <Polyline points="15 3 21 3 21 9" />
            <Line x1="10" y1="14" x2="21" y2="3" />
          </>
        );
      case 'swap_vert':
        return (
          <>
            <Path d="M8 3v18m0 0-4-4m4 4 4-4" />
            <Path d="M16 21V3m0 0-4 4m4-4 4 4" />
          </>
        );
      case 'arrow_drop_down':
        return <Path d="m7 10 5 5 5-5z" fill={color} stroke={color} />;
      case 'add':
        return <Path d="M12 5v14m-7-7h14" />;
      case 'school':
        return (
          <>
            <Path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <Path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
          </>
        );
      case 'pets':
        return (
          <>
            <Circle cx="4.5" cy="9.5" r="2" fill={color} stroke="none" />
            <Circle cx="9" cy="5.5" r="2" fill={color} stroke="none" />
            <Circle cx="15" cy="5.5" r="2" fill={color} stroke="none" />
            <Circle cx="19.5" cy="9.5" r="2" fill={color} stroke="none" />
            <Path
              d="M12 11c-3 0-5 2.2-5 4.8 0 2.2 2 4.2 5 4.2s5-2 5-4.2c0-2.6-2-4.8-5-4.8z"
              fill={color}
              stroke="none"
            />
          </>
        );
      case 'bedtime':
        return <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} stroke={color} />;
      case 'translate':
        return (
          <>
            <Path d="m5 8 6 6m-7 0 6-6 2-3M2 5h12M7 2h1" />
            <Path d="m22 22-5-10-5 10m2-4h6" />
          </>
        );
      case 'north_west':
        return (
          <>
            <Path d="M7 17V7h10" />
            <Path d="M7 7l10 10" />
          </>
        );
      case 'bookmark':
        return (
          <Path
            d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            fill={isActuallyFilled ? color : 'none'}
            stroke={color}
          />
        );
      case 'send':
        return (
          <>
            <Path
              d="M22 2 15 22 11 13 2 9 22 2Z"
              fill={isActuallyFilled ? color : 'none'}
              stroke={color}
            />
            <Path d="M22 2 11 13" stroke={color} />
          </>
        );
      case 'star':
        return (
          <Path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={isActuallyFilled ? color : 'none'}
            stroke={color}
          />
        );
      case 'error':
        return (
          <>
            <Circle cx="12" cy="12" r="10" />
            <Line x1="12" y1="8" x2="12" y2="12" />
            <Line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        );
      case 'warning':
        return (
          <>
            <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <Line x1="12" y1="9" x2="12" y2="13" />
            <Line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        );
      case 'info':
        return (
          <>
            <Circle cx="12" cy="12" r="10" />
            <Line x1="12" y1="16" x2="12" y2="12" />
            <Line x1="12" y1="8" x2="12.01" y2="8" />
          </>
        );
      case 'person':
        return (
          <>
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
          </>
        );
      case 'account_balance':
        return (
          <>
            <Path d="M3 10V21H21V10" />
            <Path d="M2 10L12 3L22 10" />
            <Line x1="7" y1="10" x2="7" y2="17" />
            <Line x1="12" y1="10" x2="12" y2="17" />
            <Line x1="17" y1="10" x2="17" y2="17" />
            <Path d="M1 21H23" />
          </>
        );
      case 'logout':
        return (
          <>
            <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <Polyline points="16 17 21 12 16 7" />
            <Line x1="21" y1="12" x2="9" y2="12" />
          </>
        );
      case 'description':
        return (
          <>
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <Polyline points="14 2 14 8 20 8" />
            <Line x1="16" y1="13" x2="8" y2="13" />
            <Line x1="16" y1="17" x2="8" y2="17" />
            <Polyline points="10 9 9 9 8 9" />
          </>
        );
      case 'toc':
        return (
          <>
            <Line x1="9" y1="6" x2="20" y2="6" />
            <Line x1="9" y1="12" x2="20" y2="12" />
            <Line x1="9" y1="18" x2="20" y2="18" />
            <Circle cx="4" cy="6" r="1.5" fill={color} />
            <Circle cx="4" cy="12" r="1.5" fill={color} />
            <Circle cx="4" cy="18" r="1.5" fill={color} />
          </>
        );
      case 'fast_forward':
        return (
          <>
            <Path d="M13 19l9-7-9-7v14z" fill={isActuallyFilled ? color : 'none'} stroke={color} />
            <Path d="M2 19l9-7-9-7v14z" fill={isActuallyFilled ? color : 'none'} stroke={color} />
          </>
        );
      case 'fast_rewind':
        return (
          <>
            <Path d="M11 19l-9-7 9-7v14z" fill={isActuallyFilled ? color : 'none'} stroke={color} />
            <Path d="M22 19l-9-7 9-7v14z" fill={isActuallyFilled ? color : 'none'} stroke={color} />
          </>
        );
      case 'music_note':
        return (
          <>
            <Path d="M9 18V5l12-2v13" />
            <Circle cx="6" cy="18" r="3" fill={isActuallyFilled ? color : 'none'} stroke={color} />
            <Circle cx="18" cy="16" r="3" fill={isActuallyFilled ? color : 'none'} stroke={color} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={isActuallyFilled ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {renderIconContent()}
    </Svg>
  );
};
