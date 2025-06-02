// /// ZK computation module for lottery winner selection
// use create_type_spec_derive::CreateTypeSpec;
// use pbc_zk::*;

// const VARIABLE_KIND_DISCRIMINANT_ENTRY: u8 = 1;
// const VARIABLE_KIND_DISCRIMINANT_WINNER: u8 = 2;

// const ACCOUNT_KIND_DISCRIMINANT_USER: u8 = 1;
// const ACCOUNT_KIND_DISCRIMINANT_LOTTERY: u8 = 2;

// // Can represent a user account OR a lottery account
// type AccountKey = Sbu128;
// type AccountTokenBalance = Sbu128;

// // Account balance for a user or a lottery
// #[derive(Debug, Clone, CreateTypeSpec, SecretBinary)]
// pub struct AccountBalance {
//     pub account_key: AccountKey,
//     pub balance: AccountTokenBalance,
// }
// // Metadata for account balance
// #[repr(C)]
// #[derive(read_write_state_derive::ReadWriteState, Debug, Clone)]
// pub struct AccountBalanceMetadata {
//     /// Discriminant to identify the kind of account
//     pub kind: u8
// }

// /// Secret-shared information for creating new users (used for input on account creation).
// #[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
// pub struct AccountSecret {
//     /// Secret-shared key used to transfer to the user that is being created.
//     recipient_key: AccountKey,
// }


// // User creates an account
// // User tops up account (with ERC20) receive credits
// // User enters lottery with credits, which are transferred to the lottery account
// // User can withdraw credits from their account but lottery credits are non refundable unless lottery is cancelled
// // Lottery creator can cancel the lottery if minimum entries are not met
// // Lottery winner is selected based on a seed generated from entropy provided by lottery creator AND each participant
// // Lottery winner is revealed and can withdraw their winnings



// // OLD

// // #[repr(C)]
// // #[derive(read_write_state_derive::ReadWriteState, Debug, Clone)]
// // pub struct LotteryEntryMetadata {
// //     pub lottery_id: u8
// // }

// // #[repr(C)]
// // #[derive(Debug, Clone, Copy, CreateTypeSpec)]
// // pub struct WinnerResult {
// //     pub lottery_id: u8,
// //     pub entry_index: u32,
// // }

// // #[zk_compute(shortname = 0x44)]
// // pub fn select_lottery_winner(
// //     random_seed: u32,
// //     entries_count: u32,
// //     lottery_id: u8
// // ) -> Sbu32 {
// //     let winner_index = u32::max(0, ((random_seed & entries_count as u32) as u32) - 1);



// //     // Pick the winner variable
// //     // let winner_variable = find_lottery_entry_variable(lottery_id, winner_index).expect("Winner variable not found");

// //     Sbu32::from(winner_variable.raw_id)


// //     // If no matching variable is found, return a default or error value
// //     // panic!("No matching SecretVarId found for the given lottery_id and winner_index");


// //     // let mut entry_ids = secret_variable_ids()
// //     //     .filter_map(|id| {
// //     //         // Grab the correct variable kind
// //     //         let var_kind = load_metadata::<u8>(id);

// //     //         if var_kind == VARIABLE_KIND_DISCRIMINANT_WINNER {
// //     //             let metadata: LotteryEntryMetadata = load_metadata(id);
// //     //             if metadata.lottery_id == lottery_id {
// //     //                 Some(id)
// //     //             } else {
// //     //                 None
// //     //             }
// //     //         } else {
// //     //             None
// //     //         }
// //     //     })
// //     //     .filter_map(|id| {
// //     //         let var = load_metadata::<LotteryEntryMetadata>(id);

// //     //         if var.lottery_id == lottery_id {
// //     //             Some(id)
// //     //         } else {
// //     //             None
// //     //         }
// //     //     });

// //     // let winner_var = entry_ids.nth(winner_index as usize).expect("Winner variable not found");

// //     // (winner_var)

// //     // WinnerResult {
// //     //     lottery_id,
// //     //     entry_index: winner_index,
// //     // }
// // }


// // fn find_lottery_entry_variable(
// //     lottery_id: u8,
// //     entry_index: u32
// // ) -> Option<SecretVarId> {
// //     let mut cidx = 0;

// //     for variable_id in secret_variable_ids() {
// //         let var_kind = load_metadata::<u8>(variable_id);

// //         if var_kind == VARIABLE_KIND_DISCRIMINANT_ENTRY {
// //             let metadata: LotteryEntryMetadata = load_metadata(variable_id);
// //             if metadata.lottery_id == lottery_id {
// //                 if cidx == entry_index {


// //                     let a = Sbu32::from(1);

// //                     a.le


// //                     return Some(variable_id);
// //                 } else {
// //                     cidx += 1;
// //                 }
// //             }
// //         }
// //     }

// //     None
// // }