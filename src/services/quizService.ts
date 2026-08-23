import { Quiz, QuizQuestion } from '../types';
import { store } from './store';
import { firebaseSyncService } from './firebaseSyncService';

class QuizService {
  public getQuizzes(): Quiz[] {
    return store.getQuizzes();
  }

  public getQuizById(id: string): Quiz | undefined {
    return store.getQuiz(id);
  }

  public addQuiz(quiz: Omit<Quiz, 'id'>): Quiz {
    const newQuiz: Quiz = {
      ...quiz,
      id: `quiz-${Date.now()}`,
      minScore: quiz.minScore || 16,
      maxScore: (quiz as any).maxScore || 20,
      timeLimitMinutes: (quiz as any).timeLimitMinutes || 15,
      maxAttempts: quiz.maxAttempts || 3,
      isActive: true,
    } as Quiz;

    store.addQuiz(newQuiz);
    firebaseSyncService.saveQuiz(newQuiz).catch((err) =>
      console.error('[QuizService] Firebase saveQuiz failed:', err)
    );
    return newQuiz;
  }

  public updateQuiz(id: string, updates: Partial<Quiz>): Quiz {
    const updated = store.updateQuiz(id, updates);
    firebaseSyncService.saveQuiz(updated).catch((err) =>
      console.error('[QuizService] Firebase saveQuiz failed:', err)
    );
    return updated;
  }

  public deleteQuiz(id: string): void {
    store.deleteQuiz(id);
    firebaseSyncService.deleteQuiz(id).catch((err) =>
      console.error('[QuizService] Firebase deleteQuiz failed:', err)
    );
  }

  public calculateScore(questions: QuizQuestion[], userAnswers: number[]) {
    let earned = 0;
    const maxScore = questions.reduce((acc, q) => acc + ((q as any).points || 1), 0);
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) earned += (q as any).points || 1;
    });
    const passed = earned >= (questions.length > 0 ? Math.round(maxScore * 0.8) : 16);
    return { score: earned, passed, maxScore };
  }
}

export const quizService = new QuizService();
