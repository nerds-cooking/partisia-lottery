use create_type_spec_derive::CreateTypeSpec;
use pbc_zk::*;

const VARIABLE_KIND_DISCRIMINANT_USER_ACCOUNT: u8 = 3;
const VARIABLE_KIND_DISCRIMINANT_LOTTERY_ACCOUNT: u8 = 4;
const VARIABLE_KIND_DISCRIMINANT_LOTTERY_TICKET_PURCHASE: u8 = 11;

// Can represent a user account OR a lottery account
type AccountKey = Sbu128;
type TokenAmount = Sbu128;

// Account balance for a user or a lottery
#[derive(Debug, Clone, CreateTypeSpec, SecretBinary)]
pub struct AccountBalance {
    pub account_key: AccountKey,
    pub balance: TokenAmount,
}

// Secret lottery state
#[derive(Debug, Clone, CreateTypeSpec, SecretBinary)]
pub struct SecretLotteryState {
    pub entropy: Sbu128,
    pub tickets: Sbu128
}

// Metadata for account balance
#[repr(C)]
#[derive(read_write_state_derive::ReadWriteState, Debug, Clone)]
pub struct AccountBalanceMetadata {
    /// Discriminant to identify the kind of account
    pub kind: u8
}

/// Secret-shared information for creating new users (used for input on account creation).
#[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
pub struct AccountCreationSecret {
    /// Secret-shared key used to transfer to the user that is being created.
    account_key: AccountKey,
}

/// Secret-shared information for creating new lotteries
#[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
pub struct LotteryCreationSecret {
    lottery_account_key: AccountKey,
    creator_account_key: AccountKey,
    random_seed: Sbu128
}

/// Secret-shared information for purchasing lottery tickets
#[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
pub struct LotteryTicketPurchaseSecret {
    /// The account key of the lottery that the ticket is being purchased for.
    lottery_account_key: AccountKey,
    /// The account key of the user that is purchasing the ticket.
    purchaser_account_key: AccountKey,
    /// The amount of tickets to purchase.
    tickets: TokenAmount,
    /// Entropy provided by purchaser to generate randomness in the lottery.
    entropy: Sbu128,
}

/// Secret-shared information for drawing a lottery winner

/// Balance of the recipient, and whether the balance even exist.
///
/// Workaround for the lack of [`Option`] in ZkRust.
#[derive(Debug, Clone, SecretBinary)]
struct RecipientBalance {
    /// Whether the balance exists.
    exists: Sbu1,
    /// The value of the balance.
    recipient_balance: AccountBalance,
}

#[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
pub struct ComputationResult {
    /// Number of tokens that the computation effected or tried to effect.
    amount: TokenAmount,
    /// Whether the computation was successful.
    successful: Sbu1,
}

#[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
pub struct ComputationResultPub {
    pub amount: u128,
    /// Whether the computation was successful.
    pub successful: bool,
}

#[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
pub struct DrawResult {
    lottery_id: AccountKey,
    /// The winner's account key, if the draw was successful.
    /// If the draw was not successful, this will be `0`.
    winner_id: AccountKey,
    /// Whether the computation was successful.
    successful: Sbu1,
}

#[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
pub struct DrawResultPub {
    pub lottery_id: u128,
    /// The winner's account key, if the draw was successful.
    /// If the draw was not successful, this will be `0`.
    pub winner_id: u128,
    /// Whether the computation was successful.
    pub successful: bool,
}

#[derive(Debug, Clone, Copy, CreateTypeSpec, SecretBinary)]
pub struct SecretLotteryStatePub {
    /// Entropy used to generate randomness in the lottery.
    pub entropy: u128,
    /// Number of tickets purchased in the lottery.
    pub tickets: u128,
}

/// Finds the balance of the recipient based on the [`AccountKey`].
///
/// Produces a [`RecipientBalance`], with `exists` true if and only if the balance could be found.
/// Treats all zero keys as non-existant keys.
#[allow(clippy::collapsible_if)]
fn find_recipient_balance(
    account_key: AccountKey,
    sender_balance_id: SecretVarId,
) -> RecipientBalance {
    let mut recipient_balance = RecipientBalance {
        exists: Sbu1::from(false),
        recipient_balance: AccountBalance {
            account_key,
            balance: Sbu128::from(0),
        },
    };

    for variable_id in secret_variable_ids() {
        if is_account_balance(variable_id) {
            let balance: AccountBalance = load_sbi::<AccountBalance>(variable_id);
            let is_sender = sender_balance_id.raw_id == variable_id.raw_id;
            if !is_sender {
                if balance.account_key == account_key {
                    recipient_balance.exists = Sbu1::from(true);
                    recipient_balance.recipient_balance = balance;
                }
            }
        }
    }

    if recipient_balance.recipient_balance.account_key == Sbu128::from(0) {
        recipient_balance.exists = Sbu1::from(false);
    }

    recipient_balance
}

/// Creates and saves new balances.
///
/// Effects:
///
/// - Sender balance is replaced with the updated sender balance.
/// - Recipient balance is replaced with the updated recipient balance.
/// - Other balances are identical to their previous value.
///
/// If `all_conditions_correct == false`, none of the balances will be changed.
#[allow(clippy::collapsible_if)]
#[allow(clippy::collapsible_else_if)]
fn update_all_balances(
    account_key: AccountKey,
    sender_balance_updated: TokenAmount,
    recipient_balance_updated: TokenAmount,
    sender_balance_id: SecretVarId,
    all_conditions_correct: Sbu1,
) {
    for variable_id in secret_variable_ids() {
        if is_account_balance(variable_id) {
            let mut balance: AccountBalance = load_sbi::<AccountBalance>(variable_id);

            let is_sender = sender_balance_id.raw_id == variable_id.raw_id;

            if is_sender {
                if all_conditions_correct {
                    balance.balance = sender_balance_updated;
                }
            } else {
                if all_conditions_correct && balance.account_key == account_key {
                    balance.balance = recipient_balance_updated;
                }
            }

            save_sbi::<AccountBalance>(balance);
        }
    }
}

/// Initializes a new contract account.
///
/// The computation verifies that the given [`AccountBalance::account_key`] haven't been
/// used yet. If the `account_key` has been used, it will create a new account with `account_key` zero.
#[zk_compute(shortname = 0x70)]
pub fn create_account(account_creation_id: SecretVarId, account_key: u128) -> (AccountBalance, ComputationResult) {
    let mut account_details: AccountCreationSecret =
        load_sbi::<AccountCreationSecret>(account_creation_id);

    let recipient_balance =
        find_recipient_balance(account_details.account_key, account_creation_id);

    let account_key = if recipient_balance.exists {
        Sbu128::from(0)
    } else {
        account_details.account_key
    };
    (
        AccountBalance {
            account_key,
            balance: Sbu128::from(0),
        },
        ComputationResult {
            amount: Sbu128::from(0),
            successful: account_key == account_details.account_key
        }
    )
}

#[zk_compute(shortname = 0x71)]
pub fn mint_credits(
    sender_balance_id: SecretVarId,
    amount: u128
) -> AccountBalance {
    let mut sender_balance: AccountBalance = load_sbi::<AccountBalance>(sender_balance_id);

    // Update the sender balance.
    sender_balance.balance = sender_balance.balance + Sbu128::from(amount);

    // Return the updated sender balance.
    (sender_balance)
}

#[zk_compute(shortname = 0x72)]
pub fn burn_credits(
    balance_id: SecretVarId,
    amount: u128
) -> (AccountBalance, ComputationResult) {
    let mut balance: AccountBalance = load_sbi::<AccountBalance>(balance_id);
    let mut successful = Sbu1::from(false);

    // If insufficient balance, do not burn credits.
    if !is_negative(balance.balance - Sbu128::from(amount)) {
        // Update the sender balance.
        balance.balance = balance.balance - Sbu128::from(amount);
    
        // Mark the operation as successful.
        successful = Sbu1::from(true);
    }


    // Return the updated sender balance.
    (
        balance, 
        ComputationResult {
            amount: Sbu128::from(amount),
            successful
        }
    )
}

// Returns:
// 0: AccountBalance -> updated creator account balance
// 1: AccountBalance -> new lottery balance
// 2: SecretLotteryState -> new lottery state
// 3: Whether the creation was successful or not
#[zk_compute(shortname = 0x73)]
pub fn create_lottery(
    lottery_creation_id: SecretVarId,
    creator_balance_id: SecretVarId,
    prize_pool: u128
) -> (AccountBalance, AccountBalance, SecretLotteryState, ComputationResult) {
    let mut creator_balance: AccountBalance = load_sbi::<AccountBalance>(creator_balance_id);
    let mut lottery_creation_secret: LotteryCreationSecret = load_sbi::<LotteryCreationSecret>(lottery_creation_id);

    let secret_amount = Sbu128::from(prize_pool);
    let mut successful = Sbu1::from(false);

    let recipient_balance = find_recipient_balance(lottery_creation_secret.lottery_account_key, lottery_creation_id);

    // If the account exists, we return an account key of `0` to indicate an issue
    let account_key = if recipient_balance.exists {
        Sbu128::from(0)
    } else {
        lottery_creation_secret.lottery_account_key
    };

    if !is_negative(account_key - Sbu128::from(1)) && !is_negative(creator_balance.balance - secret_amount) {
            // If the account key didn't conflict, we'll have a positive number here for key and will be able to mark this as successful
            successful = Sbu1::from(true);

            // Decrease the credits from the sender balance
            creator_balance.balance = creator_balance.balance - secret_amount;
    }

    let mut lottery_balance = 
        AccountBalance {
            account_key,
            balance: secret_amount,
        };

    (
        creator_balance,
        lottery_balance, 
        SecretLotteryState {
            entropy: lottery_creation_secret.random_seed,
            tickets: Sbu128::from(0)
        },
        ComputationResult {
            amount: secret_amount,
            successful
        }
    )
}

// Returns:
// 0: AccountBalance -> updated purchaser account balance
// 1: AccountBalance -> updated lottery account balance
// 2: SecretLotteryState -> new lottery state
// 3: ComputationResult -> whether the purchase was successful or not
#[zk_compute(shortname = 0x74)]
pub fn purchase_lottery_ticket(
    lottery_ticket_purchase_id: SecretVarId,
    purchaser_balance_id: SecretVarId,
    lottery_balance_id: SecretVarId,
    lottery_state_id: SecretVarId,
    ticket_price: u128
) -> (AccountBalance, AccountBalance, SecretLotteryState, ComputationResult) {
    let mut lottery_ticket_purchase_secret: LotteryTicketPurchaseSecret =
        load_sbi::<LotteryTicketPurchaseSecret>(lottery_ticket_purchase_id);

    let mut purchaser_balance: AccountBalance = load_sbi::<AccountBalance>(purchaser_balance_id);
    let mut lottery_balance: AccountBalance = load_sbi::<AccountBalance>(lottery_balance_id);

    let mut lottery_state: SecretLotteryState = load_sbi::<SecretLotteryState>(lottery_state_id);

    let secret_amount = lottery_ticket_purchase_secret.tickets * Sbu128::from(ticket_price);
    let mut successful = Sbu1::from(false);

    if !is_negative(purchaser_balance.balance - secret_amount) {
        // If the purchaser has enough balance, we can proceed with the purchase
        successful = Sbu1::from(true);

        // Decrease the credits from the sender balance
        purchaser_balance.balance = purchaser_balance.balance - secret_amount;
        // Increase the lottery balance
        lottery_balance.balance = lottery_balance.balance + secret_amount;

        lottery_state.tickets = lottery_state.tickets + lottery_ticket_purchase_secret.tickets;
        lottery_state.entropy = lottery_state.entropy + lottery_ticket_purchase_secret.entropy;
    }

    (
        purchaser_balance,
        lottery_balance,
        lottery_state, 
        ComputationResult {
            amount: secret_amount,
            successful
        }
    )
}

// Picks a winner from the lottery using the generated entropy with the modulus of the number of tickets to find the winner.
// (Winner claims their winnings by calling `claim_winnings` function - cannot be done here as we need the winner known in metadata to handle balance change).
// Returns:
// 0: AccountBalance -> Update lottery balance
// 1: AccountBalance -> Creator balance
// 2: DrawResult -> whether the winner was successfully drawn or not
#[zk_compute(shortname = 0x75)]
pub fn draw_lottery_winner(
    secret_lottery_state_id: SecretVarId,
    lottery_balance_id: SecretVarId,
    creator_balance_id: SecretVarId,
    entry_cost: u128,
    prize_pool: u128,
    winner_index: u128
) -> (AccountBalance, AccountBalance, DrawResult) {
    let mut lottery_state: SecretLotteryState = load_sbi::<SecretLotteryState>(secret_lottery_state_id);
    let mut lottery_balance: AccountBalance = load_sbi::<AccountBalance>(lottery_balance_id);
    let mut creator_balance: AccountBalance = load_sbi::<AccountBalance>(creator_balance_id);

    let total_tickets = lottery_state.tickets;
    let mut winner_id = Sbu128::from(0);
    let lottery_account_key = lottery_balance.account_key;
        
    // Iterate over the entries until we find the winner
    let mut cidx = Sbu128::from(0); // Current index in the entries
    let sbu_winner_index = Sbu128::from(winner_index);

    for variable_id in secret_variable_ids() {
        let kind = load_metadata::<u8>(variable_id);

        if kind == VARIABLE_KIND_DISCRIMINANT_LOTTERY_TICKET_PURCHASE {
            let ticket: LotteryTicketPurchaseSecret = load_sbi::<LotteryTicketPurchaseSecret>(variable_id);

            // Found a lottery ticket
            if sbu_winner_index >= cidx && sbu_winner_index < cidx + ticket.tickets {
                // Found the winner
                winner_id = ticket.purchaser_account_key;

                let remainder_balance = 
                    lottery_balance.balance - Sbu128::from(prize_pool);

                if !is_negative(remainder_balance) {
                    // Move the remainder to the creator's balance
                    creator_balance.balance = creator_balance.balance + remainder_balance;

                    // Reduce the lottery balance by the amount of the remainder
                    lottery_balance.balance = lottery_balance.balance - remainder_balance;

                    // Winner will claim in a separate flow
                }
            } else {
                // Increment the current index by the number of tickets purchased
                cidx = cidx + ticket.tickets;
            }
        }
    }

    (
        lottery_balance,
        creator_balance,
        DrawResult {
            lottery_id: lottery_account_key,
            winner_id,
            successful: winner_id != Sbu128::from(0)
        }
    )
}

/// Claims the winnings for the winner of the lottery.
/// Returns:
/// 0: AccountBalance -> Updated winner balance
/// 1: AccountBalance -> Updated lottery balance
#[zk_compute(shortname = 0x76)]
pub fn claim_winnings(
    lottery_balance_id: SecretVarId,
    winner_balance_id: SecretVarId
) -> (AccountBalance, AccountBalance) {
    let mut lottery_balance: AccountBalance = load_sbi::<AccountBalance>(lottery_balance_id);
    let mut winner_balance: AccountBalance = load_sbi::<AccountBalance>(winner_balance_id);
    
    // Update the winner balance
    winner_balance.balance = winner_balance.balance + lottery_balance.balance;

    // Reset the lottery balance to zero
    lottery_balance.balance = Sbu128::from(0);
    
    (
        winner_balance,
        lottery_balance
    )
}

/// Produces true if the given [`SecretVarId`] points to a [`DepositBalanceSecrets`].
fn is_account_balance(variable_id: SecretVarId) -> bool {

    let kind = load_metadata::<u8>(variable_id);

    if kind == VARIABLE_KIND_DISCRIMINANT_USER_ACCOUNT {
        return true;
    } else if kind == VARIABLE_KIND_DISCRIMINANT_LOTTERY_ACCOUNT {
        return true;
    }

    false
}

/// Produces true if the given [`Sbu128`] would be negative if casted to [`Sbi128`].
fn is_negative(x: Sbu128) -> Sbu1 {
    let bits = x.to_le_bits();
    bits[128 - 1]
}