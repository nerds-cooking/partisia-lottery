import type { Lottery } from '../types';

export const mockLotteries: Lottery[] = [
  {
    id: '1',
    name: 'Weekly Mega Draw',
    description:
      'Our biggest weekly lottery with massive prizes. Join thousands of participants for a chance to win big!',
    prizePool: 50000,
    ticketPrice: 10,
    participants: 1247,
    status: 'active',
    createdAt: new Date('2024-01-15'),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: 'Daily Quick Pick',
    description:
      'Fast-paced daily lottery with instant results. Perfect for those who want quick excitement!',
    prizePool: 5000,
    ticketPrice: 2,
    participants: 342,
    status: 'active',
    createdAt: new Date('2025-01-20'),
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: 'Premium Jackpot',
    description:
      'Exclusive high-stakes lottery for serious players. Higher entry fee, bigger rewards!',
    prizePool: 100000,
    ticketPrice: 50,
    participants: 89,
    status: 'active',
    createdAt: new Date('2024-01-10'),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '4',
    name: 'New Year Special',
    description:
      'Special celebration lottery that concluded with amazing prizes for the community!',
    prizePool: 25000,
    ticketPrice: 5,
    participants: 2156,
    status: 'completed',
    createdAt: new Date('2024-01-01'),
    endTime: new Date('2024-01-07'),
    winner: {
      address: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4e4C4e4',
      ticketNumber: 123456,
      drawTime: new Date('2024-01-07T20:00:00Z'),
      proofHash:
        '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
    }
  },
  {
    id: '5',
    name: 'Community Lottery',
    description:
      'A completed community-driven lottery that brought everyone together for a great cause.',
    prizePool: 15000,
    ticketPrice: 3,
    participants: 987,
    status: 'completed',
    createdAt: new Date('2024-01-12'),
    endTime: new Date('2024-01-19'),
    winner: {
      address: '0x123abc456def789012345678901234567890abcd',
      ticketNumber: 789012,
      drawTime: new Date('2024-01-19T18:30:00Z'),
      proofHash:
        '0xfedcba0987654321098765432109876543210987654321098765432109876543'
    }
  }
];
