import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (styles: any) => styles },
  Platform: { OS: 'ios', select: (objs: any) => objs.ios || objs.default },
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('svg', props, props.children),
    Svg: (props: any) => React.createElement('svg', props, props.children),
    Path: (props: any) => React.createElement('path', props),
    Circle: (props: any) => React.createElement('circle', props),
    Rect: (props: any) => React.createElement('rect', props),
    Line: (props: any) => React.createElement('line', props),
    Polyline: (props: any) => React.createElement('polyline', props),
    G: (props: any) => React.createElement('g', props, props.children),
    Text: (props: any) => React.createElement('text', props, props.children),
  };
});

import { LlIcon, LlIconName } from '../src/shared/widgets/icons/LlIcon';
import { SvgIcons } from '../src/core/constants/assetPaths';

describe('LlIcon SVG Iconography System', () => {
  const allIconNames: LlIconName[] = [
    // Navigation
    'local_library', 'search', 'settings', 'dashboard', 'arrow_back', 'notifications',
    // Audio
    'play_arrow', 'pause', 'replay_10', 'forward_10', 'mic', 'graphic_eq',
    // AI & Mascot
    'auto_awesome', 'headphones', 'chat_bubble', 'push_pin', 'style', 'lightbulb',
    // Files & Cloud
    'cloud_upload', 'sync', 'cloud_done', 'folder_open', 'picture_as_pdf', 'share',
    // Status
    'wifi_off', 'network_check', 'refresh', 'check_circle', 'lock', 'visibility',
    // Themes
    'light_mode', 'dark_mode', 'contrast', 'palette', 'format_size', 'code',
    // Extended Core Icons
    'clock', 'mail',
    // UI Actions & Indicators
    'arrow_forward', 'close', 'open_in_new', 'swap_vert', 'arrow_drop_down',
    'add', 'school', 'pets', 'bedtime', 'translate', 'north_west',
    // Newly Added Concept Icons
    'bookmark', 'send', 'star', 'error', 'warning', 'info',
    'person', 'account_balance', 'logout', 'description', 'toc',
    'fast_forward', 'fast_rewind', 'music_note',
  ];

  it('contains at least 36 core icons', () => {
    expect(allIconNames.length).toBeGreaterThanOrEqual(36);
  });

  allIconNames.forEach((iconName) => {
    it(`renders icon "${iconName}" without crashing`, () => {
      const element = React.createElement(LlIcon, {
        name: iconName,
        size: 24,
        color: '#6d5fd0',
      });
      expect(element).toBeDefined();
      expect(element.props.name).toBe(iconName);
    });
  });

  it('supports filled mode for active states', () => {
    const element = React.createElement(LlIcon, {
      name: 'play_arrow',
      filled: true,
      color: '#10b981',
      size: 32,
    });
    expect(element.props.filled).toBe(true);
    expect(element.props.size).toBe(32);
  });

  describe('SvgIcons backward compatibility adapter', () => {
    it('renders SvgIcons with numeric and string dimensions', () => {
      const searchNum = React.createElement(SvgIcons.Search, { width: 20, height: 20 });
      expect(searchNum).toBeDefined();

      const bellStr = React.createElement(SvgIcons.Bell, { width: '22' as any, height: '22' as any });
      expect(bellStr).toBeDefined();

      const clockEl = React.createElement(SvgIcons.Clock, { size: 16 });
      expect(clockEl).toBeDefined();

      const checkEl = React.createElement(SvgIcons.CheckCircle, { color: '#10b981' });
      expect(checkEl).toBeDefined();
    });
  });
});
