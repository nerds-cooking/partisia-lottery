import LotteryCard from '@/components/cards/LotteryCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import MPCExplanation from '@/components/MPCExplanation';
import { PaginationControls } from '@/components/Pagination';
import { useLotteries } from '@/components/providers/lottery/useLotteries';
import { LotteryStatusD } from '@/lib/LotteryApiGenerated';
import { Eye, Shield, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function HomePage() {
  const { lotteries, loading, error, page, limit, total, nextPage, prevPage } =
    useLotteries(1, 3, LotteryStatusD.Open);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.classList.remove('animate-fade-in');

      void listRef.current.offsetWidth;
      listRef.current.classList.add('animate-fade-in');
    }
  }, [page]);

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

        {/* <div className='flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-3'>
          <Button
            size='lg'
            variant='outline'
            className='border-white/20 text-white hover:bg-white/10 transition-all'
          >
            Learn More
          </Button>
        </div> */}
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

        {loading ? (
          <div className='text-center py-12 animate-fade-in'>
            <LoadingSpinner text='Loading lotteries...' />
          </div>
        ) : error ? (
          <div className='text-center py-12 animate-fade-in'>
            <p className='text-red-400 mb-4'>Error: {error}</p>
          </div>
        ) : lotteries?.length > 0 ? (
          <>
            <div
              ref={listRef}
              className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in'
            >
              {lotteries?.map((lottery, index) => (
                <LotteryCard
                  key={lottery.lotteryId}
                  lottery={lottery}
                  index={index}
                />
              ))}
            </div>
            <PaginationControls
              page={page}
              limit={limit}
              total={total}
              prevPage={prevPage}
              nextPage={nextPage}
              disabledPrev={loading}
              disabledNext={loading}
            />
          </>
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
    </div>
  );
}
