use create_type_spec_derive::CreateTypeSpec;
use read_write_state_derive::ReadWriteState;

use pbc_contract_common::address::Address;
use pbc_contract_common::zk::SecretVarId;

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

#[derive(ReadWriteState, Debug, CreateTypeSpec, Clone)]
pub struct LotteryState {
    pub lottery_id: LotteryId,
    pub creator: Address,
    pub status: LotteryStatus,
    pub deadline: i64,
    pub winner: Option<Address>,
    pub entry_cost: u128,
    pub prize_pool: u128,

    pub secret_state_id: Option<SecretVarId>,
    // Secret var ID is stored in pending while we confirm if an interaction was successful or not
    // so not to overwrite valid state when errors occur
    pub pending_secret_state_id: Option<SecretVarId>,

    pub entries_svars: Vec<SecretVarId>,

    pub winner_index: Option<u128>
}

