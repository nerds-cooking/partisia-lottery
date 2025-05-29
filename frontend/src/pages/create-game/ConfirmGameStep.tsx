import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGameStep1Form } from "./CreateGameStep1";
import { CreateGameStep2Form } from "./CreateGameStep2";

interface ConfirmGameStepProps {
  values: CreateGameStep1Form & CreateGameStep2Form;
  onConfirm: () => void;
  onBack: () => void;
}

export function ConfirmGameStep({
  values,
  onConfirm,
  onBack,
}: ConfirmGameStepProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle>3. Confirm Game Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-lg shadow-sm bg-white/20">
            <p className="text-sm font-semibold text-gray-900">Game ID</p>
            <p className="text-sm text-gray-900">{values.gameId}</p>
          </div>
          <div className="p-4 rounded-lg shadow-sm bg-white/20">
            <p className="text-sm font-semibold text-gray-900">Title</p>
            <p className="text-sm text-gray-900">{values.title}</p>
          </div>
          <div className="p-4 rounded-lg shadow-sm bg-white/20">
            <p className="text-sm font-semibold text-gray-900">Description</p>
            <p className="text-sm text-gray-900">{values.description}</p>
          </div>
          <div className="p-4 rounded-lg shadow-sm bg-white/20">
            <p className="text-sm font-semibold text-gray-900">Category</p>
            <p className="text-sm text-gray-900">{values.category}</p>
          </div>
          <div className="p-4 rounded-lg shadow-sm bg-white/20">
            <p className="text-sm font-semibold text-gray-900">Deadline</p>
            <p className="text-sm text-gray-900">
              {values.deadline.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-l font-semibold mb-4 text-green-300">
            Questions Summary
          </p>
          <div className="space-y-3">
            {values.questions.map((q, index) => (
              <div key={index} className="p-4 rounded-lg shadow-sm bg-white/20">
                <p className="text-sm text-black font-bold mb-2">
                  Question {index + 1}
                </p>
                <p className="text-sm mb-2">{q.question}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt, i) => (
                    <span
                      key={i}
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-center ${
                        i === q.correctAnswer
                          ? "bg-lime-300 text-black"
                          : "bg-gray-900/60 text-white"
                      }`}
                    >
                      {opt || "—"}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-medium"
          >
            Confirm & Create Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
