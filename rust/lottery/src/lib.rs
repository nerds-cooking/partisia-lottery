#![allow(unused_variables)]
#![allow(unused_imports)]

#[macro_use]
extern crate pbc_contract_codegen;
extern crate pbc_contract_common;

use std::vec;

use create_type_spec_derive::CreateTypeSpec;
use pbc_contract_common::address::Address;
use pbc_contract_common::address::AddressType;
use pbc_contract_common::address::Shortname;
use pbc_contract_common::address::ShortnameCallback;
use pbc_contract_common::address::ShortnameZkVariableInputted;
use pbc_contract_common::avl_tree_map::{AvlTreeMap, AvlTreeSet};
use pbc_contract_common::context::{self, CallbackContext, ContractContext};
use pbc_contract_common::events::EventGroup;
use pbc_contract_common::zk::ZkClosed;
use pbc_contract_common::zk::{SecretVarId, ZkInputDef, ZkState, ZkStateChange};
use pbc_zk::Sbi8;
use pbc_zk::SecretBinary;
use read_write_rpc_derive::ReadWriteRPC;
use read_write_state_derive::ReadWriteState;
mod zk_compute;
use zk_compute::{select_lottery_winner, WinnerResult};

mod types;
use types::{EntriesArr, LotteryStatus, VariableKind, MAX_ENTRANTS};

#[derive(ReadWriteState, Debug, CreateTypeSpec)]
pub struct Entry {
    pub address: Address,
    pub secret_var_id: SecretVarId,
}

#[derive(ReadWriteState, Debug, CreateTypeSpec)]
pub struct LotteryState {
    pub lottery_id: u8,
    pub creator: Address,
    pub entries: Vec<Entry>,
    pub status: LotteryStatus,
    pub deadline: i64,
    pub winner: Option<Address>,
    pub token_address: Address,
    pub entry_cost: u128,
    pub prize_pool: u128,
    pub random_seed: Option<SecretVarId>,
    pub entries_svars: Vec<SecretVarId>,
    pub entry_counts: AvlTreeMap<Address, u32>,
    pub winner_svar_id: Option<SecretVarId>,
}

impl LotteryState {
    pub fn new(
        lottery_id: u8,
        creator: Address,
        deadline: i64,
        token_address: Address,
        entry_cost: u128,
    ) -> Self {
        LotteryState {
            lottery_id,
            creator,
            entries: vec![],
            status: LotteryStatus::Pending {},
            deadline,
            winner: None,
            token_address,
            random_seed: None,
            entry_cost,
            prize_pool: 0,
            entries_svars: vec![],
            entry_counts: AvlTreeMap::new(),
            winner_svar_id: None,
        }
    }

    pub fn is_open(&self) -> bool {
        self.status == LotteryStatus::Open {}
    }

    pub fn is_closed(&self, current_time: i64) -> bool {
        current_time >= self.deadline && matches!(self.status, LotteryStatus::Open {})
    }

    pub fn open_entries(&mut self) {
        self.status = LotteryStatus::Open {};
    }

    pub fn close_entries(&mut self) {
        self.status = LotteryStatus::Closed {};
    }

    pub fn complete_entries(&mut self) {
        self.status = LotteryStatus::Complete {};
    }

    pub fn add_entry(&mut self, player: Address, svar: SecretVarId) {
        let current_count = match self.entry_counts.get(&player) {
            Some(count) => count,
            None => 0,
        };

        self.entries.push(Entry {
            address: player,
            secret_var_id: svar,
        });

        self.entry_counts.insert(player, current_count + 1);
        self.entries_svars.push(svar);

        // Increase prize pool with each entry
        self.prize_pool += self.entry_cost;
    }

    pub fn set_winner(&mut self, winner: Address, winner_svar_id: SecretVarId) {
        self.winner = Some(winner);
        self.winner_svar_id = Some(winner_svar_id);
        self.status = LotteryStatus::Complete {};
    }

    pub fn get_player_entry_count(&self, player: &Address) -> u32 {
        match self.entry_counts.get(player) {
            Some(count) => count,
            None => 0,
        }
    }

    pub fn total_entries(&self) -> usize {
        self.entries_svars.len()
    }
}
#[derive(Debug)]
#[repr(C)]
#[state]
pub struct ContractState {
    lottery_ids: AvlTreeSet<u8>,
    lotteries: Vec<LotteryState>,
    contract_owner: Address,
    contract_balance: AvlTreeMap<Address, u128>,
}

impl ContractState {
    pub fn new(owner: Address) -> Self {
        ContractState {
            lottery_ids: AvlTreeSet::new(),
            lotteries: vec![],
            contract_owner: owner,
            contract_balance: AvlTreeMap::new(),
        }
    }

    pub fn has_lottery_id(&self, lottery_id: u8) -> bool {
        self.lottery_ids.contains(&lottery_id)
    }

    pub fn add_lottery(&mut self, lottery: LotteryState) {
        self.lottery_ids.insert(lottery.lottery_id);
        self.lotteries.push(lottery);
    }

    pub fn get_lottery_mut(&mut self, lottery_id: u8) -> Option<&mut LotteryState> {
        self.lotteries
            .iter_mut()
            .find(|lottery| lottery.lottery_id == lottery_id)
    }

    pub fn get_lottery(&self, lottery_id: u8) -> Option<&LotteryState> {
        self.lotteries
            .iter()
            .find(|lottery| lottery.lottery_id == lottery_id)
    }

    pub fn get_lottery_with_index_mut(&mut self, lottery_id: u8) -> (usize, &mut LotteryState) {
        assert!(self.lottery_ids.contains(&lottery_id), "unknown lottery id");

        let idx = self
            .lotteries
            .iter()
            .position(|x| x.lottery_id == lottery_id)
            .expect("failed to find idx");

        let lottery_state = &mut self.lotteries[idx];

        (idx, lottery_state)
    }

    pub fn add_to_balance(&mut self, token_address: Address, amount: u128) {
        let current_balance = match self.contract_balance.get(&token_address) {
            Some(balance) => balance,
            None => 0,
        };
        self.contract_balance
            .insert(token_address, current_balance + amount);
    }

    pub fn withdraw_from_balance(&mut self, token_address: Address, amount: u128) -> u128 {
        let current_balance = match self.contract_balance.get(&token_address) {
            Some(balance) => balance,
            None => 0,
        };

        assert!(current_balance >= amount, "Insufficient balance");

        let new_balance = current_balance - amount;
        self.contract_balance.insert(token_address, new_balance);

        amount
    }
}

#[init(zk = true)]
pub fn initialize(context: ContractContext, _zk_state: ZkState<VariableKind>) -> ContractState {
    ContractState::new(context.sender)
}

#[repr(C)]
#[derive(Clone, Copy, CreateTypeSpec, ReadWriteRPC)]
pub struct LotteryInitParams {
    pub lottery_id: u8,
    pub lottery_deadline: i64,
    pub token_address: Address,
    pub entry_cost: u128,
    pub fee_recipient: Address,
}

#[action(zk = true, shortname = 0x40)]
pub fn new_lottery(
    context: ContractContext,
    mut state: ContractState,
    _zk_state: ZkState<VariableKind>,
    params: LotteryInitParams,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    assert!(
        context.block_production_time < params.lottery_deadline,
        "Lottery end must be in the future"
    );
    assert!(
        !state.has_lottery_id(params.lottery_id),
        "lottery id already used"
    );

    // Change to secret input for the random seed

    let mut lottery_state = LotteryState::new(
        params.lottery_id,
        context.sender,
        params.lottery_deadline,
        params.token_address,
        params.entry_cost,
    );

    lottery_state.open_entries();
    state.add_lottery(lottery_state);

    (state, vec![], vec![])
}

#[repr(C)]
#[derive(Clone, Copy, CreateTypeSpec, ReadWriteRPC)]
pub struct EntryParams {
    pub lottery_id: u8,
}

#[inline]
fn token_contract_transfer_from() -> Shortname {
    Shortname::from_u32(0x03)
}

#[zk_on_secret_input(shortname = 0x41)]
pub fn submit_entry(
    context: ContractContext,
    state: ContractState,
    _zk_state: ZkState<VariableKind>,
    params: EntryParams,
) -> (
    ContractState,
    Vec<EventGroup>,
    ZkInputDef<VariableKind, EntriesArr>,
) {
    let lottery_id = params.lottery_id;
    let lottery_state = state.get_lottery(lottery_id).expect("Lottery not found");

    assert!(lottery_state.is_open(), "Lottery not open");
    assert!(
        context.block_time < lottery_state.deadline,
        "Lottery deadline has passed"
    );

    let mut event_group = EventGroup::builder();

    event_group
        .call(lottery_state.token_address, token_contract_transfer_from())
        .argument(context.sender)
        .argument(context.contract_address)
        .argument(lottery_state.entry_cost)
        .done();

    let input_def = ZkInputDef::with_metadata(
        Some(SHORTNAME_ENTRY_SUBMITTED),
        VariableKind::Entry {
            lottery_id,
            player: context.sender,
        },
    );

    (state, vec![event_group.build()], input_def)
}

#[callback(zk = true, shortname = 0x52)]
pub fn entry_payment_callback(
    _context: ContractContext,
    callback_ctx: CallbackContext,
    state: ContractState,
    _zk_state: ZkState<VariableKind>,
    _lottery_id: u8,
) -> (ContractState, Vec<EventGroup>) {
    if !callback_ctx.success {
        panic!("Token transfer failed for lottery entry");
    }

    (state, vec![])
}

#[zk_on_variable_inputted(shortname = 0x51)]
pub fn entry_submitted(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    entry_svar_id: SecretVarId,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let entry_metadata = zk_state.get_variable(entry_svar_id).unwrap();

    match entry_metadata.metadata {
        VariableKind::Entry { lottery_id, player } => {
            let (_, lottery_state) = state.get_lottery_with_index_mut(lottery_id);
            assert!(lottery_state.is_open(), "Lottery not open");

            lottery_state.add_entry(player, entry_svar_id);
        }
        _ => panic!("Unexpected metadata type!"),
    }
    (state, vec![], vec![])
}

#[action(zk = true, shortname = 0x42)]
pub fn draw_lottery(
    context: ContractContext,
    mut state: ContractState,
    _zk_state: ZkState<VariableKind>,
    lottery_id: u8,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let (_, lottery_state) = state.get_lottery_with_index_mut(lottery_id);

    assert!(lottery_state.is_open(), "Lottery not open");
    // assert!(
    //     context.block_time >= lottery_state.deadline,
    //     "Lottery deadline has not passed yet"
    // );
    assert!(
        lottery_state.total_entries() > 0,
        "No entries in the lottery"
    );

    let random_seed = context.block_time as u64;

    let winner_result = select_lottery_winner(
        random_seed,
        lottery_state.total_entries() as u64,
        lottery_id,
    );

    (state, vec![], vec![])
}

#[zk_on_compute_complete(shortname = 0x46)]
pub fn on_winner_selected(
    _context: ContractContext,
    state: ContractState,
    _zk_state: ZkState<VariableKind>,
    output_variables: Vec<SecretVarId>,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    // We're opening the variables immediately to get the winner information
    // This is similar to the counting_complete function in the example contract
    (
        state,
        vec![],
        vec![ZkStateChange::OpenVariables {
            variables: output_variables,
        }],
    )
}

/// Processes the lottery winner information after the variables are opened
#[zk_on_variables_opened]
pub fn vars_opened(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    opened_variables: Vec<SecretVarId>,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let mut touched_lottery_id: u8 = 0;

    for i in 0..opened_variables.len() {
        let unwrapped_result_id = opened_variables.get(i).unwrap();
        let unwrapped_var = zk_state.get_variable(*unwrapped_result_id).unwrap();

        match unwrapped_var.metadata {
            VariableKind::Result { lottery_id, winner } => {
                touched_lottery_id = lottery_id;
                let (_, lottery_state) = state.get_lottery_with_index_mut(lottery_id);

                assert!(lottery_state.is_open(), "Lottery not open");

                // Assuming you have a function to parse the winner from the variable data
                let winner_address = read_variable_address(&unwrapped_var);

                lottery_state.set_winner(winner_address, *unwrapped_result_id);

                let amount = lottery_state.prize_pool;
                lottery_state.prize_pool = 0;
            }
            _ => panic!("Unexpected metadata type! {:?}", unwrapped_var.metadata),
        }
    }

    // Create event for transferring funds to the winner
    let (_, lottery_state) = state.get_lottery_with_index_mut(touched_lottery_id);
    let mut event_group = EventGroup::builder();
    event_group
        .call(lottery_state.token_address, token_contract_transfer_from())
        .argument(context.contract_address)
        .argument(lottery_state.winner)
        .argument(lottery_state.prize_pool)
        .done();

    (state, vec![event_group.build()], vec![])
}

fn read_variable_address(variable: &ZkClosed<VariableKind>) -> Address {
    // Access the data from the ZkClosed variable
    let data = variable.data.as_ref().unwrap();

    // Create an Address from the data bytes
    let mut identifier = [0u8; 20];
    identifier.copy_from_slice(&data[0..20]); // Take the first 20 bytes for the address

    Address {
        address_type: AddressType::Account, // Use the appropriate address type
        identifier,
    }
}
