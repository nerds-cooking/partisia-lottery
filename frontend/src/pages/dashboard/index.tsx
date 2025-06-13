import LoadingSpinner from '@/components/LoadingSpinner';
import LotteryCard from '@/components/LotteryCard';
import { PaginationControls } from '@/components/Pagination';
import { useLotteries } from '@/components/providers/lottery/useLotteries';
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
import { useHasAccountOnChain } from '@/hooks/useHasAccountOnChain';
import { LotteryStatusD } from '@/lib/LotteryApiGenerated';
import {
  Badge,
  CircleMinusIcon,
  CirclePlusIcon,
  Clock,
  CoinsIcon,
  Loader,
  Plus,
  RotateCcw,
  Ticket,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { useState } from 'react';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userTickets] = useState([] as any[]); // suppress type error for now
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lotteries] = useState([] as any[]); // suppress type error for now
  const { settings } = useSettings();

  const {
    lotteries: activeLotteries,
    loading,
    page: activePage,
    limit: activeLimit,
    total: activeTotal,
    nextPage: activeNextPage,
    prevPage: activePrevPage
  } = useLotteries(1, 3, LotteryStatusD.Open);

  const {
    lotteries: completedLotteries,
    loading: completedLotteriesLoading,
    page: completedPage,
    limit: completedLimit,
    total: completedTotal,
    nextPage: completedNextPage,
    prevPage: completedPrevPage
  } = useLotteries(1, 3, LotteryStatusD.Complete);

  const tokenSymbol = settings?.find(
    (setting) => setting.name === 'tokenSymbol'
  )?.value;

  const {
    balance,
    loading: isBalanceLoading,
    error,
    refresh
  } = useCreditsBalance();

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
                </>
              )}
            </CardContent>
          </Card>
          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardContent className='p-6 text-center'>
              <Trophy className='h-8 w-8 text-green-400 mx-auto mb-2' />
              <div className='text-2xl font-bold text-white'>0</div>
              <div className='text-white/60 text-sm'>Wins</div>
            </CardContent>
          </Card>
          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardContent className='p-6 text-center'>
              <TrendingUp className='h-8 w-8 text-blue-400 mx-auto mb-2' />
              <div className='text-2xl font-bold text-white'>{0}</div>
              <div className='text-white/60 text-sm'>{tokenSymbol} Spent</div>
            </CardContent>
          </Card>
          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardContent className='p-6 text-center'>
              <Clock className='h-8 w-8 text-yellow-400 mx-auto mb-2' />
              <div className='text-2xl font-bold text-white'>{0}</div>
              <div className='text-white/60 text-sm'>Active Entries</div>
            </CardContent>
          </Card>
        </div>
        <Card className='bg-white/10 backdrop-blur-md border-white/20'>
          <CardHeader>
            <CardTitle className='text-white'>Your Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {userTickets.length > 0 ? (
              <div className='space-y-4'>
                {userTickets.map((ticket) => {
                  const lottery = lotteries.find(
                    (l) => l.id === ticket.lotteryId
                  );
                  if (!lottery) return null;

                  return (
                    <div
                      key={`${ticket.lotteryId}-${ticket.purchaseTime}`}
                      className='flex items-center justify-between bg-white/5 rounded-lg p-4'
                    >
                      <div className='space-y-1'>
                        <h4 className='text-white font-medium'>
                          {lottery.name}
                        </h4>
                        <p className='text-white/60 text-sm'>
                          {ticket.quantity} ticket
                          {ticket.quantity > 1 ? 's' : ''} • Purchased{' '}
                          {ticket.purchaseTime.toLocaleDateString()}
                        </p>
                      </div>
                      <div className='text-right'>
                        <Badge
                          className={`${
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
                        </Badge>
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
          </CardContent>
        </Card>

        {/* Active Lotteries */}
        <div className='space-y-6'>
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
        </div>

        {/* Completed Lotteries */}
        <div className='space-y-6'>
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
        </div>
      </div>
    </AuthPageWrapper>
  );
}
