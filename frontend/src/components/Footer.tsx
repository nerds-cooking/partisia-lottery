import { Eye, Lock, Shield } from 'lucide-react';
import type React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className='bg-black/30 backdrop-blur-md border-t border-white/10 mt-16'>
      <div className='container mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 md:px-4'>
          <div className='mx-auto w-full md:max-w-xs'>
            <h3 className='text-white font-semibold mb-4'>How It Works</h3>
            <p className='text-white/60 text-sm'>
              Our lottery uses Multi-Party Computation (MPC) to ensure fair and
              private draws. No single party can manipulate the outcome, and
              participant privacy is protected throughout the process.
            </p>
          </div>
          <div className='mx-auto w-full md:max-w-xs'>
            <h3 className='text-white font-semibold mb-4'>Privacy Features</h3>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2 text-white/60'>
                <Shield className='h-4 w-4' />
                <span className='text-sm'>MPC-Protected Draws</span>
              </div>
              <div className='flex items-center space-x-2 text-white/60'>
                <Lock className='h-4 w-4' />
                <span className='text-sm'>Anonymous Participation</span>
              </div>
              <div className='flex items-center space-x-2 text-white/60'>
                <Eye className='h-4 w-4' />
                <span className='text-sm'>Transparent Results</span>
              </div>
            </div>
          </div>

          <div className='mx-auto w-full md:max-w-xs'>
            <h3 className='text-white font-semibold mb-4'>Built on Partisia</h3>
            <p className='text-white/60 text-sm'>
              Powered by Partisia Blockchain's advanced MPC technology for
              privacy-preserving smart contracts and secure random number
              generation.
            </p>
          </div>
        </div>

        <div className='border-t border-white/10 mt-8 pt-8 text-center'>
          <p className='text-white/40 text-sm'>
            © 2025 nerds.cooking. Built for Partisia Blockchain Bounty Program.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
