import { Button } from "@/components/ui/button";
import { OnChainGameState } from "@/lib/types/OnChainGameState";

export function CountdownOrFinishButton({
  isPending,
  isInProgress,
  isPendingFinish,
  isFinished,
  isPublished,
  onChainGameState,
  currentAccount,
  onFinish,
}: {
  isPending: boolean;
  isInProgress: boolean;
  isPendingFinish: boolean;
  isFinished: boolean;
  isPublished: boolean;

  onChainGameState: OnChainGameState;
  currentAccount: string;

  onFinish?: () => void;
}) {
  const gameDeadline = new Date(Number(onChainGameState.gameDeadline));
  const now = new Date();

  if (isPending) {
    return (
      <p className="text-sm text-black/60">
        Waiting for on-chain creation by MPC nodes...
      </p>
    );
  }

  if (isInProgress) {
    const timeLeft = Math.max(0, gameDeadline.getTime() - now.getTime());
    const minutesLeft = Math.floor(timeLeft / 1000 / 60);
    return (
      <p className="text-sm text-black/60">Time left: {minutesLeft} minutes</p>
    );
  }

  if (isPendingFinish) {
    return (
      <Button
        onClick={onFinish}
        disabled={currentAccount !== onChainGameState.creator}
      >
        Finish Game
      </Button>
    );
  }

  if (isFinished) {
    return (
      <p className="text-sm text-black/60">
        Game finished! Waiting for MPC nodes
      </p>
    );
  }

  if (isPublished) {
    return <p className="text-sm text-black/60">Results published!</p>;
  }

  return null;
}
