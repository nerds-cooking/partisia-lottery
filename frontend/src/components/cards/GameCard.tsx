import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { GameStatusD } from '@/lib/TriviaApiGenerated';
import { CircleHelp, Clock, Users } from 'lucide-react';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Game } from '../providers/game/useGame';

interface GameCardProps {
  game: Game;
  userMap: Record<string, string>;
}

export function GameCard({ game, userMap }: GameCardProps) {
  const status = useMemo(() => {
    const isPending =
      game?.onChainGameState?.gameStatus === GameStatusD.Pending;
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

    if (isPending) return 'waiting';
    if (isInProgress) return 'in-progress';
    if (isPendingFinish) return 'pending-finish';
    if (isFinished) return 'finished';
    if (isPublished) return 'published';
    return 'unknown';
  }, [game?.onChainGameState?.gameStatus, game?.onChainGameState.gameDeadline]);

  return (
    <Link to={`/games/${game.gameId}`}>
      <Card className='overflow-hidden border-0 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors'>
        <CardHeader className='pb-2'>
          <div className='flex justify-between items-start'>
            <CardTitle className='text-xl font-bold'>{game.name}</CardTitle>
            <Badge
              variant={
                status === 'waiting'
                  ? 'outline'
                  : status === 'pending-finish'
                    ? 'destructive'
                    : status === 'finished'
                      ? 'destructive'
                      : status === 'published'
                        ? 'default'
                        : status === 'in-progress'
                          ? 'secondary'
                          : 'default'
              }
              className={`
              ${
                status === 'waiting'
                  ? 'border-green-400 text-green-400'
                  : status === 'in-progress'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-500'
              }
            `}
            >
              {status === 'waiting'
                ? 'Waiting'
                : status === 'in-progress'
                  ? 'In Progress'
                  : 'Completed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-sm text-white/80'>
            Hosted by: {userMap[game.onChainGameState.creator] || 'Unknown'}
          </div>
          <div className='flex flex-wrap gap-2 mt-2'>
            <div className='flex items-center text-sm'>
              <span role='img' aria-label='questions' className='mr-1'>
                <CircleHelp className='mr-1 h-4 w-4 text-white/70' />
              </span>
              <span>
                {game?.onChainGameState?.questionCount} Question
                {game?.onChainGameState?.questionCount > 1 ? 's' : ''}
              </span>
            </div>
            <div className='flex items-center text-sm'>
              <Users className='mr-1 h-4 w-4 text-white/70' />
              <span>
                {game.onChainGameState.players.length} Player
                {game?.onChainGameState?.players.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className='pt-2 border-t border-white/10 flex justify-between'>
          <div className='text-xs text-white/60'>ID: {game.gameId}</div>
          <div className='flex items-center text-xs text-white/60'>
            <Clock className='mr-1 h-3 w-3' />
            <span>
              {status === 'in-progress'
                ? `Finishes ${DateTime.fromMillis(Number(game.onChainGameState.gameDeadline)).toRelative()}`
                : status === 'pending-finish'
                  ? 'Waiting to publish'
                  : ['finished', 'published'].includes(status)
                    ? `Complete`
                    : ''}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
