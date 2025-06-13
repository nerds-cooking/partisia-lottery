# Partisia Private Lottery System

A decentralized lottery platform built on the Partisia Blockchain, leveraging Multi-Party Computation (MPC) for enhanced privacy and fairness in lottery operations.

## Overview

This project demonstrates how MPC technology can be applied to create a fully private, transparent, and fair lottery system where:

- Participant identities remain hidden (to a degree)
- Lottery operations are secure and tamper-proof
- Entry ticket counts are kept private
- Winner selection is verifiably random and cannot be manipulated
- Users maintain complete ownership of their tokens

## Components

### 1. Smart Contract

The core of the system is a Rust-based smart contract designed for the Partisia Blockchain, featuring:

- **MPC-Based Privacy**: Uses advanced multi-party computation for privacy-preserving operations
- **Stateful Lottery Management**: Tracks lottery lifecycle from creation through winner selection
- **Token Integration**: Works with MPC20 tokens for payments and prize distribution

#### Development and Deployment

- To run smart contract tests:

```bash
./java-run-tests.sh
```

- To build the contract:

```bash
cd rust
cargo partisia-contract build --release
```

🗂 **Build Output:**  
Located in `target/wasm32-unknown-unknown/release/`

📤 **Deployment:**  
Use the [Partisia Testnet Explorer](https://browser.testnet.partisiablockchain.com/contracts/deploy)  
Upload the `lottery.abi` and `lottery.zkwa` files for deployment.

### 2. API Server

The backend API serves as the bridge between the frontend application and the blockchain:

- Handles user authentication and session management
- Processes lottery-related requests and communicates with the blockchain
- Manages user profiles and preferences

### 3. Frontend Application

The user interface provides an intuitive experience for interacting with the lottery system:

- Modern React-based interface with responsive design
- Parti wallet integration for transactions
- Visualization of lottery statistics and history

### User Flows

The Partisia Lottery system is designed to provide a secure, private, and fair lottery experience using MPC (Multi-Party Computation) technology. Below are the key user flows that describe how participants interact with the system.

#### Create an Account

![Create Account Flow](./doc-img/create_account.jpg)

This flow represents the initial onboarding process:

- Users create a private account secured by MPC to maintain privacy
- During account creation, a secret balance is generated and split securely across the MPC network
- This account links the user's public address with their private balance information
- ~~No one (not even the contract owner) can see the user's balance or transaction details~~ Due to a limitation in Parti wallet, this is currently not possible. We've had to work around this by using an API key that is able to read balances. Once Parti wallet supports reading secrets effectively, this can be enabled. Logic has been tested and implemented for this, just not enabled in the current version.
- Account creation requires a one-time setup but ensures all future interactions preserve privacy

#### Purchase Credits

![Purchase Credits Flow](./doc-img/purchase_credits.jpg)

Users need credits to participate in lottery activities:

- Credits are purchased using MPC20 tokens (Partisia's equivalent of ERC20)
- Funds are transferred from user's wallet to the lottery contract
- The contract creates a private credit balance for the user
- All balance updates occur under MPC protection, keeping user activity confidential
- Although the user's balance is private, because we're taking funds from an MPC20 contract there is a public record of how many tokens were transferred. Privacy around balances is more focused on limiting the visibility of how many lottery tickets a user has purchased.

#### Redeem Credits

![Redeem Credits Flow](./doc-img/redeem_credits.jpg)

Users can withdraw their credits back to tokens when desired:

- The redemption process converts private credits back to public MPC20 tokens
- Users specify the amount they wish to redeem
- MPC protocol verifies sufficient balance without revealing the full balance
- After verification, tokens are released back to the user's wallet
- The private balance is updated accordingly

#### Create a Lottery

![Create a Lottery Flow](./doc-img/create_a_lottery.jpg)

Any user can create their own lottery:

- Creator specifies parameters including entry cost and deadline
- Creator deposits initial funds to cover minimum prize pool
- A unique lottery ID is generated to track this specific lottery instance
- The lottery begins in "Pending" status until parameters are confirmed
- Once funded, status changes to "Open" and it becomes available for ticket purchases
- All lottery data is stored in the contract, with private elements secured by MPC

#### Purchase Lottery Tickets

![Purchase Lottery Tickets Flow](./doc-img/purchase_lottery_tickets.jpg)

Participants can enter any open lottery:

- Users select an open lottery and purchase tickets using their credits
- The ticket purchase is processed privately using MPC
- Neither other participants nor the lottery creator can how many tickets a user has purchased
- Entry records are stored as private variables in the contract
- The prize pool updates with each entry, while maintaining privacy of individual participants

#### Draw Lottery Winner

![Draw Lottery Winner Flow](./doc-img/draw_a_lottery.jpg)

When a lottery closes, a winner is selected:

- The lottery will not allow drawing a winner until the deadline has passed. Once the deadline has passed, the creator can initiate the draw.
- A secure random selection process runs within the MPC environment
- Winner selection combines entropy from multiple sources to ensure fairness
  - Due to MPC limitations, the draw requires the entropy to be published so a modulus operation can be performed on the public chain. Doing so on the MPC nodes is not possible due to the ZK Circuit loop limitations and gas concerns blocking these kinds of heavy operations from occurring.
- The MPC protocol reveals only the winning entry, not the full participant list
- The lottery status updates to "Drawn" with the winner address recorded
- All credits (excluding the pool itself) are sent to the creator's account at this point, and enables the ability for the winner to claim their winnings.

#### Claim Winnings

![Claim Winnings Flow](./doc-img/claim_winnings.jpg)

The winner can claim their prize:

- MPC protocol verifies the winner's identity without revealing other entries
- Upon successful verification, the prize pool is transferred to the winner
- The private credit balance of the winner is updated accordingly
- The lottery status changes to "Complete" after successful prize distribution
- All transactions maintain privacy through MPC technology

### Privacy and Security Features

Our lottery implementation leverages Partisia Blockchain's MPC capabilities to ensure:

1. **Participant Privacy**: No one can see how many tickets a user has purchased. Unfortunately, due to the state changes that occur when purchasing it is possible to be inferred which lottery a user has entered, but not how many tickets they have purchased.
2. **Fair Winner Selection**: Random selection that cannot be manipulated. Entropy is gathered from the lottery creator and all participants secretly, ensuring that the winner is chosen fairly and transparently.
3. **Secure Balance Management**: User credit balances remain private
4. **Tamper-Proof Operations**: All contract operations are secured by blockchain consensus
5. **Transaction Confidentiality**: Financial details remain private throughout the process

## Technical Architecture

### Smart Contract Structure

The lottery contract consists of several key components:

- **LotteryState**: Central data structure tracking lottery instances and their statuses
- **ZK Computation Engine**: Handles private computations for credit and ticket purchases and winner selection
- **MPC20 Integration**: Interfaces with token contracts for financial operations
- **State Transitions**: Manages the lottery lifecycle through well-defined states (Pending → Open → Closed → Drawn → Complete)

### Privacy-Preserving Technologies

This implementation uses several advanced cryptographic techniques:

- **Multi-Party Computation (MPC)**: Allows computations on encrypted data without revealing the data itself
- **Secret State Management**: Maintains confidential contract state that even node operators cannot see
- **Secure Random Number Generation**: A combination of entropy sources ensures randomness in winner selection. All individual entries would need to be known in order to manipulate the outcome, which is not possible due to the privacy-preserving nature of the MPC.

## Getting Started

### Prerequisites

- Node.js 16+ and Yarn
- Rust toolchain with Partisia WASM target
- Partisia Contract SDK
- Docker and Docker Compose (for local development)

### Development Setup

#### **Clone the repository**

```bash
git clone https://github.com/nerds-cooking/partisia-lottery.git
cd partisia-lottery
```

#### API

```bash
cd api
yarn install
```

- Copy `.env.example` to `.env` and configure the values (you may use example values for testing).
- To run in development mode:

```bash
yarn start:dev
```

- To run in production mode:

```bash
yarn build
yarn migrate       # Run initial database migrations
yarn start:prod
```

🔧 **MongoDB Setup:**

- Start MongoDB via Docker (see below).
- Note: The API expects MongoDB to run on port `27011`. Adjust your `.env` file accordingly.

#### Frontend

```bash
cd frontend
yarn install
```

- Copy `.env.example` to `.env` and update values as needed.
- To start the frontend in development:

```bash
yarn dev
```

- To build for production:

```bash
yarn build
cp -R dist/* /var/www/lottery-fe  # Or your preferred hosting path
```

#### **Generate TypeScript bindings from contract ABI**

```bash
./ts-abi-codegen.sh
```

Visit `http://localhost:5173` to access the application.

## 🐳 MongoDB with Docker

Start MongoDB:

```bash
docker compose up -d
```

Stop MongoDB:

```bash
docker compose down
```

> **Note:** MongoDB runs on port `27011` by default in this setup. Be sure your `.env` connection string reflects this.

---
