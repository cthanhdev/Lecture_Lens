import { StudyRepository } from '../repositories';
import {
  Deck,
  Flashcard,
  StudyStats,
  FlashcardGrade,
} from '../../domain/types';
import {
  mockDecks,
  mockFlashcards,
  mockStudyStats,
} from '../../mock/fixtures';

const delay = (ms = 200) => new Promise((res) => setTimeout(res, ms));

export class MockStudyRepository implements StudyRepository {
  private decks: Deck[] = [...mockDecks];
  private cards: Flashcard[] = [...mockFlashcards];
  private stats: StudyStats = { ...mockStudyStats };

  async getDecks(): Promise<Deck[]> {
    await delay();
    return [...this.decks];
  }

  async getDeckById(id: string): Promise<Deck | null> {
    await delay();
    return this.decks.find((d) => d.id === id) || null;
  }

  async getStudyStats(): Promise<StudyStats> {
    await delay();
    return { ...this.stats };
  }

  async getFlashcards(deckId?: string): Promise<Flashcard[]> {
    await delay();
    if (deckId) {
      return this.cards.filter((c) => c.deckId === deckId);
    }
    return [...this.cards];
  }

  async recordCardReview(cardId: string, grade: FlashcardGrade): Promise<void> {
    await delay(150);
    const card = this.cards.find((c) => c.id === cardId);
    if (!card) return;

    // Simulate spaced repetition updates
    if (grade === 'GOOD' || grade === 'EASY') {
      card.intervalDays = (card.intervalDays || 1) * (grade === 'EASY' ? 2.5 : 2);
      card.dueToday = false;
      this.stats.retainedCount += 1;
      if (this.stats.toLearnCount > 0) this.stats.toLearnCount -= 1;
    } else {
      card.intervalDays = 1;
      this.stats.inProgressCount += 1;
    }

    this.stats.reviewedCardsCount += 1;
    if (this.stats.cardsDueToday > 0) {
      this.stats.cardsDueToday -= 1;
    }

    // Update deck mastery
    const deck = this.decks.find((d) => d.id === card.deckId);
    if (deck && deck.dueCount > 0) {
      deck.dueCount -= 1;
      deck.masteryPercentage = Math.min(100, deck.masteryPercentage + 2);
    }
  }
}
