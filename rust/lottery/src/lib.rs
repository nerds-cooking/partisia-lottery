#[macro_use]
extern crate pbc_contract_codegen;
extern crate pbc_contract_common;

use std::collections::VecDeque;

use create_type_spec_derive::CreateTypeSpec;
use pbc_contract_common::address::Address;
use pbc_contract_common::address::AddressType;
use pbc_contract_common::address::Shortname;
use pbc_contract_common::address::ShortnameCallback;
use pbc_contract_common::address::ShortnameZkVariableInputted;
use pbc_contract_common::avl_tree_map::{AvlTreeMap, AvlTreeSet};
use pbc_contract_common::context::{self, CallbackContext, ContractContext};
use pbc_contract_common::events::EventGroup;
use pbc_contract_common::zk::CalculationStatus;
use pbc_contract_common::zk::ZkClosed;
use pbc_contract_common::zk::{SecretVarId, ZkInputDef, ZkState, ZkStateChange};
use pbc_zk::load_metadata;
use pbc_zk::Sbi8;
use pbc_zk::SecretBinary;
use read_write_rpc_derive::ReadWriteRPC;
use read_write_state_derive::ReadWriteState;

mod zk_compute;

// ZK types for ABI generation
// Account balance for a user or a lottery
#[derive(Debug, Clone, CreateTypeSpec, SecretBinary)]
pub struct AccountBalance {
    pub account_key: u128,
    pub balance: u128,
}
// EOF: ZK types for ABI generation

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
    UserAccount {
        owner: Address
    },

    /// Account for a lottery
    #[discriminant(4)]
    LotteryAccount { lottery_id: u8 },

    /// Secret input for account creation
    #[discriminant(5)]
    AccountCreationSecret {
        owner: Address
    },
    /// Secret-share variable is a work item.
    ///
    /// Indicates that secret data is [`zk_compute::PendingTransferSecrets`] or [`zk_compute::AccountCreationSecret`], depending upon the computation.
    #[discriminant(6)]
    WorkItemData {
        /// Owner of the work.
        ///
        /// The [`ContractState::transfer_variables_to_owner`] method ensures that the variable is
        /// owned by this address.
        owner: Address,
    },
}


/// Indicates the type of the item in the work list.
#[derive(ReadWriteState, Debug, Clone, CreateTypeSpec)]
pub enum WorkListItem {
    /// Created by the [`create_account`] invocation.
    #[discriminant(1)]
    PendingAccountCreation {
        /// Account to create
        account: Address,
        /// Identifier of secret-shared [`zk_compute::AccountCreationSecret`].
        account_creation_id: SecretVarId,
    },
}


#[derive(Debug)]
#[repr(C)]
#[state]
pub struct ContractState {
    // Set of accounts (users or lotteries) and their secret var IDs for tracking balances
    accounts: AvlTreeMap<Address, SecretVarId>,

    // Queue of work items to be processed
    pub work_queue: VecDeque<WorkListItem>,
    // Redundant variables that can be cleaned up
    redundant_variables: Vec<SecretVarId>,
}

impl ContractState {
    /// Create a new contract state (used in `initialize`)
    pub fn new() -> Self {
        ContractState {
            accounts: AvlTreeMap::new(),

            work_queue: VecDeque::new(),
            redundant_variables: vec![]
        }
    }

    /// Updates the [`ContractState::balances`] map to include newly created
    /// [`VariableKind::DepositBalance`] variables, deleting the previous balance if any exists.
    ///
    /// Given a list of secret variables:
    ///
    /// - Transfer ownership of any given variable to the [`VariableKind::owner()`].
    /// - Older [`VariableKind::DepositBalance`] are deleted
    /// - [`VariableKind::DepositBalance`] are stored in the [`ContractState::balances`] map.
    pub fn transfer_variables_to_owner(
        &mut self,
        zk_state: &ZkState<VariableKind>,
        output_variables: Vec<SecretVarId>,
        zk_state_change: &mut Vec<ZkStateChange>,
    ) {
        let mut previous_variable_ids = vec![];

        for variable_id in output_variables {
            let variable = zk_state.get_variable(variable_id).unwrap();

            let mut _owner: Option<Address> = None;

            // Update state balances
            if let VariableKind::UserAccount { owner } = variable.metadata {
                _owner = Some(owner.clone());
                if let Some(previous_variable_id) = self.accounts.get(&owner) {
                    previous_variable_ids.push(previous_variable_id)
                }

                self.accounts
                    .insert(owner, variable.variable_id);
            }

            if _owner.is_some() {
                // If the variable has an owner, transfer it to the owner
                zk_state_change.push(ZkStateChange::TransferVariable {
                    variable: variable.variable_id,
                    new_owner: _owner.unwrap(),
                });
            }
        }

        zk_state_change.push(ZkStateChange::DeleteVariables {
            variables_to_delete: previous_variable_ids,
        })
    }

    /// Should only be called from `zk_on_compute_complete` invocations.
    ///
    /// It is not possible to run [`ContractState::attempt_to_start_next_in_queue`] in the same event as
    /// [`ContractState::clean_up_redundant_secret_variables`], as the latter may remove secret
    /// variables, while the first iterates all variables, and these cannot be done synchronized.
    pub fn clean_up_redundant_secret_variables(&mut self, state_changes: &mut Vec<ZkStateChange>) {
        state_changes.push(ZkStateChange::DeleteVariables {
            variables_to_delete: self.redundant_variables.clone(),
        });
        self.redundant_variables.clear();
    }

    /// Initializes the next transfer in the queue, if the zk state machine is ready for the next
    /// computation.
    ///
    /// The queue will not be changed in the following cases:
    ///
    /// - There is already a computation running.
    /// - There are no more transfers in the queue.
    ///
    /// Transfers may fail in the following cases:
    ///
    /// - The sender does not have an account (for deposit, withdraw or transfer)
    /// - The sender already has an account (for account creation)
    ///
    /// When a transfer fails in this manner it will trigger [`fail_safely`] for that transfer, and
    /// try again.
    ///
    /// This method should be invoked every time a transfer is added to the queue, or every time
    /// a computation completes.
    ///
    /// It is not possible to run [`ContractState::attempt_to_start_next_in_queue`] in the same event as
    /// [`ContractState::clean_up_redundant_secret_variables`], as the latter may remove secret
    /// variables, while the first iterates all variables, and these cannot be done synchronized.
    pub fn attempt_to_start_next_in_queue(
        &mut self,
        context: &ContractContext,
        zk_state: &ZkState<VariableKind>,
        zk_state_change: &mut Vec<ZkStateChange>,
        event_groups: &mut Vec<EventGroup>,
    ) {
        // Calculation must not be doing anything right now.
        if zk_state.calculation_state != CalculationStatus::Waiting {
            return;
        }

        let Some(worklist_item) = self.work_queue.pop_front() else {
            return;
        };

        // Begin calculation for the next transfer
        match worklist_item {
            WorkListItem::PendingAccountCreation {
                account,
                account_creation_id,
            } => {
                if self.has_account(&account) {
                    fail_safely(
                        context,
                        event_groups,
                        "Cannot create new user when account already exists",
                    );
                    return self.attempt_to_start_next_in_queue(
                        context,
                        zk_state,
                        zk_state_change,
                        event_groups,
                    );
                }

                self.redundant_variables.push(account_creation_id);

                zk_state_change.push(zk_compute::create_account_start(
                    account_creation_id,
                    Some(SHORTNAME_SIMPLE_WORK_ITEM_COMPLETE),
                    &VariableKind::UserAccount { owner: account },
                ))
            }
        };
    }

    /// Queues a new transfer, and possibly starts the associated computation, if there is nothing
    /// else in the queue.
    fn schedule_new_work_item(
        &mut self,
        context: &ContractContext,
        zk_state: &ZkState<VariableKind>,
        zk_state_change: &mut Vec<ZkStateChange>,
        event_groups: &mut Vec<EventGroup>,
        worklist_item: WorkListItem,
    ) {
        self.work_queue.push_back(worklist_item);
        self.attempt_to_start_next_in_queue(context, zk_state, zk_state_change, event_groups)
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
    ZkInputDef<VariableKind, zk_compute::AccountCreationSecret>,
) {
    let input_def = ZkInputDef::with_metadata(
        Some(SHORTNAME_CREATE_ACCOUNT_INPUTTED),
        VariableKind::WorkItemData {
            owner: context.sender,
        },
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
    state.schedule_new_work_item(
        &context,
        &zk_state,
        &mut zk_state_change,
        &mut event_groups,
        WorkListItem::PendingAccountCreation {
            account: zk_state.get_variable(account_creation_id).unwrap().owner,
            account_creation_id,
        },
    );
    (state, event_groups, zk_state_change)
}

/// Triggered on the completion of the computation for either of [`WorkListItem::PendingTransfer`],
/// [`WorkListItem::PendingDeposit`] or [`WorkListItem::PendingAccountCreation`].
///
/// Transfers ownership of the output variables to the owners defined by [`VariableKind::owner()`].
#[zk_on_compute_complete(shortname = 0x61)]
pub fn simple_work_item_complete(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    output_variables: Vec<SecretVarId>,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    // Start next in queue
    let mut zk_state_change = vec![];

    // Move all variables to their expected owners
    state.transfer_variables_to_owner(&zk_state, output_variables, &mut zk_state_change);
    state.clean_up_redundant_secret_variables(&mut zk_state_change);

    // Trigger [`continue_queue`]
    let mut event_groups = vec![];
    trigger_continue_queue_if_needed(context, &state, &mut event_groups);

    (state, event_groups, zk_state_change)
}

/// Indicates failure to the user by spawning a new failing event.
///
/// This is done to prevent stalling the queue, as individual [`WorkListItem`]s are that can fail, but it should
/// not be possible to make a denial of service attack by inputting a failing [`WorkListItem`].
pub fn fail_safely(
    context: &ContractContext,
    event_groups: &mut Vec<EventGroup>,
    error_message: &str,
) {
    const SHORTNAME_FAIL_IN_SEPARATE_ACTION: u8 = 0x4C;

    let mut event_group_builder = EventGroup::builder();
    event_group_builder
        .call(context.contract_address, Shortname::from_u32(0x09)) // Public invocation prefix
        .argument(SHORTNAME_FAIL_IN_SEPARATE_ACTION) // Shortname
        .argument(String::from(error_message)) // Error message
        .done();

    event_groups.push(event_group_builder.build());
}


/// Creates a new event for continue running the work queue.
///
/// It is not possible to run [`ContractState::attempt_to_start_next_in_queue`] in the same event as
/// [`ContractState::clean_up_redundant_secret_variables`], as the latter may remove secret
/// variables, while the first iterates all variables, and these cannot be done synchronized.
pub fn trigger_continue_queue_if_needed(
    context: ContractContext,
    state: &ContractState,
    event_groups: &mut Vec<EventGroup>,
) {
    if !state.work_queue.is_empty() {
        let mut event_group_builder = EventGroup::builder();
        event_group_builder
            .call(context.contract_address, Shortname::from_u32(0x09)) // Public invocation prefix
            .argument(0x10u8) // Shortname
            .done();
        event_groups.push(event_group_builder.build());
    }
}