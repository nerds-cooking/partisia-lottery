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

/// Compute function to select a winner from lottery entries
/// Takes a seed for randomness and a list of entry variable IDs
#[zk_compute(shortname = 0x44)]
pub fn select_lottery_winner(random_seed: u64, entries_count: u64, lottery_id: u8) -> WinnerResult {
    // Calculate winner index using the random seed modulo the number of entries
    let winner_index = random_seed % entries_count;

    // In a real implementation, we would load the actual entry at this index
    // For simplicity in this example, we just return the index
    // The actual address would be looked up in the contract

    WinnerResult {
        lottery_id,
        winner_address: SecretVarId::new(0),
        entry_index: winner_index,
    }
}

// Alternative implementation if we want to pass all entries as secret variables
#[zk_compute(shortname = 0x45)]
pub fn select_winner_from_entries(
    random_seed: u64,
    lottery_id: u8,
    entries: [SecretVarId; 10], // Replace 10 with the appropriate fixed size
) -> WinnerResult {
    // Calculate the winner index
    let entries_count = entries.len() as u64; // Fixed-size arrays have a known length
    let winner_index = random_seed % entries_count;

    // Get the metadata for the winning entry
    let winner_var_id = entries[winner_index as usize];
    let winner_metadata = load_metadata::<LotteryEntryMetadata>(winner_var_id);

    WinnerResult {
        lottery_id,
        winner_address: SecretVarId::from(winner_var_id),
        entry_index: winner_index,
    }
}
