import { Game } from "@/components/providers/game/useGame";

export interface AnswersSummaryProps {
  game: Game;
  answers: number[];
}

export function AnswersSummary({ game, answers }: AnswersSummaryProps) {
  return (
    <div className="mb-6">
      <h2 className="text-l font-semibold mb-4 text-green-300">Summary</h2>
      <div className="space-y-3">
        {game.questions.map((question, index) => (
          <div key={index} className="p-4 rounded-lg shadow-sm bg-white/20">
            <p className="text-sm text-black font-bold mb-2">
              Question {index + 1}
            </p>
            <p className="font-medium">{question.question}</p>
            <div className="mt-2">
              <span className="inline-block bg-white/20 text-black text-xs font-semibold px-3 py-1 rounded-full">
                {question.answers[answers[index]]?.answer ?? "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
