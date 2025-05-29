'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Lottery, UserTicket } from '../types';
import { mockLotteries } from '../utils/mockData';

interface LotteryContextType {
  lotteries: Lottery[];
  userTickets: UserTicket[];
  purchaseTickets: (lotteryId: string, quantity: number) => Promise<void>;
  refreshLotteries: () => void;
}

const LotteryContext = createContext<LotteryContextType | undefined>(undefined);

export const useLottery = () => {
  const context = useContext(LotteryContext);
  if (!context) {
    throw new Error('useLottery must be used within a LotteryProvider');
  }
  return context;
};

interface LotteryProviderProps {
  children: React.ReactNode;
}

export const LotteryProvider: React.FC<LotteryProviderProps> = ({
  children
}) => {
  const [lotteries, setLotteries] = useState<Lottery[]>(mockLotteries);
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);

  const purchaseTickets = async (lotteryId: string, quantity: number) => {
    // Simulate transaction delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Add user ticket
    const newTicket: UserTicket = {
      lotteryId,
      quantity,
      purchaseTime: new Date(),
      ticketNumbers: Array.from({ length: quantity }, (_, i) =>
        Math.floor(Math.random() * 1000000)
      )
    };

    setUserTickets((prev) => [...prev, newTicket]);

    // Update lottery participant count
    setLotteries((prev) =>
      prev.map((lottery) =>
        lottery.id === lotteryId
          ? { ...lottery, participants: lottery.participants + 1 }
          : lottery
      )
    );

    // Store in localStorage
    const stored = localStorage.getItem('user_tickets');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem(
      'user_tickets',
      JSON.stringify([...existing, newTicket])
    );
  };

  const refreshLotteries = () => {
    // In a real app, this would fetch from the blockchain
    setLotteries(mockLotteries);
  };

  // Load user tickets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user_tickets');
    if (stored) {
      try {
        const tickets = JSON.parse(stored).map((ticket: any) => ({
          ...ticket,
          purchaseTime: new Date(ticket.purchaseTime)
        }));
        setUserTickets(tickets);
      } catch (error) {
        console.error('Error loading user tickets:', error);
      }
    }
  }, []);

  // Simulate lottery state changes
  useEffect(() => {
    const interval = setInterval(() => {
      setLotteries((prev) =>
        prev.map((lottery) => {
          // Check if lottery should end
          if (lottery.status === 'active' && new Date() > lottery.endTime) {
            // Simulate MPC draw
            const winner = {
              address: '0x' + Math.random().toString(16).substr(2, 40),
              ticketNumber: Math.floor(Math.random() * 1000000),
              drawTime: new Date(),
              proofHash:
                '0x' +
                Array.from({ length: 64 }, () =>
                  Math.floor(Math.random() * 16).toString(16)
                ).join('')
            };

            return {
              ...lottery,
              status: 'completed' as const,
              winner
            };
          }
          return lottery;
        })
      );
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const value: LotteryContextType = {
    lotteries,
    userTickets,
    purchaseTickets,
    refreshLotteries
  };

  return (
    <LotteryContext.Provider value={value}>{children}</LotteryContext.Provider>
  );
};
