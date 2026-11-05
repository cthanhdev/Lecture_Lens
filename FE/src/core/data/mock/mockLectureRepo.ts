import { LectureRepository } from '../repositories';
import {
  Lecture,
  Highlight,
  TranscriptSegment,
  LectureSummary,
  JobStatus,
  AskAnswer,
} from '../../domain/types';
import {
  mockLectures,
  mockHighlights,
  mockSummaryLecture7,
  mockTranscriptLecture7,
  mockSubjects,
} from '../../mock/fixtures';

const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms));

export class MockLectureRepository implements LectureRepository {
  private lectures: Lecture[] = [...mockLectures];
  private highlights: Highlight[] = [...mockHighlights];
  private jobProgress: Map<string, { status: JobStatus; progress: number }> = new Map();

  async getLectures(params?: { subjectId?: string; search?: string }): Promise<Lecture[]> {
    await delay();
    let result = [...this.lectures];

    if (params?.subjectId) {
      result = result.filter((l) => l.subjectId === params.subjectId);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.chapterTitle?.toLowerCase().includes(q) ||
          l.subjectName.toLowerCase().includes(q)
      );
    }

    return result;
  }

  async getLectureById(id: string): Promise<Lecture | null> {
    await delay();
    return this.lectures.find((l) => l.id === id) || null;
  }

  async getContinueListening(): Promise<Lecture | null> {
    await delay();
    // Default to lecture-7 with active current playback
    return (
      this.lectures.find(
        (l) => l.status === 'READY' && l.currentPlaybackSec && l.currentPlaybackSec > 0
      ) || this.lectures[0] || null
    );
  }

  async getSummary(lectureId: string): Promise<LectureSummary> {
    await delay();
    if (lectureId === 'lec-7' || !lectureId) {
      return mockSummaryLecture7;
    }
    // Return generated summary for other lectures
    const target = this.lectures.find((l) => l.id === lectureId);
    return {
      lectureId,
      keyIdeas: [
        `Core principles and theoretical framework of ${target?.title || 'the lecture'}.`,
        'Fundamental equations and systematic relationships presented in the session.',
        'Primary historical precedents and macroeconomic/empirical validations.',
        'Practical implications for upcoming problem sets and exams.',
      ],
      keywords: [
        { id: 'kw-gen-1', term: target?.subjectName.toLowerCase() || 'theory', count: 18 },
        { id: 'kw-gen-2', term: 'framework', count: 12 },
        { id: 'kw-gen-3', term: 'analysis', count: 7 },
      ],
      definitions: [
        {
          id: 'def-gen-1',
          term: 'Fundamental Equilibrium',
          body: 'The stationary state where aggregate forces balance out with no pressure to adjust.',
          atSec: 420,
          atFormatted: '07:00',
        },
      ],
      examQuestions: [
        {
          id: 'eq-gen-1',
          question: `Derive the main conclusion presented in ${target?.title || 'this session'}.`,
          tag: 'Conceptual focus',
          points: 10,
        },
      ],
    };
  }

  async getHighlights(lectureId?: string): Promise<Highlight[]> {
    await delay();
    if (lectureId) {
      return this.highlights.filter((h) => h.lectureId === lectureId);
    }
    return [...this.highlights];
  }

  async getTranscript(lectureId: string): Promise<TranscriptSegment[]> {
    await delay();
    return mockTranscriptLecture7;
  }

  async uploadAudio(input: {
    title: string;
    subjectId: string;
    uri: string;
  }): Promise<{ lecture: Lecture; jobId: string }> {
    await delay(400);
    const subject = mockSubjects.find((s) => s.id === input.subjectId) || mockSubjects[0];
    const newId = `lec-${Date.now()}`;
    const jobId = `job-${Date.now()}`;

    const newLecture: Lecture = {
      id: newId,
      title: input.title,
      chapterTitle: 'Uploaded Lecture Audio',
      subjectId: subject.id,
      subjectName: subject.name,
      subjectKey: subject.colorKey,
      durationSec: 1800, // Simulated 30 mins
      createdAt: new Date().toISOString(),
      dateFormatted: 'Today',
      status: 'QUEUED',
      progress: 0.1,
      audioUri: input.uri,
      fileSizeFormatted: '28.4 MB',
    };

    this.lectures.unshift(newLecture);
    this.jobProgress.set(jobId, { status: 'QUEUED', progress: 0.1 });

    return { lecture: newLecture, jobId };
  }

  async getJobStatus(jobId: string): Promise<{ status: JobStatus; progress: number }> {
    await delay(200);
    const current = this.jobProgress.get(jobId) || { status: 'QUEUED', progress: 0.1 };

    // Advance state machine simulation
    let nextStatus = current.status;
    let nextProgress = current.progress + 0.25;

    if (current.status === 'QUEUED') {
      nextStatus = 'PROCESSING_STT';
      nextProgress = 0.35;
    } else if (current.status === 'PROCESSING_STT') {
      nextStatus = 'CHUNKING';
      nextProgress = 0.65;
    } else if (current.status === 'CHUNKING') {
      nextStatus = 'EMBEDDING';
      nextProgress = 0.85;
    } else if (current.status === 'EMBEDDING') {
      nextStatus = 'READY';
      nextProgress = 1.0;
    }

    const updated = { status: nextStatus, progress: Math.min(nextProgress, 1.0) };
    this.jobProgress.set(jobId, updated);
    return updated;
  }

  async askQuestion(lectureId: string, query: string): Promise<AskAnswer> {
    await delay(600);
    return {
      answer: `Theo bài giảng (giây [12:41] và [15:20]), ${query.toLowerCase().includes('lạm phát') || query.toLowerCase().includes('inflation') ? 'lạm phát chi phí đẩy phát sinh do sự sụt giảm tổng cung vì giá các yếu tố đầu vào tăng cao (như chi phí năng lượng hoặc lương), làm dịch chuyển đường cung ngắn hạn lên trên.' : 'khái niệm này được giảng viên định nghĩa dựa trên nguyên lý cân bằng cung cầu và cơ chế truyền dẫn chính sách tiền tệ qua lãi suất danh nghĩa.'}`,
      citations: [
        {
          chunkId: 'chunk-1',
          startTime: '12:41',
          endTime: '14:05',
          textSnippet: 'Cost-push inflation comes from rising production costs, not excessive consumer demand. When energy supply contracts, input costs cascade into all downstream retail goods.',
        },
        {
          chunkId: 'chunk-2',
          startTime: '15:20',
          endTime: '16:40',
          textSnippet: 'When central banks raise policy interest rates, the transmission mechanism dampens capital expenditures and anchors price expectations.',
        },
      ],
    };
  }

  async createHighlight(lectureId: string, quote: string, atSec: number): Promise<Highlight> {
    await delay(200);
    const lecture = this.lectures.find((l) => l.id === lectureId) || this.lectures[0];
    const minutes = Math.floor(atSec / 60);
    const seconds = atSec % 60;
    const atFormatted = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    const newHighlight: Highlight = {
      id: `hl-${Date.now()}`,
      lectureId,
      subjectId: lecture.subjectId,
      subjectName: lecture.subjectName,
      subjectKey: lecture.subjectKey,
      quote,
      atSec,
      atFormatted,
      isBookmarked: true,
    };

    this.highlights.unshift(newHighlight);
    return newHighlight;
  }
}
