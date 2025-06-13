import { Button } from './ui/button';

export function PaginationControls({
  page,
  limit,
  total,
  prevPage,
  nextPage,
  className = '',
  disabledPrev,
  disabledNext
}: {
  page: number;
  limit: number;
  total: number;
  prevPage: () => void;
  nextPage: () => void;
  className?: string;
  disabledPrev?: boolean;
  disabledNext?: boolean;
}) {
  return (
    <div className={`flex justify-center items-center gap-4 mt-6 ${className}`}>
      <Button
        variant='outline'
        size='icon'
        onClick={prevPage}
        disabled={disabledPrev || page === 1}
        className='border-white/20 text-white hover:bg-white/10'
      >
        <svg
          className='h-4 w-4'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M15 19l-7-7 7-7'
          />
        </svg>
      </Button>
      <span className='text-white/80'>
        Page {page} of {total > 0 ? Math.ceil(total / limit) : 1}
      </span>
      <Button
        variant='outline'
        size='icon'
        onClick={nextPage}
        disabled={disabledNext || page >= Math.ceil(total / limit)}
        className='border-white/20 text-white hover:bg-white/10'
      >
        <svg
          className='h-4 w-4'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
        </svg>
      </Button>
    </div>
  );
}
