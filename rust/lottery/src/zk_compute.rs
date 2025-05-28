/// ZK computation module for lottery winner selection
use create_type_spec_derive::CreateTypeSpec;
use pbc_contract_common::address::Address;
use pbc_zk::*;

const VARIABLE_KIND_DISCRIMINANT_ENTRY: u8 = 1;
const VARIABLE_KIND_DISCRIMINANT_WINNER: u8 = 2;

#[repr(C)]
#[derive(read_write_state_derive::ReadWriteState, Debug, Clone)]
pub struct LotteryEntryMetadata {
    pub lottery_id: u8,
    pub player: Address,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
pub struct WinnerResult {
    pub lottery_id: u8,
    pub winner_address: SecretVarId,
    pub entry_index: u64,
}

#[zk_compute(shortname = 0x44)]
pub fn select_lottery_winner(random_seed: u64, entries_count: u64, lottery_id: u8) -> WinnerResult {
    let winner_index = random_seed % entries_count;

    WinnerResult {
        lottery_id,
        winner_address: SecretVarId::new(0),
        entry_index: winner_index,
    }
}
