import { Quiz, QuizQuestion } from '../types';
import { store } from './store';

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
      maxScore: quiz.maxScore || 20,
      timeLimitMinutes: quiz.timeLimitMinutes || 15,
      maxAttempts: quiz.maxAttempts || 3,
      isActive: true,
    };
    return store.addQuiz(newQuiz);
  }

  public updateQuiz(id: string, updates: Partial<Quiz>): Quiz {
    return store.updateQuiz(id, updates);
  }

  public deleteQuiz(id: string): void {
    store.deleteQuiz(id);
  }

  public calculateScore(questions: QuizQuestion[], userAnswers: number[]): { score: number; passed: boolean; maxScore: number } {
    let earned = 0;
    const maxScore = questions.reduce((acc, q) => acc + (q.points || 1), 0);

    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        earned += q.points || 1;
      }
    });

    const percentage = Math.round((earned / (maxScore || 1)) * 100);
    const passed = earned >= (questions.length > 0 ? Math.round(maxScore * 0.8) : 16);

    return { score: earned, passed, maxScore };
  }
}

export const quizService = new QuizService();
