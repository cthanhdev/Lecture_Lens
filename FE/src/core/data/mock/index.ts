import { MockLectureRepository } from './mockLectureRepo';
import { MockStudyRepository } from './mockStudyRepo';
import { MockSubjectRepository } from './mockSubjectRepo';
import { MockAuthRepository } from './mockAuthRepo';

export const mockLectureRepo = new MockLectureRepository();
export const mockStudyRepo = new MockStudyRepository();
export const mockSubjectRepo = new MockSubjectRepository();
export const mockAuthRepo = new MockAuthRepository();

export {
  MockLectureRepository,
  MockStudyRepository,
  MockSubjectRepository,
  MockAuthRepository,
};
