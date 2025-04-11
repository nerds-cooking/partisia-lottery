extern crate pbc_contract_codegen;
extern crate pbc_contract_common;

use create_type_spec_derive::CreateTypeSpec;
use read_write_state_derive::ReadWriteState;
use read_write_rpc_derive::ReadWriteRPC;
use pbc_zk::{Sbi8, SecretVarId};
use pbc_contract_common::address::Address;
use pbc_contract_common::avl_tree_map::AvlTreeSet;


pub const MAX_QUESTIONS: usize = 100;
pub type AnswersArr = [Sbi8; MAX_QUESTIONS];

#[derive(CreateTypeSpec, ReadWriteState, PartialEq, Clone, Debug)]
pub enum GameStatus {
    #[discriminant(1)]
    Pending {},
    #[discriminant(2)]
    InProgress {},
    #[discriminant(3)]
    Complete {},
    #[discriminant(4)]
    Published {}
}


#[derive(ReadWriteState, Debug, Clone, CreateTypeSpec)]
pub enum VariableKind {
    /**
     * Answers to the game
     */
    #[discriminant(1)]
    GameAnswers {
        game_id: u8,
        length: u8
    },
    /**
     * Entry by a user
     */
    #[discriminant(2)]
    Entry {
        game_id: u8,
        player: Address
    },
    #[discriminant(3)]
    /**
     * Result of an entry
     */
    Result {
        game_id: u8,
        player: Address,
        score: i8
    }
}

#[derive(ReadWriteState, Debug, Clone, CreateTypeSpec)]
#[repr(C)]
pub struct LeaderboardPosition {
    pub game_id: u8,
    pub player: Address,
    pub score: i8
}

#[derive(ReadWriteState, Debug, CreateTypeSpec)]
pub struct GameState {
    /**
     * ID of the game
     */
    pub game_id: u8,

    /**
     * Game creator
     */
    pub creator: Address,

    /**
     * Game status
     */
    pub game_status: GameStatus,

    /**
     * Deadline of the game (ms since epoch)
     */
    pub game_deadline: i64,

    /**
     * Amount of questions
     */
    pub question_count: u8,

    /**
     * Players that have submitted
     */
    pub players: AvlTreeSet<Address>,

    /**
     * Secret var ID for game data
     */
    pub game_data_svar: Option<SecretVarId>,

    /**
     * Entry data
     */
    pub entries_svars: Vec<SecretVarId>,

    /**
     * Final leaderboard
     */
    pub leaderboard: Vec<LeaderboardPosition>
}

impl GameState {
    /// Create a new game state
    pub fn new(game_id: u8, creator: Address, game_deadline: i64, question_count: u8) -> Self {
        GameState {
            game_id,
            creator,
            game_status: GameStatus::Pending {},
            game_deadline,
            question_count,
            players: AvlTreeSet::new(),
            game_data_svar: None,
            entries_svars: vec![],
            leaderboard: vec![],
        }
    }

    /// Check if game is currently in progress
    pub fn is_in_progress(&self) -> bool {
        self.game_status == GameStatus::InProgress {}
    }

    /// Check if game is in completed state
    pub fn is_complete(&self) -> bool {
        self.game_status == GameStatus::Complete {}
    }

    /// Check if game is still open (Pending or InProgress)
    pub fn is_open(&self) -> bool {
        matches!(
            self.game_status,
            GameStatus::Pending {} | GameStatus::InProgress {}
        )
    }

    /// Check if game deadline passed
    pub fn is_game_deadline_passed(&self, current_time: i64) -> bool {
        current_time < self.game_deadline
    }

    /// Transition game to InProgress
    pub fn start(&mut self, game_data_svar: SecretVarId) {
        self.game_status = GameStatus::InProgress {};
        self.game_data_svar = Some(game_data_svar);
    }

    /// Transition game to Complete
    pub fn complete(&mut self) {
        self.game_status = GameStatus::Complete {};
    }

    /// Transition game to Publshed
    pub fn publish(&mut self) {
        self.game_status = GameStatus::Published {}
    }

    /// Add a player if they haven’t submitted yet
    pub fn add_player(&mut self, player: Address) {
        assert!(!self.has_player_submitted(&player), "player already submitted");

        self.players.insert(player);    
    }

    /// Check if a player has already submitted
    pub fn has_player_submitted(&self, player: &Address) -> bool {
        self.players.contains(player)
    }

    /// Add a secret variable for a player's entry
    pub fn add_entry_svar(&mut self, svar: SecretVarId) {
        self.entries_svars.push(svar);
    }

    /// Add to leaderboard and sort
    pub fn add_leaderboard_entry(&mut self, leaderboard_entry: LeaderboardPosition) {
        self.leaderboard.push(leaderboard_entry);
        
        self.leaderboard.sort_by(|a, b| b.score.cmp(&a.score));
    }
}
