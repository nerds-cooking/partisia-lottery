import { Button } from "@/components/ui/button";

export interface QuestionViewProps {
  question: {
    question: string;
    answers: Array<{
      answer: string;
    }>;
  };
  index: number;
  setAnswers: React.Dispatch<React.SetStateAction<number[]>>;
  answers: number[];
}

export function QuestionView({
  question,
  index,
  setAnswers,
  answers,
}: QuestionViewProps) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-4 text-green-300">
        {question.question}
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {question.answers.map((answer, idx) => (
          <Button
            key={idx}
            // className="w-full"
            className={`w-full border-none hover:bg-violet-700/20 ${
              answers[index] === idx ? "bg-violet-700" : "bg-gray-200"
            }`}
            variant={answers[index] === idx ? "default" : "outline"}
            onClick={() => {
              setAnswers((prev) => {
                const newAnswers = [...prev];
                newAnswers[index] = idx;
                return newAnswers;
              });
            }}
          >
            {answer.answer}
          </Button>
        ))}
      </div>
    </div>
  );
}
