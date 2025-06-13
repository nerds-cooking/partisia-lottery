import { ellipsisAddress } from '@/lib/utils';
import { FingerprintIcon, LogOut, UnplugIcon, UserCogIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../providers/auth/useAuth';
import { usePartisia } from '../providers/partisia/usePartisia';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function NavWalletItem() {
  const { connect, sdk } = usePartisia();
  const { user, isAuthenticated, login, setUsername, logout } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  if (sdk?.isConnected) {
    if (!isAuthenticated) {
      // Connected but not authenticated, show button to authenticate
      return (
        <Button
          variant='outline'
          className={`bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 button-gradient`}
          onClick={() => {
            login();
          }}
        >
          <FingerprintIcon />
          Login
        </Button>
      );
    }

    // Show wallet address and button to connect to different wallet
    return (
      <>
        <Button
          variant='secondary'
          className={`bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 button-gradient`}
          onClick={connect}
        >
          {user?.username
            ? user.username
            : ellipsisAddress(user?.address || sdk.connection.account.address)}
        </Button>
        <div className='flex flex-row items-center'>
          {!user?.username && (
            <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
              <AlertDialogTrigger asChild>
                <Button variant='ghost'>
                  <UserCogIcon />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className='bg-white/10 backdrop-blur-md border border-white/10 shadow-xl rounded-xl max-w-sm p-0'>
                <div className='p-6'>
                  <form
                    className='flex flex-col gap-4'
                    onSubmit={(e) => {
                      e.stopPropagation();

                      alert('Setting username...');
                      e.preventDefault();

                      setUsername(usernameInput.trim()).then(() => {
                        setModalOpen(false);
                        setUsernameInput('');
                      });
                    }}
                  >
                    <AlertDialogHeader>
                      <AlertDialogTitle className='text-white'>
                        Set a username?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        <Input
                          className='bg-white/20 backdrop-blur-md border-white/20 text-white placeholder:text-white/60'
                          placeholder='Enter your username'
                          value={usernameInput}
                          onChange={(e) => {
                            setUsernameInput(e.target.value);
                          }}
                        />
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className='mt-4 flex flex-row gap-2'>
                      <AlertDialogCancel
                        className='bg-white/30 backdrop-blur-sm text-white border border-white/20 hover:bg-white/40 rounded-md'
                        onClick={() => {
                          setModalOpen(false);
                        }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <Button
                        type='submit'
                        className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-md'
                        disabled={!usernameInput.trim()}
                      >
                        Save
                      </Button>
                    </AlertDialogFooter>
                  </form>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant='ghost'
            className='ml-2'
            onClick={logout}
            title='Logout'
          >
            <LogOut />
          </Button>
        </div>
      </>
    );
  }

  // Show button to connect to wallet
  return (
    <Button
      variant='outline'
      className={`bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 button-gradient`}
      onClick={connect}
    >
      <UnplugIcon />
      Connect to Wallet
    </Button>
  );
}
