import axiosInstance from "@/lib/axios";
import { useAuth } from "../auth/useAuth";

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
  /**
   * ISO timestamp
   */
  deadline: string;
  creationTxn: string;
}

export function useGameCreation() {
  const { user } = useAuth();

  const createNewGame = async (gameData: CreateGamePayload) => {
    if (!user) throw new Error("User not authenticated");

    const resp = await axiosInstance.post("/api/game", gameData);

    if (resp.status !== 201) {
      throw new Error("Failed to create game");
    }

    return resp.data;
  };

  return {
    createNewGame,
  };
}
