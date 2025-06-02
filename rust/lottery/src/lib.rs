#[macro_use]
extern crate pbc_contract_codegen;
extern crate pbc_contract_common;

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
use pbc_zk::load_metadata;
use pbc_zk::Sbi8;
use pbc_zk::SecretBinary;
use read_write_rpc_derive::ReadWriteRPC;
use read_write_state_derive::ReadWriteState;

mod zk_compute;

/// Kind of secret or revealed data stored
#[derive(ReadWriteState, Debug, Clone, CreateTypeSpec)]
pub enum VariableKind {
    /// An anonymous entry in the lottery
    #[discriminant(1)]
    Entry {  },

    /// Revealed winner after selection
    #[discriminant(2)]
    Winner { lottery_id: u8 },

    /// Account for a user
    #[discriminant(3)]
    UserAccount { },

    /// Account for a lottery
    #[discriminant(4)]
    LotteryAccount { lottery_id: u8 },

    /// Secret input for account creation
    #[discriminant(5)]
    AccountSecret {
        owner: Address
    }
}


#[derive(Debug)]
#[repr(C)]
#[state]
pub struct ContractState {
    // Set of accounts (users or lotteries) and their secret var IDs for tracking balances
    accounts: AvlTreeMap<Address, SecretVarId>
}

impl ContractState {
    /// Create a new contract state (used in `initialize`)
    pub fn new() -> Self {
        ContractState {
            accounts: AvlTreeMap::new(),
        }
    }

    /// Check if an account exists
    pub fn has_account(&self, address: &Address) -> bool {
        self.accounts.contains_key(address)
    }

    /// Add a new account with its secret var ID
    pub fn add_account(&mut self, address: Address, secret_var_id: SecretVarId) {
        self.accounts.insert(address, secret_var_id);
    }

    /// Get the secret var ID for an account
    pub fn get_account_var_id(&self, address: &Address) -> Option<SecretVarId> {
        self.accounts.get(address)
    }
}

#[init(zk = true)]
pub fn initialize(context: ContractContext, _zk_state: ZkState<VariableKind>) -> ContractState {
    ContractState::new()
}


/**
 * Secret input
 * 
 * User creates an account with an account key (generated client side and kept secret)
 */
#[zk_on_secret_input(shortname = 0x40)]
pub fn create_account(
    context: ContractContext,
    state: ContractState,
    _zk_state: ZkState<VariableKind>,
) -> (
    ContractState,
    Vec<EventGroup>,
    ZkInputDef<VariableKind, zk_compute::AccountSecret>,
) {
    let input_def = ZkInputDef::with_metadata(
        Some(SHORTNAME_CREATE_ACCOUNT_INPUTTED),
        VariableKind::AccountSecret { owner: context.sender },
    );

    (state, vec![], input_def)
}


#[zk_on_variable_inputted(shortname = 0x50)]
pub fn create_account_inputted(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    account_creation_id: SecretVarId,
    ) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let mut zk_state_change = vec![];
    let mut event_groups = vec![];

    let metadata = zk_state.get_variable(account_creation_id).unwrap().metadata;


    match metadata {
        VariableKind::AccountSecret { owner } => {
            zk_state_change.push(
                zk_compute::create_account_start(
                    account_creation_id,
                    Some(SHORTNAME_ACCOUNT_CREATED),
                    &VariableKind::UserAccount { },
                )
            )
        }
        _ => panic!("Unexpected metadata type! {:?}", metadata),
    }

    (state, event_groups, zk_state_change)
}

#[zk_on_compute_complete(shortname = 0x60)]
pub fn account_created(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    output_variables: Vec<SecretVarId>,
    ) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    // Start next in queue
    let mut zk_state_change = vec![];

    //?


    // for variable_id in output_variables {
    //     let variable = zk_state.get_variable(variable_id).unwrap();

    //     match variable.metadata {


    //     VariableKind::UserAccount { owner } => {
    //         // Create a new account with the given owner
    //         let account_var_id = zk_compute::create_account_complete(
    //             variable_id,
    //             Some(SHORTNAME_ACCOUNT_CREATED),
    //             &VariableKind::UserAccount { },
    //         );

    //         // Add the new account to the state
    //         state.add_account(owner, account_var_id);

    //         // Add a state change to transfer the variable to the owner
    //         zk_state_change.push(ZkStateChange::TransferVariable {
    //             variable: account_var_id,
    //             new_owner: owner,
    //         });

    //     }
    // }

    // state.transfer_variables_to_owner(&zk_state, output_variables, &mut zk_state_change);
    // state.clean_up_redundant_secret_variables(&mut zk_state_change);

    // Trigger [`continue_queue`]
    let mut event_groups = vec![];

    (state, event_groups, zk_state_change)
}