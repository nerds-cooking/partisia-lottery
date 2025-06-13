import React from 'react';

type LoadingSpinnerProps = {
  text?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...'
}) => {
  return (
    <div className='flex items-center justify-center h-75 w-full'>
      <svg
        className='animate-spin h-10 w-10 text-purple-500'
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
      >
        <circle
          className='opacity-25'
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='4'
        ></circle>
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
        ></path>
      </svg>
      <span className='ml-4 text-white text-lg'>{text}</span>
    </div>
  );
};

export default LoadingSpinner;
