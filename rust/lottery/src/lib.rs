#[macro_use]
extern crate pbc_contract_codegen;
extern crate pbc_contract_common;

use std::collections::VecDeque;

use create_type_spec_derive::CreateTypeSpec;
use lottery::{LotteryId, LotteryState, LotteryStatus};
use pbc_contract_common::address::Address;
use pbc_contract_common::address::Shortname;
use pbc_contract_common::avl_tree_map::AvlTreeMap;
use pbc_contract_common::context::{CallbackContext, ContractContext};
use pbc_contract_common::events::EventGroup;
use pbc_contract_common::zk::CalculationStatus;
use pbc_contract_common::zk::ZkClosed;
use pbc_contract_common::zk::{SecretVarId, ZkInputDef, ZkState, ZkStateChange};
use pbc_zk::api;
use pbc_zk::SecretBinary;
use read_write_state_derive::ReadWriteState;
use mpc_20::MPC20Contract;

mod zk_compute;
mod mpc_20;
mod lottery;


/// Kind of secret or revealed data stored
#[derive(ReadWriteState, Debug, Clone, CreateTypeSpec)]
pub enum VariableKind {
    /// An anonymous entry in the lottery
    #[discriminant(1)]
    Entry {  },

    /// Revealed winner after selection
    #[discriminant(2)]
    Winner { lottery_id: LotteryId },

    /// Account for a user
    #[discriminant(3)]
    UserAccount {
        owner: Address
    },

    /// Account for a lottery
    #[discriminant(4)]
    LotteryAccount { 
        owner: Address,
        lottery_id: LotteryId
     },

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

    /// Result of a withdraw operation
    #[discriminant(7)]
    WithdrawResult {
        owner: Address
    },

    /// Metadata for public inputs used on secret input for creating a lottery
    #[discriminant(8)]
    LotteryCreationData {
        creator: Address,
        // Lottery ID is also used as the account key for the lottery
        lottery_id: LotteryId,
    },
    /// Result of a lottery creation operation
    #[discriminant(9)]
    LotteryCreationResult {
        /// Owner of the lottery
        owner: Address,
        lottery_id: LotteryId,
    }
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
    /// Created by the [`purchase_credits`] invocation.
    #[discriminant(2)]
    PendingPurchaseCredits {
        /// Account to purchase credits for
        account: Address,
        // Amount of credits to purchase
        credits: u128,
    },
    /// Created by the [`redeem_credits`] invocation.
    #[discriminant(3)]
    PendingRedeemCredits {
        /// Account to redeem credits for
        account: Address,
        // Amount of credits to redeem
        credits: u128,
    },
    /// Created by the [`create_lottery`] invocation.
    #[discriminant(4)]
    PendingLotteryCreation {
        /// Account of the lottery creator
        account: Address,
        /// Lottery ID as provided in public input
        lottery_id: LotteryId,
        /// Prize pool amount
        prize_pool: u128,
        /// Identifier of secret-shared [`zk_compute::LotteryCreationSecret`]
        lottery_creation_id: SecretVarId
    }
}


#[derive(Debug)]
#[repr(C)]
#[state]
pub struct ContractState {
    token: Address,

    /// API Address that is able to read secret variables (workaround for lack of support for reading secret variables with current Parti Wallet)
    api: Address,

    // Set of user accounts and their secret var IDs for tracking balances
    user_accounts: AvlTreeMap<Address, SecretVarId>,

    // Set of lottery accounts and their secret var IDs for tracking balances
    lottery_accounts: AvlTreeMap<LotteryId, SecretVarId>,
    lotteries: AvlTreeMap<LotteryId, LotteryState>,

    // Queue of work items to be processed
    pub work_queue: VecDeque<WorkListItem>,
    // Redundant variables that can be cleaned up
    redundant_variables: Vec<SecretVarId>,
}

impl ContractState {
    /// Create a new contract state (used in `initialize`)
    pub fn new(token: Address, api: Address) -> Self {
        ContractState {
            token,

            api,

            user_accounts: AvlTreeMap::new(),
            lottery_accounts: AvlTreeMap::new(),

            lotteries: AvlTreeMap::new(),

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
        ///! This function is designed to transfer ownership to the correct owner
        ///! but because Parti Wallet doesn't allow retreiving private keys and triggers 4 modals when trying to fetch each balance
        ///! We use an API address to read the secret variables as a workaround until this is supported
        ///!
        let mut previous_variable_ids = vec![];

        for variable_id in output_variables {
            let variable = zk_state.get_variable(variable_id).unwrap();

            let mut _owner: Option<Address> = None;

            match variable.metadata {
                VariableKind::UserAccount { owner }  => {
                    _owner = Some(owner.clone());
                    if let Some(previous_variable_id) = self.user_accounts.get(&owner) {
                        previous_variable_ids.push(previous_variable_id)
                    }
    
                    self.add_user_account(owner, variable.variable_id);
                }

                VariableKind::LotteryAccount { owner, lottery_id } => {
                    _owner = Some(owner.clone());

                    if let Some(previous_variable_id) = self.lottery_accounts.get(&lottery_id) {
                        previous_variable_ids.push(previous_variable_id)
                    }
    
                    self.add_lottery_account(lottery_id, variable.variable_id);
                }
                _ => {}
            }

            if _owner.is_some() {
                // If the variable has an owner, transfer it to the owner
                zk_state_change.push(ZkStateChange::TransferVariable {
                    variable: variable.variable_id,
                    // new_owner: _owner.unwrap(),
                    new_owner: self.api // ! See comment at start of function explaining this
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
                if self.has_user_account(&account) {
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
            WorkListItem::PendingPurchaseCredits { account, credits } => {
                if !self.has_user_account(&account) {
                    fail_safely(
                        context,
                        event_groups,
                        "Cannot purchase credits for an account that does not exist",
                    );
                    return self.attempt_to_start_next_in_queue(
                        context,
                        zk_state,
                        zk_state_change,
                        event_groups,
                    );
                }

                zk_state_change.push(zk_compute::mint_credits_start(
                    self.get_user_account_var_id(&account).unwrap(),
                    credits,
                    Some(SHORTNAME_SIMPLE_WORK_ITEM_COMPLETE),
                    &VariableKind::UserAccount { owner: account }
                ));
            }
            WorkListItem::PendingRedeemCredits { account, credits } => {
                if !self.has_user_account(&account) {
                    fail_safely(
                        context,
                        event_groups,
                        "Cannot redeem credits for an account that does not exist",
                    );
                    return self.attempt_to_start_next_in_queue(
                        context,
                        zk_state,
                        zk_state_change,
                        event_groups,
                    );
                }

                // assert!(false, "debug: {:?}", credits);

                zk_state_change.push(zk_compute::burn_credits_start(
                    self.get_user_account_var_id(&account).unwrap(),
                    credits,
                    Some(SHORTNAME_WITHDRAW_COMPLETE),
                    [
                        &VariableKind::UserAccount { owner: account },
                        &VariableKind::WithdrawResult { owner: account }
                    ]
                ));
            }
            WorkListItem::PendingLotteryCreation {
                account,
                lottery_id,
                prize_pool,
                lottery_creation_id,
            } => {
                if !self.has_user_account(&account) {
                    fail_safely(
                        context,
                        event_groups,
                        "Creator must have an account to create a lottery",
                    );
                    return self.attempt_to_start_next_in_queue(
                        context,
                        zk_state,
                        zk_state_change,
                        event_groups,
                    );
                }


                self.redundant_variables.push(lottery_creation_id);


                zk_state_change.push(zk_compute::create_lottery_start(
                    lottery_creation_id,
                    self.get_user_account_var_id(&account).unwrap(),
                    prize_pool,
                    Some(SHORTNAME_CREATE_LOTTERY_COMPLETE),
                    [
                        &VariableKind::UserAccount { owner: account },
                        &VariableKind::LotteryAccount { owner: account, lottery_id },
                        &VariableKind::LotteryCreationResult { owner: account, lottery_id }
                    ],
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

    /// Check if a user account exists
    pub fn has_user_account(&self, address: &Address) -> bool {
        self.user_accounts.contains_key(address)
    }

    /// Add a new user account with its secret var ID
    pub fn add_user_account(&mut self, address: Address, secret_var_id: SecretVarId) {
        self.user_accounts.insert(address, secret_var_id);
    }

    /// Get the secret var ID for a user account
    pub fn get_user_account_var_id(&self, address: &Address) -> Option<SecretVarId> {
        self.user_accounts.get(address)
    }

    /// Add a new lottery to the state
    pub fn add_lottery(&mut self, lottery_state: &LotteryState) {
        self.lotteries.insert(lottery_state.lottery_id, lottery_state.clone());
    }

    pub fn get_lottery(&self, lottery_id: &LotteryId) -> Option<LotteryState> {
        self.lotteries.get(lottery_id)
    }

    /// Check if a lottery account exists
    pub fn has_lottery_account(&self, lottery_id: &LotteryId) -> bool {
        self.lottery_accounts.contains_key(lottery_id)
    }

    /// Add a new lottery account with its secret var ID
    pub fn add_lottery_account(&mut self, lottery_id: LotteryId, secret_var_id: SecretVarId) {
        self.lottery_accounts.insert(lottery_id, secret_var_id);
    }

    /// Get the secret var ID for a lottery account
    pub fn get_lottery_account_var_id(&self, lottery_id: &LotteryId) -> Option<SecretVarId> {
        self.lottery_accounts.get(lottery_id)
    }

    /// Mark a lottery as open (once payment has been received to the contract)
    pub fn mark_lottery_as_open(
        &mut self,
        lottery_id: LotteryId
    ) {
        let mut lottery = self.get_lottery(&lottery_id).unwrap().clone();

        lottery.status = LotteryStatus::Open {};

        self.lotteries.insert(lottery_id, lottery);
    }
}

#[init(zk = true)]
pub fn initialize(
    _context: ContractContext,
    _zk_state: ZkState<VariableKind>,
    token: Address,
    api: Address,
) -> ContractState {
    ContractState::new(
        token,
        api
    )
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


#[action(shortname = 0x20, zk = true)]
pub fn purchase_credits(
    context: ContractContext,
    state: ContractState,
    _zk_state: ZkState<VariableKind>,
    _credits: u128,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let zk_state_change = vec![];


    let mut event_group = EventGroup::builder();
    MPC20Contract::at_address(state.token)
        .transfer_from(
            &mut event_group,
            &context.sender,
            &context.contract_address,
            _credits
        );

    event_group
        .with_callback(SHORTNAME_DEPOSIT_CALLBACK)
        .argument(context.sender)
        .argument(_credits).done();


    let event_groups = vec![
        event_group.build()
    ];

    (state, event_groups, zk_state_change)
}

/// Handles callback from [`deposit`].
///
/// If the transfer event is successful,
/// the caller of [`deposit`] is registered as a user of the contract with (additional) `amount` added to their balance.
#[callback(shortname = 0x1A, zk = true)]
pub fn deposit_callback(
    context: ContractContext,
    callback_context: CallbackContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    account: Address,
    amount: u128,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    assert!(callback_context.success, "Transfer did not succeed");

    let mut zk_state_change = vec![];
    let mut event_groups = vec![];
    
    state.schedule_new_work_item(
        &context,
        &zk_state,
        &mut zk_state_change,
        &mut event_groups,
        WorkListItem::PendingPurchaseCredits {
            account,
            credits: amount
        }
    );

    (state, event_groups, zk_state_change)
}

#[action(shortname = 0x21, zk = true)]
pub fn redeem_credits(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    _credits: u128,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let mut zk_state_change = vec![];

    let mut event_groups = vec![];

    state.schedule_new_work_item(
        &context,
        &zk_state,
        &mut zk_state_change,
        &mut event_groups,
        WorkListItem::PendingRedeemCredits {
            account: context.sender,
            credits: _credits
        }
    );

    (state, event_groups, zk_state_change)
}

#[zk_on_compute_complete(shortname = 0x53)]
pub fn withdraw_complete(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    output_variables: Vec<SecretVarId>,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {

    let result_id: SecretVarId = *output_variables.get(1).unwrap();

    // Start next in queue
    let mut zk_state_change = vec![];
    let mut event_groups = vec![];

    // Move all variables to their expected owners
    state.transfer_variables_to_owner(&zk_state, output_variables, &mut zk_state_change);
    state.clean_up_redundant_secret_variables(&mut zk_state_change);
    trigger_continue_queue_if_needed(context, &state, &mut event_groups);

    zk_state_change.push(ZkStateChange::OpenVariables {
        variables: vec![result_id],
    });

    (state, event_groups, zk_state_change)
}

#[zk_on_variables_opened]
pub fn withdraw_result_opened(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    opened_variables: Vec<SecretVarId>,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {

    // Determine result
    let result_id: SecretVarId = *opened_variables.first().unwrap();
    let result_variable = zk_state.get_variable(result_id).unwrap();
    let result = read_result(&result_variable);

    // Always remove result variable
    let zk_state_change = vec![ZkStateChange::DeleteVariables {
        variables_to_delete: vec![result_id],
    }];

    let mut event_groups = vec![];

    match result_variable.metadata {
        VariableKind::WithdrawResult { owner} => {
            // Check that deposit was successful
            if !result.successful {
                fail_safely(
                    &context,
                    &mut event_groups,
                    &format!(
                        "Insufficient deposit balance! Could not withdraw {} tokens",
                        result.amount
                    ),
                );
            } else {
                let recipient = result_variable.owner;

                // Transfer the tokens from the contract to the recipient
                let mut event_group = EventGroup::builder();
                MPC20Contract::at_address(state.token)
                .transfer(
                    &mut event_group,
                    &recipient,
                    result.amount
                );

                event_groups.push(event_group.build());
            }
        }
        VariableKind::LotteryCreationResult { owner: _, lottery_id } => {

            // assert!(false, "debug: {:?}", result);

            // Check that lottery creation was successful
            if !result.successful {
                fail_safely(
                    &context,
                    &mut event_groups,
                    &format!(
                        "Could not create lottery with ID {}",
                        lottery_id
                    ),
                );
            } else {
                // Update status of the lottery
                state.mark_lottery_as_open(
                    lottery_id
                );
            }
        }
        _ => {
            fail_safely(
                &context,
                &mut event_groups,
                "Withdraw result variable is not of type WithdrawResult",
            );
        }
    }

    

    (state, event_groups, zk_state_change)
}

fn read_result(result_variable: &ZkClosed<VariableKind>) -> zk_compute::ComputationResultPub {
    let result_bytes: &Vec<u8> = result_variable.data.as_ref().unwrap();
    zk_compute::ComputationResultPub::secret_read_from(&mut result_bytes.as_slice())
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

#[action(shortname = 0x10, zk = true)]
pub fn continue_queue(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    assert!(
        context.sender == context.contract_address,
        "This is an internal invocation. Must not be invoked by outside users."
    );

    // Start next in queue
    let mut zk_state_change = vec![];
    let mut event_groups = vec![];
    state.attempt_to_start_next_in_queue(
        &context,
        &zk_state,
        &mut zk_state_change,
        &mut event_groups,
    );

    (state, event_groups, zk_state_change)
}

#[action(shortname = 0x4C, zk = true)]
pub fn fail_in_separate_action(
    _context: ContractContext,
    _state: ContractState,
    _zk_state: ZkState<VariableKind>,
    error_message: String,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    panic!("{error_message}");
}

// ----- LOTTERY FUNCTIONS -----
/**
 * Secret input
 * 
 * User must have 
 */
#[zk_on_secret_input(shortname = 0x41)]
pub fn create_lottery(
    context: ContractContext,
    mut state: ContractState,
    _zk_state: ZkState<VariableKind>,
    lottery_id: LotteryId,
    deadline: i64,
    entry_cost: u128,
    prize_pool: u128,
) -> (
    ContractState,
    Vec<EventGroup>,
    ZkInputDef<VariableKind, zk_compute::LotteryCreationSecret>,
) {

    // assert!(false, "ipp: {:?}", prize_pool);

    let lstate = LotteryState {
        lottery_id,
        creator: context.sender,
        status: LotteryStatus::Pending {},
        deadline,
        winner: None,
        entry_cost,
        prize_pool,
        random_seed: None // TODO!
    };

    // Add the lottery to the state
    state.add_lottery(&lstate);

    let input_def = ZkInputDef::with_metadata(
        Some(SHORTNAME_CREATE_LOTTERY_INPUTTED),
        VariableKind::LotteryCreationData {
            creator: lstate.creator,
            lottery_id: lstate.lottery_id
        },
    );

    (state, vec![], input_def)
}


#[zk_on_variable_inputted(shortname = 0x51)]
pub fn create_lottery_inputted(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    lottery_creation_id: SecretVarId
    ) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let mut zk_state_change = vec![];
    let mut event_groups = vec![];

    let input_metadata = zk_state.get_variable(lottery_creation_id).unwrap();

    match input_metadata.metadata {
        VariableKind::LotteryCreationData { creator, lottery_id } => {

            let lstate = state.get_lottery(&lottery_id).unwrap_or_else(|| {
                panic!("Lottery with ID {} not found in state!", lottery_id);
            });

            state.schedule_new_work_item(
                &context,
                &zk_state,
                &mut zk_state_change,
                &mut event_groups,
                WorkListItem::PendingLotteryCreation {
                    account: creator,
                    lottery_id,
                    prize_pool: lstate.prize_pool,
                    lottery_creation_id
                },
            );
        }
        _ => panic!("Unexpected metadata type in create lottery!"),
    }

    

    (state, event_groups, zk_state_change)
}

#[zk_on_compute_complete(shortname = 0x54)]
pub fn create_lottery_complete(
    context: ContractContext,
    mut state: ContractState,
    zk_state: ZkState<VariableKind>,
    output_variables: Vec<SecretVarId>,
) -> (ContractState, Vec<EventGroup>, Vec<ZkStateChange>) {
    let result_id: SecretVarId = *output_variables.get(2).unwrap();

    // Start next in queue
    let mut zk_state_change = vec![];
    let mut event_groups = vec![];

    // Move all variables to their expected owners
    state.transfer_variables_to_owner(&zk_state, output_variables, &mut zk_state_change);
    state.clean_up_redundant_secret_variables(&mut zk_state_change);
    trigger_continue_queue_if_needed(context, &state, &mut event_groups);

    zk_state_change.push(ZkStateChange::OpenVariables {
        variables: vec![result_id],
    });

    (state, event_groups, zk_state_change)
}

// ZK types for ABI generation
// Account balance for a user or a lottery
#[derive(Debug, Clone, CreateTypeSpec, SecretBinary)]
pub struct AccountBalance {
    pub account_key: u128,
    pub balance: u128,
}
// EOF: ZK types for ABI generation