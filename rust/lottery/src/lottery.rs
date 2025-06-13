//! This module contains the core data structures for the lottery system.
//! It defines the lottery state, status transitions, and related types
//! used throughout the contract.

use create_type_spec_derive::CreateTypeSpec;
use read_write_state_derive::ReadWriteState;

use pbc_contract_common::address::Address;
use pbc_contract_common::zk::SecretVarId;

/// Unique identifier for lottery instances.
/// Using u128 to ensure sufficient capacity for all future lotteries.
pub type LotteryId = u128;

/// Status of the lottery at any point in time
#[derive(CreateTypeSpec, ReadWriteState, PartialEq, Clone, Debug)]
pub enum LotteryStatus {
    /// Lottery is pending payment by the creator
    #[discriminant(1)]
    Pending {},

    /// Lottery is open and accepting anonymous entries
    #[discriminant(2)]
    Open {},

    /// Entry period has closed, winner selection in progress
    #[discriminant(3)]
    Closed {},

    /// Winner has been selected
    #[discriminant(4)]
    Drawn {},

    /// Winner has claimed their prize
    #[discriminant(5)]
    Complete {},
}

/// Represents the complete state of a lottery instance.
///
/// This structure maintains all data related to a single lottery, including
/// its configuration, current status, participants, and outcome information.
#[derive(ReadWriteState, Debug, CreateTypeSpec, Clone)]
pub struct LotteryState {
    /// Unique identifier for this lottery instance
    pub lottery_id: LotteryId,

    /// Address of the account that created this lottery
    pub creator: Address,

    /// Current status of the lottery in its lifecycle
    pub status: LotteryStatus,

    /// Unix timestamp representing when the lottery entry period closes
    pub deadline: i64,

    /// Address of the winning participant (if drawn)
    pub winner: Option<Address>,

    /// Cost to enter the lottery
    pub entry_cost: u128,

    /// Total amount of tokens in the prize pool
    pub prize_pool: u128,

    /// Reference to the secret state for this lottery maintained via MPC
    pub secret_state_id: Option<SecretVarId>,

    /// Temporary storage for secret state during operations
    /// Secret var ID is stored in pending while we confirm if an interaction was successful or not
    /// so not to overwrite valid state when errors occur
    pub pending_secret_state_id: Option<SecretVarId>,

    /// Index of the winning ticket (once drawn)
    pub winner_index: Option<u128>,
}
