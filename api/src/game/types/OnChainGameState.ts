import { GameStatusD } from '../utils/TriviaApiGenerated';

export interface OnChainGameState {
  gameId: number;
  creator: string;
  gameStatus: GameStatusD;
  /**
   * ISO timestamp with millis
   */
  gameDeadline: string;
  players: string[];
  gameDataSvar: { rawId: string };
  entriesSvars: Array<{ rawId: string }>;
  resultsSvars: Array<{ rawId: string }>;
  leaderboard: Array<{
    gameId: number;
    player: string;
    score: number;
  }>;
}
