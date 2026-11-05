import React from 'react';
import { render } from '@testing-library/react-native';
import { AddAudioSheet } from '../src/features/capture/AddAudioSheet';
import { LiveRecordingScreen } from '../src/features/capture/LiveRecordingScreen';
import { ProcessingScreen } from '../src/features/capture/ProcessingScreen';
import { lectureRepo, subjectRepo } from '../src/core/data';

// Mock SafeAreaContext inside factory using require
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style }: any) => React.createElement(View, { style }, children),
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      lectureId: 'lec-inflation',
      jobId: 'job-test-123',
      subjectId: 'subj-macro',
    },
  }),
}));

// Mock DocumentPicker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file://mock/test_audio.m4a',
        name: 'test_audio.m4a',
        size: 24500000,
        mimeType: 'audio/m4a',
      },
    ],
  }),
}));

describe('Phase 6: Audio Capture & Processing Flow Suite', () => {
  describe('Screen Components Export & Render', () => {
    it('renders AddAudioSheet with course options and capture cards', async () => {
      const screen = await render(<AddAudioSheet />);
      expect(screen.getByText('Add Lecture Audio')).toBeTruthy();
      expect(screen.getByText('Live Voice Record')).toBeTruthy();
      expect(screen.getByText('Import Audio File')).toBeTruthy();
    });

    it('renders LiveRecordingScreen with timer and controls', async () => {
      const screen = await render(<LiveRecordingScreen />);
      expect(screen.getByText('Live Recording')).toBeTruthy();
      expect(screen.getByText('Mark Star')).toBeTruthy();
    });

    it('renders ProcessingScreen with AI pipeline stepper', async () => {
      const screen = await render(<ProcessingScreen />);
      expect(screen.getByText('Processing Lecture')).toBeTruthy();
      expect(screen.getByText('PhoWhisper Speech-to-Text')).toBeTruthy();
      expect(screen.getByText('Cornell Note & Topic Chunking')).toBeTruthy();
      expect(screen.getByText('BGE-M3 Neural Embeddings')).toBeTruthy();
      expect(screen.getByText('Lecture Studio Ready')).toBeTruthy();
    });
  });

  describe('Audio Upload & Repository Pipeline Integration', () => {
    it('uploads audio file and creates a new lecture with QUEUED job status', async () => {
      const subjects = await subjectRepo.getSubjects();
      const targetSubject = subjects[0];

      const res = await lectureRepo.uploadAudio({
        title: 'Uploaded Macroeconomics Lecture 8',
        subjectId: targetSubject.id,
        uri: 'file://mock/uploads/lec8.m4a',
      });

      expect(res.lecture).toBeDefined();
      expect(res.lecture.title).toBe('Uploaded Macroeconomics Lecture 8');
      expect(res.lecture.subjectId).toBe(targetSubject.id);
      expect(res.lecture.subjectName).toBe(targetSubject.name);
      expect(res.jobId).toBeDefined();

      const jobStatus = await lectureRepo.getJobStatus(res.jobId);
      expect(jobStatus).toBeDefined();
      expect(jobStatus.status).toBeDefined();
      expect(jobStatus.progress).toBeGreaterThanOrEqual(0.1);
    });

    it('creates and records lecture highlights for starred moments during live recording', async () => {
      const highlight = await lectureRepo.createHighlight(
        'lec-inflation',
        'Crucial concept: The Fisher equation relates nominal and real interest rates',
        980
      );

      expect(highlight).toBeDefined();
      expect(highlight.lectureId).toBe('lec-inflation');
      expect(highlight.quote).toContain('Fisher equation');
      expect(highlight.atSec).toBe(980);
      expect(highlight.atFormatted).toBe('16:20');

      const allHighlights = await lectureRepo.getHighlights('lec-inflation');
      expect(allHighlights.some((h) => h.id === highlight.id)).toBe(true);
    });
  });
});
