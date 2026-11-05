import {
  lectureRepo,
  studyRepo,
  subjectRepo,
  authRepo,
} from '../src/core/data';

describe('100% Mock Repositories Verification Suite', () => {
  describe('LectureRepository', () => {
    it('fetches lectures list and supports filtering', async () => {
      const all = await lectureRepo.getLectures();
      expect(all.length).toBeGreaterThan(3);

      const macroLectures = await lectureRepo.getLectures({ subjectId: 'subj-macro' });
      expect(macroLectures.every((l) => l.subjectId === 'subj-macro')).toBe(true);

      const searchResults = await lectureRepo.getLectures({ search: 'inflation' });
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].title).toContain('Inflation');
    });

    it('retrieves active continue listening lecture (Lecture 7)', async () => {
      const active = await lectureRepo.getContinueListening();
      expect(active).not.toBeNull();
      expect(active?.title).toContain('Lecture 7');
      expect(active?.currentPlaybackSec).toBe(1798);
    });

    it('retrieves detailed summary matching Figma specifications', async () => {
      const summary = await lectureRepo.getSummary('lec-7');
      expect(summary.keyIdeas.length).toBe(4);
      expect(summary.keywords.some((k) => k.term === 'inflation')).toBe(true);
      expect(summary.definitions.some((d) => d.term === 'Cost-Push Inflation')).toBe(true);
      expect(summary.examQuestions.length).toBe(3);
    });

    it('simulates audio upload and returns tracking job ID', async () => {
      const upload = await lectureRepo.uploadAudio({
        title: 'Uploaded Test Session',
        subjectId: 'subj-macro',
        uri: 'file:///path/to/test.mp3',
      });

      expect(upload.lecture.id).toBeDefined();
      expect(upload.jobId).toBeDefined();
      expect(upload.lecture.status).toBe('QUEUED');

      const job1 = await lectureRepo.getJobStatus(upload.jobId);
      expect(job1.status).toBe('PROCESSING_STT');

      const job2 = await lectureRepo.getJobStatus(upload.jobId);
      expect(job2.status).toBe('CHUNKING');
    });

    it('answers student query via simulated neural RAG with citations', async () => {
      const res = await lectureRepo.askQuestion('lec-7', 'Lạm phát chi phí đẩy là gì?');
      expect(res.answer).toBeDefined();
      expect(res.citations.length).toBeGreaterThan(0);
      expect(res.citations[0].startTime).toBe('12:41');
    });
  });

  describe('StudyRepository', () => {
    it('fetches decks and study statistics', async () => {
      const decks = await studyRepo.getDecks();
      expect(decks.length).toBe(4);
      expect(decks[0].title).toBe('Macroeconomics Core');

      const stats = await studyRepo.getStudyStats();
      expect(stats.cardsDueToday).toBe(34);
      expect(stats.streakDays).toBe(12);
    });

    it('records flashcard review and updates mastery', async () => {
      const cards = await studyRepo.getFlashcards('deck-macro');
      expect(cards.length).toBeGreaterThan(0);

      const targetCard = cards[0];
      await studyRepo.recordCardReview(targetCard.id, 'GOOD');

      const updatedStats = await studyRepo.getStudyStats();
      expect(updatedStats.reviewedCardsCount).toBeGreaterThan(12);
    });
  });

  describe('SubjectRepository', () => {
    it('returns subjects list matching academic curriculum', async () => {
      const subjects = await subjectRepo.getSubjects();
      expect(subjects.length).toBe(4);
      expect(subjects.find((s) => s.code === 'ECON 201')).toBeDefined();
    });
  });

  describe('AuthRepository', () => {
    it('logs in student and issues session token', async () => {
      const res = await authRepo.login('minh@lecturelens.edu.vn', 'secret123');
      expect(res.user.email).toBe('minh@lecturelens.edu.vn');
      expect(res.token).toBeDefined();

      const guest = await authRepo.loginAsGuest();
      expect(guest.user.role).toBe('STUDENT');
      expect(guest.user.fullName).toBe('Student Guest');
    });
  });
});
