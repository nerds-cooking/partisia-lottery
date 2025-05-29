import { useGame } from "@/components/providers/game/useGame";
import { usePartisia } from "@/components/providers/partisia/usePartisia";
import { useSettings } from "@/components/providers/setting/useSettings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TriviaApi } from "@/lib/TriviaApi";
import { GameStatusD } from "@/lib/TriviaApiGenerated";
import {
  BlockchainAddress,
  BlockchainTransactionClient,
} from "@partisiablockchain/blockchain-api-transaction-client";
import { Client, RealZkClient } from "@partisiablockchain/zk-client";
import JSConfetti from "js-confetti";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AnswersSummary } from "./AnswersSummary";
import { CountdownOrFinishButton } from "./CountdownOrFinishButton";
import { QuestionView } from "./QuestionView";

export function GameViewPage() {
  const gameId = useParams<{ gameId: string }>().gameId;

  const { game, loading, error, refreshGame } = useGame(gameId || "0");
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(20).fill(-1));
  const confettiRef = useRef<JSConfetti | null>(null);

  const { settings } = useSettings();
  const { sdk } = usePartisia();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      confettiRef.current = new JSConfetti();
    }
    return () => {
      confettiRef.current = null;
    };
  }, []);

  const isPending = game?.onChainGameState?.gameStatus === GameStatusD.Pending;
  const isInProgress =
    game?.onChainGameState?.gameStatus === GameStatusD.InProgress &&
    +new Date() < +new Date(Number(game?.onChainGameState.gameDeadline));
  const isPendingFinish =
    game?.onChainGameState?.gameStatus === GameStatusD.InProgress &&
    +new Date() > +new Date(Number(game?.onChainGameState.gameDeadline));
  const isFinished =
    game?.onChainGameState?.gameStatus === GameStatusD.Complete;
  const isPublished =
    game?.onChainGameState?.gameStatus === GameStatusD.Published;

  const onSubmit = useCallback(async () => {
    if (!game) {
      return;
    }

    setIsSubmitting(true);

    try {
      const currentAccount = sdk?.connection.account;

      const contractAddress = settings?.find(
        (s) => s.name === "contractAddress"
      )?.value;
      if (!contractAddress) {
        toast.error("Contract address not found");
        return;
      }

      const partisiaClientUrl = settings?.find(
        (s) => s.name === "partisiaClientUrl"
      )?.value;
      if (!partisiaClientUrl) {
        toast.error("Partisia client URL not found");
        return;
      }

      const client = new Client(partisiaClientUrl);
      const transactionClient = BlockchainTransactionClient.create(
        partisiaClientUrl,
        {
          getAddress: () => currentAccount!.address as BlockchainAddress,
          sign: async (payload: Buffer) => {
            const res = await sdk!.signMessage({
              payload: payload.toString("hex"),
              payloadType: "hex",
              dontBroadcast: true,
            });
            return res.signature;
          },
        }
      );
      const zkClient = RealZkClient.create(contractAddress, client);
      const triviaApi = new TriviaApi(
        transactionClient,
        zkClient,
        currentAccount!.address,
        contractAddress
      );

      const answersArr = new Array(20);
      for (let i = 0; i < game?.questions.length; i++) {
        answersArr[i] = answers[i] + 1;
      }

      const txn = await triviaApi.submitAnswers(Number(gameId), answersArr);

      console.log(txn);

      toast.success("Answers submitted!");

      // Create a celebratory confetti effect
      confettiRef.current?.addConfetti({
        emojis: ["🎉", "🏆", "🥳", "✨", "🚀", "🎯", "🧠"],
        emojiSize: 60,
        confettiNumber: 150,
        confettiRadius: 6,
      });

      // Add a second wave of colorful confetti for a more festive effect
      setTimeout(() => {
        confettiRef.current?.addConfetti({
          confettiColors: [
            "#ffd700",
            "#9c27b0",
            "#ff5722",
            "#2196f3",
            "#4caf50",
          ],
          confettiRadius: 8,
          confettiNumber: 200,
        });
      }, 300);

      // Refresh game data first
      await refreshGame();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit answers");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, game, gameId, sdk, settings, refreshGame]);

  const onFinish = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const currentAccount = sdk?.connection.account;

      const contractAddress = settings?.find(
        (s) => s.name === "contractAddress"
      )?.value;
      if (!contractAddress) {
        toast.error("Contract address not found");
        return;
      }

      const partisiaClientUrl = settings?.find(
        (s) => s.name === "partisiaClientUrl"
      )?.value;
      if (!partisiaClientUrl) {
        toast.error("Partisia client URL not found");
        return;
      }

      const client = new Client(partisiaClientUrl);
      const transactionClient = BlockchainTransactionClient.create(
        partisiaClientUrl,
        {
          getAddress: () => currentAccount!.address as BlockchainAddress,
          sign: async (payload: Buffer) => {
            const res = await sdk!.signMessage({
              payload: payload.toString("hex"),
              payloadType: "hex",
              dontBroadcast: true,
            });
            return res.signature;
          },
        }
      );
      const zkClient = RealZkClient.create(contractAddress, client);

      const triviaApi = new TriviaApi(
        transactionClient,
        zkClient,
        currentAccount!.address,
        contractAddress
      );

      await triviaApi.finishGame(Number(gameId));
    } catch (err) {
      console.error(err);
      toast.error("Failed to finish game");
    } finally {
      setIsSubmitting(false);
    }
  }, [gameId, sdk, settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div role="status">
          <svg
            aria-hidden="true"
            className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-yellow-400"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-red-500">Game not found</p>
      </div>
    );
  }

  if (!sdk?.connection.account.address) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-red-500">Please connect your wallet</p>
      </div>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl font-bold">
          {game?.name}

          {!isSubmitting && (
            <CountdownOrFinishButton
              isPending={isPending}
              isInProgress={isInProgress}
              isPendingFinish={isPendingFinish}
              isFinished={isFinished}
              isPublished={isPublished}
              onChainGameState={game.onChainGameState}
              currentAccount={sdk.connection.account.address}
              onFinish={onFinish}
            />
          )}
        </CardTitle>
        <CardDescription className="text-sm text-gray-900 mt-2 flex items-center gap-2">
          {game.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-lg shadow-sm bg-white/20">
            <p className="text-sm font-semibold text-gray-900">Category</p>
            <p className="text-sm text-gray-900">{game.category}</p>
          </div>
          <div className="p-4 rounded-lg shadow-sm bg-white/20">
            <p className="text-sm font-semibold text-gray-900">Created At</p>
            <p className="text-sm text-gray-900">
              {new Date(game?.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg shadow-sm bg-white/20">
            <p className="text-sm font-semibold text-gray-900">Deadline</p>
            <p className="text-sm text-gray-900">
              {new Date(game?.deadline).toLocaleString()}
            </p>
          </div>
        </div>

        {isInProgress && (
          <div className="mt-8 w-full">
            {game?.onChainGameState?.players.includes(
              sdk.connection.account.address
            ) ? (
              <p className="text-lg text-violet-800 font-semibold text-center">
                You have already played this game
              </p>
            ) : (
              <>
                <div>
                  {activeQuestionIdx === game?.questions.length ? (
                    <AnswersSummary game={game} answers={answers} />
                  ) : (
                    <QuestionView
                      question={game?.questions[activeQuestionIdx]}
                      index={activeQuestionIdx}
                      setAnswers={setAnswers}
                      answers={answers}
                    />
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    gap: "8px",
                  }}
                >
                  <Button
                    variant="ghost"
                    className="w-[100px]"
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx((prev) => prev - 1)}
                  >
                    Previous
                  </Button>
                  {activeQuestionIdx !== game?.questions.length && (
                    <p className="text-sm text-gray-700">
                      {activeQuestionIdx + 1} / {game?.questions.length}
                    </p>
                  )}
                  <Button
                    variant="default"
                    className="w-[100px] bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-medium"
                    disabled={isSubmitting}
                    onClick={() => {
                      if (activeQuestionIdx === game?.questions.length) {
                        onSubmit();
                        return;
                      }
                      // Check if the answer is selected
                      if (answers[activeQuestionIdx] === -1) {
                        toast.error("Please select an answer");
                        return;
                      }
                      // Move to the next question
                      setActiveQuestionIdx((prev) => prev + 1);
                    }}
                  >
                    {isSubmitting &&
                    activeQuestionIdx === game?.questions.length
                      ? "Submitting..."
                      : activeQuestionIdx === game?.questions.length
                        ? "Submit"
                        : "Next"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        {isPublished && (
          <div className="mt-8 w-full px-4 py-2">
            <Table>
              <TableCaption>Leaderboard</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {game?.onChainGameState?.leaderboard.map((player, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {game?.userMap[player.player] || player.player}
                    </TableCell>
                    <TableCell>{player.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
