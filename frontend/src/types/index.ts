export interface Lottery {
  id: string
  name: string
  description: string
  prizePool: number
  ticketPrice: number
  participants: number
  status: "active" | "drawing" | "completed"
  createdAt: Date
  endTime: Date
  winner?: {
    address: string
    ticketNumber: number
    drawTime: Date
    proofHash?: string
  }
}

export interface UserTicket {
  lotteryId: string
  quantity: number
  purchaseTime: Date
  ticketNumbers: number[]
}

export interface MPCNode {
  id: string
  name: string
  status: "online" | "offline"
  contribution: string
}

export interface DrawResult {
  lotteryId: string
  winningNumber: number
  winnerAddress: string
  proofHash: string
  timestamp: Date
  mpcNodes: MPCNode[]
}
