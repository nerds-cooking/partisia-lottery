import { ellipsisAddress } from '@/lib/utils';
import { FingerprintIcon, UnplugIcon, UserCogIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../providers/auth/useAuth';
import { usePartisia } from '../providers/partisia/usePartisia';
import {
  AlertDialog,
  AlertDialogAction,
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
  const { user, isAuthenticated, login, setUsername } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  // const buttonStyles =
  //   'transition-colors px-3 py-2 rounded-md text-sm focus:outline-none';

  // // Define explicit default button colors for both states
  // const defaultButtonClass = 'bg-transparent text-foreground border-border'; // Transparent background, text color based on foreground
  // const connectedButtonClass = 'bg-transparent text-primary border-primary'; // Default color when connected to wallet

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
        {!user?.username && (
          <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
            <AlertDialogTrigger asChild>
              <Button variant='ghost'>
                <UserCogIcon />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              className='bg-purple-500/30 backdrop-blur-md rounded-xl shadow-lg border border-white/20 max-w-sm'
              style={{ padding: 0 }}
            >
              <form
                className='p-6 flex flex-col gap-4'
                onSubmit={(e) => {
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
                      className='bg-white/20 backdrop-blur-md border-white/20 hover-lift card-hover animate-fade-in'
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
                      setUsernameInput('');
                    }}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    type='submit'
                    className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-md'
                    disabled={!usernameInput.trim()}
                  >
                    Save
                  </AlertDialogAction>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        )}
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
