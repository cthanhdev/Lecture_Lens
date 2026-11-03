import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CuMeoWidget } from '../../shared/widgets/mascot/CuMeoWidget';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI Crash:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <CuMeoWidget variant="confused" size={120} isAnimated={false} />
          <Text style={styles.title}>Cú Mèo gặp chút trục trặc!</Text>
          <Text style={styles.desc}>
            Đã có lỗi nhỏ xảy ra khi dựng giao diện bàn học.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={this.handleReset}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Khởi động lại bàn học</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFAF5',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1831',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#7D7893',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#5445B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
