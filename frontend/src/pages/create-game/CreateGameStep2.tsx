import { SortableItem } from "@/components/misc/sortable-item";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  CircleAlert,
  CircleCheckIcon,
  CircleIcon,
  GripIcon,
  PlusCircle,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export interface CreateGameStep2Form {
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export interface CreateGameStep2Props {
  defaultValues: CreateGameStep2Form;
  onSubmit: (data: CreateGameStep2Form) => void;
  handlePreviousStep: (data: CreateGameStep2Form) => void;
}

export function CreateGameStep2({
  defaultValues,
  onSubmit,
  handlePreviousStep,
}: CreateGameStep2Props) {
  const { register, handleSubmit, setValue, getValues, watch } =
    useForm<CreateGameStep2Form>({
      defaultValues,
      mode: "onBlur",
    });

  const questions = watch("questions");

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) =>
    setActiveId(event.active.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex(
      (_, i) => `question-${i}` === active.id
    );
    const newIndex = questions.findIndex((_, i) => `question-${i}` === over.id);
    const reordered = arrayMove(questions, oldIndex, newIndex);
    setValue("questions", reordered);

    if (openAccordion) {
      const previousIndex = questions.findIndex(
        (_, index) => `question-${index}` === openAccordion
      );
      const newOpenAccordion = `question-${
        arrayMove(
          questions.map((_, index) => index),
          oldIndex,
          newIndex
        )[previousIndex]
      }`;
      setOpenAccordion(newOpenAccordion);
    }
  };

  const handleOptionDragEnd = (questionIndex: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const options = [...questions[questionIndex].options];
    const oldIndex = options.findIndex((_, i) => `option-${i}` === active.id);
    const newIndex = options.findIndex((_, i) => `option-${i}` === over.id);
    const reordered = arrayMove(options, oldIndex, newIndex);

    const correctAnswer = questions[questionIndex].correctAnswer;
    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === oldIndex) newCorrectAnswer = newIndex;
    else if (correctAnswer > oldIndex && correctAnswer <= newIndex)
      newCorrectAnswer--;
    else if (correctAnswer < oldIndex && correctAnswer >= newIndex)
      newCorrectAnswer++;

    const updated = [...questions];
    updated[questionIndex].options = reordered;
    updated[questionIndex].correctAnswer = newCorrectAnswer;
    setValue("questions", updated);
  };

  const getQuestionError = (idx: number) => {
    const question = questions[idx];
    if (!question) return "Missing question";
    if (!question.question) return "Please fill in the question.";
    if (question.options.length < 2)
      return "Please provide at least two options.";
    if (question.options.some((opt) => !opt))
      return "Please fill in all options.";
    if (
      question.correctAnswer < 0 ||
      question.correctAnswer >= question.options.length
    )
      return "Please select a correct answer.";
    return false;
  };

  const submitForm = handleSubmit((data) => {
    const hasErrors = data.questions.some((_, i) => {
      const error = getQuestionError(i);
      if (error) {
        toast.error(`Question ${i + 1}: ${error}`);
        return true;
      }
      return false;
    });
    if (!hasErrors) onSubmit(data);
  });

  return (
    <form onSubmit={submitForm}>
      <Card className="bg-white/10 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle>2. Questions and Answers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((_, i) => `question-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {questions.map((question, index) => {
                const hasError = getQuestionError(index);
                return (
                  <SortableItem
                    key={`question-${index}`}
                    id={`question-${index}`}
                    dragHandle={
                      <div className="cursor-grab pt-3">
                        <GripIcon />
                      </div>
                    }
                  >
                    <Accordion
                      type="single"
                      collapsible
                      value={openAccordion || ""}
                      onValueChange={setOpenAccordion}
                    >
                      <AccordionItem value={`question-${index}`}>
                        <AccordionTrigger
                          className={
                            hasError ? "text-violet-800 border-violet-800" : ""
                          }
                        >
                          <span className="flex items-center">
                            {hasError && <CircleAlert className="mr-2" />}
                            Question {index + 1}:{" "}
                            {question.question || "Untitled"}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-1 space-y-2">
                            {hasError && (
                              <p className="text-sm text-violet-600">
                                {hasError}
                              </p>
                            )}
                            <Label>Question</Label>
                            <Input
                              {...register(`questions.${index}.question`)}
                              placeholder={`Enter question ${index + 1}`}
                              className="bg-white/20 border-none text-white placeholder:text-white/50"
                            />
                            <Label className="mt-2">Answers</Label>
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              modifiers={[restrictToVerticalAxis]}
                              onDragEnd={(event) =>
                                handleOptionDragEnd(index, event)
                              }
                            >
                              <SortableContext
                                items={question.options.map(
                                  (_, i) => `option-${i}`
                                )}
                                strategy={verticalListSortingStrategy}
                              >
                                {question.options.map((_option, optIdx) => (
                                  <SortableItem
                                    key={`option-${optIdx}`}
                                    id={`option-${optIdx}`}
                                    dragHandle={
                                      <div className="cursor-grab pt-1">
                                        <GripIcon />
                                      </div>
                                    }
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                          setValue(
                                            `questions.${index}.correctAnswer`,
                                            optIdx
                                          )
                                        }
                                      >
                                        {question.correctAnswer === optIdx ? (
                                          <CircleCheckIcon />
                                        ) : (
                                          <CircleIcon />
                                        )}
                                      </Button>
                                      <Input
                                        {...register(
                                          `questions.${index}.options.${optIdx}`
                                        )}
                                        placeholder="Enter option"
                                        className={`bg-white/20 text-white placeholder:text-white/50 ${
                                          question.correctAnswer === optIdx
                                            ? "border-lime-800"
                                            : "border-white/0"
                                        }`}
                                      />
                                      <Button
                                        variant="destructive"
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => {
                                          const newOptions = [
                                            ...question.options,
                                          ];
                                          newOptions.splice(optIdx, 1);
                                          const updated = [...questions];
                                          updated[index].options = newOptions;
                                          setValue("questions", updated);
                                        }}
                                      >
                                        <X />
                                      </Button>
                                    </div>
                                  </SortableItem>
                                ))}
                              </SortableContext>
                            </DndContext>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                const updated = [...questions];
                                updated[index].options.push("");
                                setValue("questions", updated);
                              }}
                              className="mt-4 bg-white/20 hover:bg-white/30 text-white"
                            >
                              Add Option
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                const updated = [...questions];
                                updated.splice(index, 1);
                                setValue("questions", updated);
                              }}
                              className="mt-4 ml-2 bg-red-600 hover:bg-red-700"
                            >
                              Remove Question
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </SortableItem>
                );
              })}
            </SortableContext>
            <DragOverlay>
              {activeId && (
                <div className="p-4 border rounded shadow">Dragging...</div>
              )}
            </DragOverlay>
          </DndContext>
          <Button
            variant="outline"
            onClick={() => {
              setValue("questions", [
                ...questions,
                { question: "", options: ["", ""], correctAnswer: 0 },
              ]);
            }}
            className="w-full bg-white/20 hover:bg-white/30 text-white"
          >
            Add Question <PlusCircle />
          </Button>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handlePreviousStep(getValues())}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-medium"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
