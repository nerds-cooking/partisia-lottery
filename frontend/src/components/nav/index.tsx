import { Plus, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/auth/useAuth';
import { NavWalletItem } from './nav-wallet-item';

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/40 backdrop-blur-md shadow-lg'
          : 'bg-black/20 backdrop-blur-md'
      } border-b border-white/10`}
    >
      <div className='container mx-auto px-4 py-4'>
        <div className='flex items-center justify-between'>
          <Link
            to='/'
            className='flex items-center space-x-2 transition-transform hover:scale-105'
          >
            <div className='bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg'>
              <Ticket className='h-6 w-6 text-white' />
            </div>
            <span className='text-xl font-bold text-white'>Privotto</span>
          </Link>

          <nav className='hidden md:flex items-center space-x-6'>
            <Link
              to='/'
              className={`text-white/80 hover:text-white transition-colors relative group${location.pathname === '/' ? ' font-bold' : ''}`}
            >
              Home
              <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full'></span>
            </Link>
            <Link
              to='/dashboard'
              className={`text-white/80 hover:text-white transition-colors relative group${location.pathname.startsWith('/dashboard') ? ' font-bold' : ''}`}
            >
              Dashboard
              <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full'></span>
            </Link>
            {isAuthenticated && (
              <Link
                to='/create-lottery'
                className={`text-white/80 hover:text-white transition-colors relative group${location.pathname.startsWith('/create-lottery') ? ' font-bold' : ''}`}
              >
                <Plus className='h-4 w-4 inline mr-1' />
                Create
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full'></span>
              </Link>
            )}
          </nav>

          <div className='flex items-center space-x-4'>
            <NavWalletItem />
          </div>
        </div>
      </div>
    </header>
  );
}
