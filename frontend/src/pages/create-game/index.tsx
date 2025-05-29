import { useGameCreation } from "@/components/providers/game/useGameCreation";
import { usePartisia } from "@/components/providers/partisia/usePartisia";
import { useSettings } from "@/components/providers/setting/useSettings";
import { TriviaApi } from "@/lib/TriviaApi";
import { BN } from "@partisiablockchain/abi-client";
import {
  BlockchainAddress,
  BlockchainTransactionClient,
} from "@partisiablockchain/blockchain-api-transaction-client";
import { Client, RealZkClient } from "@partisiablockchain/zk-client";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthPageWrapper } from "../auth-page-wrapper";
import { ConfirmGameStep } from "./ConfirmGameStep";
import { CreateGameStep1, CreateGameStep1Form } from "./CreateGameStep1";
import { CreateGameStep2, CreateGameStep2Form } from "./CreateGameStep2";

export function CreateGamePage() {
  const { createNewGame } = useGameCreation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { sdk } = usePartisia();
  const { settings } = useSettings();

  const [formState, setFormState] = useState<
    CreateGameStep1Form & CreateGameStep2Form
  >({
    gameId: Math.floor(Math.random() * 4_294_967_295).toString(),
    title: "",
    description: "",
    category: "",
    deadline: new Date(),
    questions: [
      {
        question: "",
        options: ["", ""],
        correctAnswer: 0,
      },
    ],
  });

  const createGame = useCallback(async () => {
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
      for (let i = 0; i < formState.questions.length; i++) {
        const question = formState.questions[i];
        answersArr[i] = question.correctAnswer + 1;
      }

      const txn = await triviaApi.createGame(
        {
          gameId: Number(formState.gameId),
          questionCount: formState.questions.length,
          gameDeadline: new BN(+formState.deadline),
        },
        answersArr
      );

      await createNewGame({
        gameId: formState.gameId,
        name: formState.title,
        description: formState.description,
        category: formState.category,
        questions: formState.questions.map((q) => ({
          question: q.question,
          answers: q.options.map((o) => ({ answer: o })),
        })),
        deadline: formState.deadline.toISOString(),
        creationTxn: txn.signedTransaction.identifier(),
      });

      toast.success("Saved game!");
      navigate(`/games/${formState.gameId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create game");
    } finally {
      setIsSubmitting(false);
    }
  }, [createNewGame, navigate, sdk, settings, formState]);

  return (
    <AuthPageWrapper>
      <h1 className="text-3xl font-bold text-center text-yellow-300 mb-8">
        Create a Game
      </h1>

      {step === 1 && (
        <CreateGameStep1
          defaultValues={formState}
          onSubmit={(data) => {
            setFormState((prev) => ({ ...prev, ...data }));
            setStep(2);
          }}
        />
      )}

      {step === 2 &&
        (isSubmitting ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <CreateGameStep2
            defaultValues={formState}
            onSubmit={(data) => {
              setFormState((prev) => ({ ...prev, ...data }));
              setStep(3);
            }}
            handlePreviousStep={(data) => {
              setFormState((prev) => ({ ...prev, ...data }));
              setStep(1);
            }}
          />
        ))}

      {step === 3 && (
        <ConfirmGameStep
          values={formState}
          onConfirm={createGame}
          onBack={() => setStep(2)}
        />
      )}
    </AuthPageWrapper>
  );
}
