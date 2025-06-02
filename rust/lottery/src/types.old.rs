// extern crate pbc_contract_codegen;
// extern crate pbc_contract_common;

// use create_type_spec_derive::CreateTypeSpec;
// use pbc_contract_common::{
//     address::Address,
//     avl_tree_map::{AvlTreeMap, AvlTreeSet},
//     zk::SecretVarId,
// };
// use pbc_zk::Sbi8;
// use read_write_state_derive::ReadWriteState;

// pub const MAX_ENTRANTS: usize = 100;
// pub type EntriesArr = [Sbi8; MAX_ENTRANTS];

// /// Status of the lottery at any point in time
// #[derive(CreateTypeSpec, ReadWriteState, PartialEq, Clone, Debug)]
// pub enum LotteryStatus {
//     /// Lottery has been created but not accepting entries yet
//     #[discriminant(1)]
//     Pending {},

//     /// Lottery is open and accepting anonymous entries
//     #[discriminant(2)]
//     Open {},

//     /// Entry period has closed, winner selection in progress
//     #[discriminant(3)]
//     Closed {},

//     /// Winner has been revealed and lottery is finalized
//     #[discriminant(4)]
//     Complete {},
// }

// /// Kind of secret or revealed data stored
// #[derive(ReadWriteState, Debug, Clone, CreateTypeSpec)]
// pub enum VariableKind {
//     /// An anonymous entry in the lottery
//     #[discriminant(1)]
//     Entry { lottery_id: u8, player: Address },

//     /// Revealed winner after selection
//     #[discriminant(2)]
//     Winner { lottery_id: u8 },
// }

// /// Kind of secret or revealed data stored
// #[derive(ReadWriteState, Debug, Clone, CreateTypeSpec)]
// pub enum AccountKind {
//     /// User account type
//     #[discriminant(1)]
//     User {},

//     /// Lottery account type
//     #[discriminant(2)]
//     Lottery { lottery_id: u8 },
// }

// /// Main state object for a lottery instance - this should NOT be used directly
// /// Only included for backward compatibility with existing code
// /// See the implementation in the main contract file instead
// #[derive(ReadWriteState, Debug, CreateTypeSpec)]
// pub struct LotteryState {
//     /// Unique ID for the lottery
//     pub lottery_id: u8,

//     /// Creator of the lottery
//     pub creator: Address,

//     /// Current status of the lottery
//     pub status: LotteryStatus,

//     /// Deadline timestamp (ms since epoch) for entries
//     pub deadline: i64,

//     pub token_address: Address,

//     pub entry_cost: u128, // Changed from u64 to u128 to match main contract

//     pub entries_svars: Vec<SecretVarId>,

//     // pub entry_counts: AvlTreeMap<Address, u32>,

//     pub winner: Option<Address>,

//     // Added new fields from main contract
//     pub entries: Vec<Entry>,
//     pub prize_pool: u128,
//     pub winner_svar_id: Option<SecretVarId>,
// }

// // Added Entry struct to match main contract
// #[derive(ReadWriteState, Debug, CreateTypeSpec)]
// pub struct Entry {
//     pub secret_var_id: SecretVarId,
//     pub 
// }
