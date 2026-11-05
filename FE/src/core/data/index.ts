import {
  mockLectureRepo,
  mockStudyRepo,
  mockSubjectRepo,
  mockAuthRepo,
} from './mock';

export * from './repositories';
export * from './mock';

export const lectureRepo = mockLectureRepo;
export const studyRepo = mockStudyRepo;
export const subjectRepo = mockSubjectRepo;
export const authRepo = mockAuthRepo;
