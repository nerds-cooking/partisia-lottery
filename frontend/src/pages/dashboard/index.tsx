import LoadingSpinner from '@/components/LoadingSpinner';
import { PaginationControls } from '@/components/Pagination';
import { useAuth } from '@/components/providers/auth/useAuth';
import { usePartisia } from '@/components/providers/partisia/usePartisia';
import { useSettings } from '@/components/providers/setting/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useCreditsBalance } from '@/hooks/useCreditsBalance';
import { useGetUserEntries } from '@/hooks/useGetUserEntries';
import { useGetUserStats } from '@/hooks/useGetUserStats';
import { useHasAccountOnChain } from '@/hooks/useHasAccountOnChain';
import {
  CircleMinusIcon,
  CirclePlusIcon,
  CoinsIcon,
  Loader,
  Plus,
  RotateCcw,
  Ticket,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateAccountForm } from '../../components/CreateAccountForm';
import { PurchaseCreditsForm } from '../../components/PurchaseCreditsForm';
import { RedeemCreditsForm } from '../../components/RedeemCreditsForm';
import { AuthPageWrapper } from '../auth-page-wrapper';

export function DashboardPage() {
  const navigate = useNavigate();
  const [isAddCreditsModalOpen, setAddCreditsModalOpen] = useState(false);
  const [isRedeemCreditsModalOpen, setRedeemCreditsModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setCreateAccountModalOpen] = useState(false);
  const { hasAccount, loading: hasAccountLoading } =
    useHasAccountOnChain(30000);
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();
  const { isConnected } = usePartisia();

  const tokenSymbol = useMemo(
    () => settings?.find((setting) => setting.name === 'tokenSymbol')?.value,
    [settings]
  );

  const tokenContractAddress = useMemo(
    () =>
      settings?.find((setting) => setting.name === 'tokenContractAddress')
        ?.value,
    [settings]
  );

  const contractAddress = useMemo(
    () =>
      settings?.find((setting) => setting.name === 'contractAddress')?.value,
    [settings]
  );

  const explorerUrl = useMemo(
    () =>
      settings?.find((setting) => setting.name === 'explorerUrl')?.value ||
      'https://explorer.partisiablockchain.com',
    [settings]
  );

  const [userEntriesPage, setUserEntriesPage] = useState(1);
  const userEntriesLimit = 3;
  const {
    entries,
    loading: userEntriesLoading,
    total: userEntriesTotal,
    page: userEntriesCurrentPage,
    limit: userEntriesCurrentLimit,
    nextPage: userEntriesNextPage,
    prevPage: userEntriesPrevPage
  } = useGetUserEntries(userEntriesPage, userEntriesLimit);

  // Always call the hook, but use its values only if connected and authenticated
  const {
    balance: hookBalance,
    loading: hookIsBalanceLoading,
    error: hookError,
    refresh: hookRefresh
  } = useCreditsBalance();

  const balance = isConnected && isAuthenticated ? hookBalance : '0';
  const isBalanceLoading =
    isConnected && isAuthenticated ? hookIsBalanceLoading : false;
  const error = isConnected && isAuthenticated ? hookError : null;
  const refresh = isConnected && isAuthenticated ? hookRefresh : () => {};

  const { data: stats } = useGetUserStats();

  // Helper for date formatting
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  if (hasAccountLoading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <LoadingSpinner text='Checking account status...' />
      </div>
    );
  }

  return (
    <AuthPageWrapper>
      <div className='space-y-8'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
          <div className='text-center md:text-left'>
            <h1 className='text-3xl font-bold text-white mb-2'>
              Your Dashboard
            </h1>
            <p className='text-white/70'>
              Track your lottery participation and winnings
            </p>
            {/* Show create account button if user does not have an account */}
            {!hasAccount && (
              <div className='flex justify-center md:justify-start mt-4'>
                <Button
                  className='bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 font-bold'
                  onClick={() => setCreateAccountModalOpen(true)}
                >
                  Create Account
                </Button>
                {isCreateAccountModalOpen && (
                  <Dialog
                    open={isCreateAccountModalOpen}
                    onOpenChange={setCreateAccountModalOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle />
                      </DialogHeader>
                      <CreateAccountForm
                        onSuccess={() => setCreateAccountModalOpen(false)}
                        onCancel={() => setCreateAccountModalOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
            {hasAccount && (
              <div className='text-white/70 mt-2'>
                <span className='text-green-400 font-semibold'>Account:</span>{' '}
                {hasAccount ? 'Active' : 'Not Active'}
              </div>
            )}
          </div>

          <div className='mt-4 md:mt-0 flex justify-center md:justify-end w-full md:w-auto'>
            <Button
              onClick={() => navigate('/create-lottery')}
              className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 button-gradient'
            >
              <Plus className='h-4 w-4 mr-2' />
              Create Lottery
            </Button>
          </div>
        </div>

        {contractAddress && (
          <div className='flex justify-center mb-4'>
            <a
              href={`${explorerUrl}/contracts/${tokenContractAddress}`}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-pink-500 text-white font-semibold shadow hover:from-yellow-600 hover:to-pink-600 transition-colors border border-white/10'
            >
              <CoinsIcon className='h-4 w-4' />
              You can mint {tokenSymbol} tokens here for testing
            </a>
          </div>
        )}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <Card className='bg-white/10 backdrop-blur-md border-white/20 relative'>
            {hasAccount && (
              <button
                onClick={refresh}
                disabled={isBalanceLoading}
                className='absolute top-3 right-3 p-1 rounded hover:bg-white/10 transition disabled:opacity-50'
                title='Refresh Balance'
              >
                {isBalanceLoading ? (
                  <Loader className='h-5 w-5 text-blue-300 animate-spin' />
                ) : (
                  <RotateCcw className='h-5 w-5 text-blue-300' />
                )}
              </button>
            )}
            <CardContent className='p-6 text-center'>
              <CoinsIcon className='h-8 w-8 text-purple-400 mx-auto mb-2' />
              <div className='text-2xl font-bold text-white min-h-[2.5rem] flex items-center justify-center'>
                {isBalanceLoading ? (
                  <span className='inline-flex items-center gap-2'>
                    <Loader className='animate-spin h-6 w-6 text-blue-400' />
                  </span>
                ) : error ? (
                  <span className='text-red-400 text-base bg-red-900/40 px-2 py-1 rounded'>
                    {error}
                  </span>
                ) : (
                  balance
                )}
              </div>
              <div className='text-white/60 text-sm'>Total Credits</div>
              {hasAccount && (
                <>
                  <div className='flex flex-row gap-2 justify-center mt-2'>
                    <Button
                      size='sm'
                      className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 button-gradient'
                      onClick={() => setAddCreditsModalOpen(true)}
                    >
                      <CirclePlusIcon className='h-4 w-4' />
                      Add
                    </Button>
                    <Button
                      size='sm'
                      className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 button-gradient'
                      onClick={() => setRedeemCreditsModalOpen(true)}
                    >
                      <CircleMinusIcon className='h-4 w-4' />
                      Redeem
                    </Button>
                  </div>
                  {isAddCreditsModalOpen && (
                    <Dialog
                      open={isAddCreditsModalOpen}
                      onOpenChange={setAddCreditsModalOpen}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle />
                        </DialogHeader>
                        <PurchaseCreditsForm
                          onSuccess={() => setAddCreditsModalOpen(false)}
                          onCancel={() => setAddCreditsModalOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  {isRedeemCreditsModalOpen && (
                    <Dialog
                      open={isRedeemCreditsModalOpen}
                      onOpenChange={setRedeemCreditsModalOpen}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle />
                        </DialogHeader>
                        <RedeemCreditsForm
                          onSuccess={() => setRedeemCreditsModalOpen(false)}
                          onCancel={() => setRedeemCreditsModalOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardContent className='p-6 text-center'>
              <TrendingUp className='h-8 w-8 text-blue-400 mx-auto mb-2' />
              <div className='text-2xl font-bold text-white'>
                {stats.totalSpent}
              </div>
              <div className='text-white/60 text-sm'>{tokenSymbol} Spent</div>
            </CardContent>
          </Card>
          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardContent className='p-6 text-center'>
              <Ticket className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
              <div className='text-2xl font-bold text-white'>
                {stats.totalTickets}
              </div>
              <div className='text-white/60 text-sm'>Total Tickets</div>
            </CardContent>
          </Card>
          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardContent className='p-6 text-center'>
              <Trophy className='h-8 w-8 text-green-400 mx-auto mb-2' />
              <div className='text-2xl font-bold text-white'>
                {stats.totalWins}
              </div>
              <div className='text-white/60 text-sm'>Wins</div>
            </CardContent>
          </Card>
        </div>
        <Card className='bg-white/10 backdrop-blur-md border-white/20'>
          <CardHeader>
            <CardTitle className='text-white flex items-center gap-2'>
              <Ticket className='h-5 w-5 text-white/70' />
              Your Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userEntriesLoading ? (
              <div className='flex items-center justify-center py-8'>
                <LoadingSpinner text='Loading your tickets...' />
              </div>
            ) : entries?.length > 0 ? (
              <div className='space-y-4'>
                {entries.map((entry) => {
                  return (
                    <div
                      key={`${entry.lotteryId}-${entry.createdAt}`}
                      className='flex items-center justify-between bg-white/5 rounded-lg p-4 cursor-pointer'
                      onClick={() => navigate(`/lottery/${entry.lotteryId}`)}
                    >
                      <div className='flex items-center space-x-3'>
                        <Ticket className='h-6 w-6 text-white/60' />
                        <div className='space-y-1'>
                          <h4 className='text-white font-medium'>
                            {entry.lottery.name}
                          </h4>
                          <p className='text-white/60 text-sm'>
                            {entry.entryCount} ticket
                            {entry.entryCount > 1 ? 's' : ''} • Purchased{' '}
                            {formatDate(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        {/* <Badge
                          className={`$'{
                            lottery.status === 'active'
                              ? 'bg-green-500'
                              : lottery.status === 'drawing'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                          } text-white`}
                        >
                          {lottery.status === 'active'
                            ? 'Active'
                            : lottery.status === 'drawing'
                              ? 'Drawing'
                              : 'Completed'}
                        </Badge> */}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='text-center py-8'>
                <Ticket className='h-12 w-12 text-white/40 mx-auto mb-4' />
                <p className='text-white/60'>No tickets purchased yet</p>
                <p className='text-white/40 text-sm'>
                  Join a lottery to get started!
                </p>
              </div>
            )}
            <PaginationControls
              page={userEntriesCurrentPage}
              limit={userEntriesCurrentLimit}
              total={userEntriesTotal}
              prevPage={() => {
                setUserEntriesPage((p) => Math.max(1, p - 1));
                userEntriesPrevPage();
              }}
              nextPage={() => {
                setUserEntriesPage((p) => p + 1);
                userEntriesNextPage();
              }}
              disabledPrev={userEntriesLoading || userEntriesCurrentPage === 1}
              disabledNext={
                userEntriesLoading ||
                userEntriesCurrentPage * userEntriesCurrentLimit >=
                  userEntriesTotal
              }
            />
          </CardContent>
        </Card>

        {/* Active Lotteries */}
        {/* <div className='space-y-6'>
          <h2 className='text-2xl font-bold text-white'>Available Lotteries</h2>
          {activeLotteries.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {activeLotteries.map((lottery) => (
                  <LotteryCard key={lottery.lotteryId} lottery={lottery} />
                ))}
              </div>
              <PaginationControls
                page={activePage}
                limit={activeLimit}
                total={activeTotal}
                prevPage={activePrevPage}
                nextPage={activeNextPage}
                disabledPrev={loading}
                disabledNext={loading}
              />
            </>
          ) : (
            <div className='text-center py-8'>
              <p className='text-white/60'>No active lotteries at the moment</p>
            </div>
          )}
        </div> */}

        {/* Completed Lotteries */}
        {/* <div className='space-y-6'>
          <h2 className='text-2xl font-bold text-white'>Completed Lotteries</h2>
          {completedLotteries.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {completedLotteries.map((lottery) => (
                  <LotteryCard key={lottery.lotteryId} lottery={lottery} />
                ))}
              </div>
              <PaginationControls
                page={completedPage}
                limit={completedLimit}
                total={completedTotal}
                prevPage={completedPrevPage}
                nextPage={completedNextPage}
                disabledPrev={completedLotteriesLoading}
                disabledNext={completedLotteriesLoading}
              />
            </>
          ) : (
            <div className='text-center py-8'>
              <p className='text-white/60'>
                No completed lotteries at the moment
              </p>
            </div>
          )}
        </div> */}
      </div>
    </AuthPageWrapper>
  );
}
