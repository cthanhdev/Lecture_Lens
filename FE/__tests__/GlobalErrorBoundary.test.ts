import React from 'react';
import { GlobalErrorBoundary } from '../src/core/components/GlobalErrorBoundary';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('View', props, props.children),
    Text: (props: any) => React.createElement('Text', props, props.children),
    TouchableOpacity: (props: any) => React.createElement('TouchableOpacity', props, props.children),
    StyleSheet: {
      create: (styles: any) => styles,
    },
  };
});

jest.mock('../src/shared/widgets/mascot/CuMeoWidget', () => {
  const React = require('react');
  return {
    CuMeoWidget: (props: any) => React.createElement('CuMeoWidget', props),
  };
});

describe('GlobalErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    const boundary = new GlobalErrorBoundary({
      children: React.createElement('Text', null, 'Content normal'),
    });

    const rendered = boundary.render();
    expect(rendered).toBeDefined();
    expect((rendered as any).props.children).toBe('Content normal');
  });

  it('updates state to hasError: true on getDerivedStateFromError', () => {
    const error = new Error('Test crash in child component');
    const newState = GlobalErrorBoundary.getDerivedStateFromError(error);

    expect(newState).toEqual({
      hasError: true,
      error,
    });
  });

  it('logs the unhandled error in componentDidCatch', () => {
    const boundary = new GlobalErrorBoundary({
      children: React.createElement('Text', null, 'Test'),
    });

    const testError = new Error('Fatal UI Exception');
    const testErrorInfo = { componentStack: 'at ChildComponent\n at App' };

    boundary.componentDidCatch(testError, testErrorInfo as any);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Unhandled UI Crash:',
      testError,
      testErrorInfo
    );
  });

  it('renders fallback error UI with confused mascot and retry button when hasError is true', () => {
    const boundary = new GlobalErrorBoundary({
      children: React.createElement('Text', null, 'Will not render'),
    });
    boundary.state = { hasError: true, error: new Error('Render crash') };

    const rendered = boundary.render() as any;

    expect(rendered.type.name).toBe('View');
    expect(rendered.props.style).toBeDefined();

    // Children of error view: CuMeoWidget, Title, Desc, RetryBtn
    const children = React.Children.toArray(rendered.props.children) as any[];
    expect(children.length).toBe(4);

    // 1st child: CuMeoWidget
    expect(children[0].type.name).toBe('CuMeoWidget');
    expect(children[0].props.variant).toBe('confused');
    expect(children[0].props.size).toBe(120);

    // 2nd child: Title
    expect(children[1].type.name).toBe('Text');
    expect(children[1].props.children).toBe('Cú Mèo gặp chút trục trặc!');

    // 3rd child: Description
    expect(children[2].type.name).toBe('Text');
    expect(children[2].props.children).toBe('Đã có lỗi nhỏ xảy ra khi dựng giao diện bàn học.');

    // 4th child: Retry TouchableOpacity
    expect(children[3].type.name).toBe('TouchableOpacity');
    expect(typeof children[3].props.onPress).toBe('function');
  });

  it('resets error state when handleReset is triggered', () => {
    const boundary = new GlobalErrorBoundary({
      children: React.createElement('Text', null, 'Restored content'),
    });
    boundary.state = { hasError: true, error: new Error('Crash') };

    let stateUpdated: any = null;
    boundary.setState = jest.fn((updater: any) => {
      stateUpdated = typeof updater === 'function' ? updater(boundary.state) : updater;
      boundary.state = { ...boundary.state, ...stateUpdated };
    });

    boundary.handleReset();

    expect(boundary.setState).toHaveBeenCalled();
    expect(stateUpdated).toEqual({ hasError: false, error: undefined });
  });
});
