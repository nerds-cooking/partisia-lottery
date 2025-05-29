export interface CreateGamePayload {
  gameId: string;
  name: string;
  description: string;
  category: string;
  questions: Array<{
    question: string;
    answers: Array<{
      answer: string;
    }>;
  }>;
  deadline: Date;
  creationTxn: string;
}
