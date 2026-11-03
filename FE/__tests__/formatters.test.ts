import { formatDuration, formatRelativeTime } from '../src/core/utils/formatters';

describe('formatDuration', () => {
  it('formats seconds into mm:ss when under one hour', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(45)).toBe('00:45');
    expect(formatDuration(125)).toBe('02:05');
    expect(formatDuration(599)).toBe('09:59');
  });

  it('formats seconds into hh:mm:ss when one hour or more', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3665)).toBe('1:01:05');
    expect(formatDuration(5640)).toBe('1:34:00');
    expect(formatDuration(7325)).toBe('2:02:05');
  });

  it('handles negative input gracefully', () => {
    expect(formatDuration(-10)).toBe('00:00');
  });

  it('handles NaN, non-number and Infinity gracefully', () => {
    expect(formatDuration(NaN)).toBe('00:00');
    expect(formatDuration(undefined as unknown as number)).toBe('00:00');
    expect(formatDuration(Infinity)).toBe('00:00');
    expect(formatDuration(-Infinity)).toBe('00:00');
  });

  it('floors float inputs before formatting', () => {
    expect(formatDuration(65.8)).toBe('01:05');
    expect(formatDuration(3665.4)).toBe('1:01:05');
  });
});

describe('formatRelativeTime', () => {
  it('returns "Vừa xong" for times under 1 minute or future times', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('Vừa xong');
    const future = new Date(Date.now() + 60 * 1000);
    expect(formatRelativeTime(future)).toBe('Vừa xong');
  });

  it('returns minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 phút trước');
  });

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 giờ trước');
  });

  it('returns "Hôm qua" for 1 day ago', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(formatRelativeTime(yesterday)).toBe('Hôm qua');
  });

  it('returns "X ngày trước" for less than 7 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 ngày trước');
  });

  it('handles invalid dates or non-date gracefully', () => {
    expect(formatRelativeTime(new Date('invalid'))).toBe('Vừa xong');
    expect(formatRelativeTime(null as unknown as Date)).toBe('Vừa xong');
    expect(formatRelativeTime(undefined as unknown as Date)).toBe('Vừa xong');
  });
});
