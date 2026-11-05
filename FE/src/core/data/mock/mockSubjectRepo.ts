import { SubjectRepository } from '../repositories';
import { Subject } from '../../domain/types';
import { mockSubjects } from '../../mock/fixtures';

const delay = (ms = 150) => new Promise((res) => setTimeout(res, ms));

export class MockSubjectRepository implements SubjectRepository {
  private subjects: Subject[] = [...mockSubjects];

  async getSubjects(): Promise<Subject[]> {
    await delay();
    return [...this.subjects];
  }

  async getSubjectById(id: string): Promise<Subject | null> {
    await delay();
    return this.subjects.find((s) => s.id === id) || null;
  }
}
