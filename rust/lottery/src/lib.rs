#![allow(unused_variables)]
#![allow(unused_imports)]

#[macro_use]
extern crate pbc_contract_codegen;
extern crate pbc_contract_common;

use create_type_spec_derive::CreateTypeSpec;
use pbc_contract_common::address::Address;
use pbc_contract_common::avl_tree_map::AvlTreeSet;
use pbc_contract_common::context::{self, ContractContext};
use pbc_contract_common::sorted_vec_map::entry;
use pbc_contract_common::zk::{
    CalculationStatus, SecretVarId, ZkClosed, ZkInputDef, ZkState, ZkStateChange
};
use pbc_contract_common::events::EventGroup;
use pbc_zk::*;
use read_write_state_derive::ReadWriteState;
use read_write_rpc_derive::ReadWriteRPC;
use pbc_contract_common::shortname::ShortnameZkComputation;
use std::collections::HashMap;

pub mod types;
use types::*;

mod zk_compute;

#[derive(Debug)]
#[repr(C)]
#[state]
pub struct ContractState {
    /**
     * Game IDs
     */
    game_ids: AvlTreeSet<u8>,

    /**
     * Game state
     */
    games: Vec<GameState>
}

impl ContractState {
    /// Create a new contract state (used in `initialize`)
    pub fn new() -> Self {
        ContractState {
            game_ids: AvlTreeSet::new(),
            games: vec![],
        }
    }

    /// Check if a game ID exists
    pub fn has_game_id(&self, game_id: u8) -> bool {
        self.game_ids.contains(&game_id)
    }

    /// Add a new game to the state
    pub fn add_game(&mut self, game: GameState) {
        self.game_ids.insert(game.game_id);
        self.games.push(game);
    }

    /// Get a mutable reference to a game by ID
    pub fn get_game_mut(&mut self, game_id: u8) -> Option<&mut GameState> {
        self.games.iter_mut().find(|game| game.game_id == game_id)
    }

    /// Get an immutable reference to a game by ID
    pub fn get_game(&self, game_id: u8) -> Option<&GameState> {
        self.games.iter().find(|game| game.game_id == game_id)
    }

    /// Get both index and mutable reference (used when you need to overwrite in-place)
    pub fn get_game_with_index_mut(&mut self, game_id: u8) -> (usize, & mut GameState) {
        assert!(self.game_ids.contains(&game_id), "unknown game id");

        let idx = self.games.iter().position(|x| x.game_id == game_id)
            .expect("failed to find idx");
    
        let game_state = &mut self.games[idx];
    
        (idx, game_state)
    }
}

#[init(zk = true)]
pub fn initialize(
    context: ContractContext,
    _zk_state: ZkState<VariableKind>,
) -> ContractState {
    ContractState::new()
}

#[repr(C)]
#[derive(Clone, Copy, CreateTypeSpec, ReadWriteRPC)]
pub struct GameInitParams {
    pub game_id: u8,
    pub question_count: u8,
    pub game_deadline: i64
}

#[zk_on_secret_input(shortname = 0x40)]
pub fn create_game(
    context: ContractContext,
    mut state: ContractState,
    _zk_state: ZkState<VariableKind>,
    params: GameInitParams
) -> (
    ContractState,
    Vec<EventGroup>,
    ZkInputDef<VariableKind, AnswersArr>,
) {
    assert!(context.block_production_time < params.game_deadline, "Game end must be in the future");
    assert!(
        !state.has_game_id(params.game_id),
        "game id already used"
    );
    assert!(params.question_count <= MAX_QUESTIONS.try_into().unwrap(), "too many questions");

    let game_state = GameState::new(
        params.game_id,
        context.sender,
        params.game_deadline,
        params.question_count
    );

    let input_def = ZkInputDef::with_metadata(
        Some(SHORTNAME_GAME_STARTED), 
        VariableKind::GameAnswers { game_id: params.game_id, length: params.question_count },
    );
    

    state.add_game(game_state);

    (state, vec![], input_def)
}

#[zk_on_variable_inputted(shortname = 0x50)]
pub fn game_started(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    game_data_svar_id: SecretVarId
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let entry_metadata = zk_state.get_variable(game_data_svar_id).unwrap();

    match entry_metadata.metadata {
        VariableKind::GameAnswers { game_id, length } => {
            let (_, game_state) = state.get_game_with_index_mut(game_id);
            game_state.start(game_data_svar_id);


            (state, vec![], vec![])
        }
        _ => panic!("Unexpected metadata type!"),
    }
}

#[zk_on_secret_input(shortname = 0x41)]
pub fn submit_answers(
    context: ContractContext,
    mut state: ContractState,
    _zk_state: ZkState<VariableKind>,
    game_id: u8
) -> (
    ContractState,
    Vec<EventGroup>,
    ZkInputDef<VariableKind, AnswersArr>
) {
    let (idx, game_state) = state.get_game_with_index_mut(game_id);
    assert!(game_state.is_in_progress(), "Game not in progress");
    assert!(
        game_state.is_game_deadline_passed(context.block_time),
        "Deadline limit",
    );
    assert!(
        !game_state.has_player_submitted(&context.sender),
        "Player already submitted: {:?}",
        context.sender
    );

    let input_def = ZkInputDef::with_metadata(
        Some(SHORTNAME_ENTRY_SUBMITTED),
        VariableKind::Entry {
            game_id,
            player: context.sender
        }
    );

    game_state.add_player(context.sender);

    (state, vec![], input_def)
}

#[zk_on_variable_inputted(shortname = 0x51)]
pub fn entry_submitted(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    entry_svar_id: SecretVarId
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let entry_metadata = zk_state.get_variable(entry_svar_id).unwrap();

    match entry_metadata.metadata {
        VariableKind::Entry { game_id, player } => {
            let (_, game_state) = state.get_game_with_index_mut(game_id);

            game_state.add_entry_svar(entry_svar_id);

            let game_data_id = game_state.game_data_svar.expect("no game data id");
        
            (
                state,
                vec![],
                vec![
                    zk_compute::calculate_results_start(
                        game_data_id,
                        entry_svar_id,
                        Some(SHORTNAME_ENTRY_PROCESSED),
                        &entry_metadata.metadata
                    )
                ],
            )
        }
        _ => panic!("Unexpected metadata type!"),
    }
}

#[action(zk = true, shortname = 0x10)]
pub fn finish_game(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    game_id: u8
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let mut zk_state_changes = vec![];

    {
        let (idx, game_state) = state.get_game_with_index_mut(game_id);
        assert!(game_state.is_in_progress(), "Game not in progress");
        assert!(
            game_state.is_game_deadline_passed(context.block_time),
            "Deadline limit",
        );

        game_state.complete();

        zk_state_changes.push(ZkStateChange::OpenVariables { 
            // TODO!: This should be result svars not entry svars
            variables: game_state.entries_svars.to_vec()
        })
    }

    (state, vec![], zk_state_changes)
}

#[zk_on_variables_opened]
pub fn vars_opened(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    opened_variables: Vec<SecretVarId>,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {

    let mut touched_game_id: u8 = 0;

    for i in 0..opened_variables.len() {
        let result = opened_variables.get(i);
        let unwrapped_result = opened_variables.get(i).unwrap();
        let metadata = zk_state.get_variable(*unwrapped_result).unwrap().metadata;

        match metadata {
            VariableKind::Result { game_id, player, score } => {
                touched_game_id = game_id;
                let (_, game_state) = state.get_game_with_index_mut(game_id);

                game_state.add_leaderboard_entry(LeaderboardPosition {
                    game_id,
                    player,
                    score
                });

            }
            _ => panic!("Unexpected metadata type!"),
        }
    }

    let (_, game_state) = state.get_game_with_index_mut(touched_game_id);
    game_state.publish();

    (state, vec![], vec![])
}


#[zk_on_compute_complete(shortname = 0x61)]
pub fn entry_processed(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    output_variables: Vec<SecretVarId>
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    // TODO: Update entry status to processed so we can safely guarantee that the game is ready to be finished

    (
        state,
        vec![],
        vec![]
    )
}