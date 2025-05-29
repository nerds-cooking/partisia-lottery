import LotteryCard from '@/components/LotteryCard';
import MPCExplanation from '@/components/MPCExplanation';
import { Button } from '@/components/ui/button';
import { useLottery } from '@/lib/LotteryContext';
import { Eye, Shield, Zap } from 'lucide-react';

export function HomePage() {
  // const [page] = useState(1);
  // const [limit] = useState(3);

  // const fetchGames = useCallback(async () => {
  //   const response = await axiosInstance.get(
  //     `/api/game?page=${page}&limit=${limit}`
  //   );

  //   if (response.status === 200) {
  //     return response.data;
  //   } else {
  //     throw new Error('Failed to fetch games');
  //   }
  // }, [limit, page]);

  // const query = useQuery<{
  //   games: Array<Game>;
  //   totalItems: number;
  //   totalPages: number;
  //   page: number;
  //   userMap: Record<string, string>;
  // }>({
  //   queryKey: ['games', page, limit],
  //   queryFn: fetchGames
  // });

  const { lotteries } = useLottery();
  const activeLotteries = lotteries.filter(
    (lottery) => lottery.status === 'active'
  );

  return (
    <div className='space-y-12'>
      <section className='text-center space-y-6'>
        <div className='space-y-4'>
          <h1 className='text-4xl md:text-6xl font-bold text-white animate-fade-in'>
            Privacy-Protected
            <span className='bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent'>
              Lottery
            </span>
          </h1>
          <p className='text-xl text-white/80 max-w-3xl mx-auto animate-fade-in stagger-1'>
            Experience the future of fair gaming with Multi-Party Computation.
            Your participation stays private, the draw is provably fair, and the
            results are transparent.
          </p>
        </div>
        <div className='flex flex-wrap justify-center gap-4 animate-fade-in stagger-2'>
          <div className='flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 hover:bg-white/20 transition-all'>
            <Shield className='h-4 w-4 text-purple-400' />
            <span className='text-white/80 text-sm'>MPC Protected</span>
          </div>
          <div className='flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 hover:bg-white/20 transition-all'>
            <Zap className='h-4 w-4 text-blue-400' />
            <span className='text-white/80 text-sm'>Instant Payouts</span>
          </div>
          <div className='flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 hover:bg-white/20 transition-all'>
            <Eye className='h-4 w-4 text-green-400' />
            <span className='text-white/80 text-sm'>Transparent Results</span>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-3'>
          {/* <Button
            onClick={() => alert('View Dashboard clicked!')}
            size='lg'
            className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 button-gradient'
          >
            View Dashboard
            <ArrowRight className='h-4 w-4 ml-2' />
          </Button> */}
          <Button
            size='lg'
            variant='outline'
            className='border-white/20 text-white hover:bg-white/10 transition-all'
          >
            Learn More
          </Button>
        </div>
      </section>

      <section className='space-y-6'>
        <div className='text-center animate-fade-in'>
          <h2 className='text-3xl font-bold text-white mb-4'>
            Active Lotteries
          </h2>
          <p className='text-white/70'>
            Join ongoing lotteries and win big prizes
          </p>
        </div>

        {activeLotteries.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {activeLotteries.map((lottery, index) => (
              <LotteryCard key={lottery.id} lottery={lottery} index={index} />
            ))}
          </div>
        ) : (
          <div className='text-center py-12 animate-fade-in'>
            <p className='text-white/60 mb-4'>
              No active lotteries at the moment
            </p>
            <p className='text-white/40 text-sm'>
              Check back soon for new opportunities!
            </p>
          </div>
        )}
      </section>

      {/* MPC Explanation */}
      <section className='animate-fade-in'>
        <MPCExplanation />
      </section>

      {/* <section className='mb-16'>
          <h3 className='text-3xl font-bold text-center mb-8 text-yellow-200'>
            Featured Games
          </h3>
          {query.isLoading && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <div className='flex flex-col space-y-3'>
                <Skeleton className='h-[125px] rounded-xl' />
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-[250px]' />
                  <Skeleton className='h-4 w-[200px]' />
                </div>
              </div>
              <div className='flex flex-col space-y-3'>
                <Skeleton className='h-[125px] rounded-xl' />
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-[250px]' />
                  <Skeleton className='h-4 w-[200px]' />
                </div>
              </div>
              <div className='flex flex-col space-y-3'>
                <Skeleton className='h-[125px] rounded-xl' />
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-[250px]' />
                  <Skeleton className='h-4 w-[200px]' />
                </div>
              </div>
            </div>
          )}
          {query.isError && <p>Error: {query.error.message}</p>}
          {query.isSuccess && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {query.data.games.map((game) => (
                <GameCard
                  key={game.gameId}
                  game={game}
                  userMap={query.data.userMap || {}}
                />
              ))}
            </div>
          )}
        </section> */}

      {/* <section className='max-w-3xl mx-auto text-center'>
        <h3 className='text-3xl font-bold mb-6 text-yellow-200'>
          How It Works
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <Card className='bg-white/10 backdrop-blur-sm border-0 text-white'>
            <CardContent className='pt-6'>
              <div className='w-16 h-16 bg-yellow-400 text-purple-800 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4'>
                1
              </div>
              <CardTitle className='text-xl mb-2 text-center'>
                Connect
              </CardTitle>
              <CardDescription className='text-white/80 text-center'>
                Connect with your Parti Wallet extension to get started
              </CardDescription>
            </CardContent>
          </Card>
          <Card className='bg-white/10 backdrop-blur-sm border-0 text-white'>
            <CardContent className='pt-6'>
              <div className='w-16 h-16 bg-green-400 text-purple-800 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4'>
                2
              </div>
              <CardTitle className='text-xl mb-2 text-center'>Play</CardTitle>
              <CardDescription className='text-white/80 text-center'>
                Create or join a game and answer trivia questions
              </CardDescription>
            </CardContent>
          </Card>
          <Card className='bg-white/10 backdrop-blur-sm border-0 text-white'>
            <CardContent className='pt-6'>
              <div className='w-16 h-16 bg-blue-400 text-purple-800 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4'>
                3
              </div>
              <CardTitle className='text-xl mb-2 text-center'>Win</CardTitle>
              <CardDescription className='text-white/80 text-center'>
                See your score on the blockchain leaderboard
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section> */}
    </div>
  );
}
