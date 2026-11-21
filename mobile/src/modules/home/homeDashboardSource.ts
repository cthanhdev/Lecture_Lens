import type { HomeDashboardSnapshot } from './types.ts'

export interface HomeDashboardSource {
  load(): Promise<HomeDashboardSnapshot>
}

export const DEFAULT_HOME_SNAPSHOT: HomeDashboardSnapshot = {
  userFirstName: 'Minh',
  continueListening: {
    lecture: {
      id: 'macro-7',
      title: 'Lecture 7: Inflation & Monetary Policy',
      subject: 'Macroeconomics',
      subjectTone: 'mist',
      durationSec: 2900, // 48:20
      status: 'ready',
      isDownloaded: true,
    },
    positionSec: 1798, // 29:58
    playbackRate: 1.25,
  },
  dueToday: {
    dueCount: 34,
    reviewedCount: 12,
  },
  streak: {
    days: 12,
    percentileLabel: 'Top 5% consistency',
    offlineCaption: 'Daily streak active',
    weekOnline: [
      { key: 'mon', label: 'M', state: 'done' },
      { key: 'tue', label: 'T', state: 'done' },
      { key: 'wed', label: 'W', state: 'done' },
      { key: 'thu', label: 'T', state: 'done' },
      { key: 'fri', label: 'F', state: 'today' },
      { key: 'sat', label: 'S', state: 'upcoming' },
      { key: 'sun', label: 'S', state: 'upcoming' },
    ],
    weekOffline: [
      { key: 'mon', label: 'M', state: 'done' },
      { key: 'tue', label: 'T', state: 'done' },
      { key: 'wed', label: 'W', state: 'done' },
      { key: 'thu', label: 'T', state: 'today' },
      { key: 'fri', label: 'F', state: 'upcoming' },
      { key: 'sat', label: 'S', state: 'upcoming' },
      { key: 'sun', label: 'S', state: 'upcoming' },
    ],
  },
  highlights: [
    {
      id: 'hl-1',
      lectureId: 'macro-7',
      quote:
        '\u201CCost-push inflation comes from rising production costs, not demand.\u201D',
      subject: 'Macroeconomics',
      subjectTone: 'mist',
      timestampSec: 761, // 12:41
    },
    {
      id: 'hl-2',
      lectureId: 'econ-201',
      quote:
        '\u201CThe Keynesian multiplier increases proportionally with MPC.\u201D',
      subject: 'Econ 201',
      subjectTone: 'matcha',
      timestampSec: 1695, // 28:15
    },
    {
      id: 'hl-3',
      lectureId: 'macro-7',
      quote:
        '\u201CCentral banks raise rates to compress aggregate spending cycles.\u201D',
      subject: 'Macroeconomics',
      subjectTone: 'sakura',
      timestampSec: 2390, // 39:50
    },
  ],
  recentlyAdded: [
    {
      id: 'macro-part-2',
      title: 'Macroeconomics Part 2',
      subject: 'Macroeconomics',
      subjectTone: 'mist',
      durationSec: 2880, // 48 min
      status: 'ready',
      isDownloaded: false,
    },
    {
      id: 'org-chem-4',
      title: 'Organic Chem Lab 4',
      subject: 'Organic Chemistry',
      subjectTone: 'sakura',
      durationSec: 1920, // 32 min
      status: 'transcribing',
      transcribeProgress: 45,
      jobId: 'job-chem-4',
      isDownloaded: false,
    },
    {
      id: 'psych-101',
      title: 'Psychology 101',
      subject: 'Psychology',
      subjectTone: 'matcha',
      durationSec: 3300, // 55 min
      status: 'ready',
      isDownloaded: false,
    },
  ],
  localRecordings: [
    {
      id: 'local-lecture-8',
      title: 'Lecture 8',
      subject: 'Macroeconomics',
      subjectTone: 'mist',
      durationSec: 0,
      status: 'ready',
      isDownloaded: true,
      isDeviceOnly: true,
    },
    {
      id: 'cell-membrane',
      title: 'Cell Membrane Transport',
      subject: 'Biology',
      subjectTone: 'matcha',
      durationSec: 2200, // 36:40
      status: 'ready',
      isDownloaded: true,
      isDeviceOnly: false,
    },
  ],
}

export class MockHomeDashboardSource implements HomeDashboardSource {
  private readonly snapshot: HomeDashboardSnapshot

  constructor(snapshot: HomeDashboardSnapshot = DEFAULT_HOME_SNAPSHOT) {
    this.snapshot = snapshot
  }

  async load(): Promise<HomeDashboardSnapshot> {
    return this.snapshot
  }
}
