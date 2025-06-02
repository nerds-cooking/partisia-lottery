use create_type_spec_derive::CreateTypeSpec;
use pbc_zk::*;

const VARIABLE_KIND_DISCRIMINANT_ENTRY: u8 = 1;
const VARIABLE_KIND_DISCRIMINANT_WINNER: u8 = 2;
const VARIABLE_KIND_DISCRIMINANT_USER_ACCOUNT: u8 = 3;
const VARIABLE_KIND_DISCRIMINANT_LOTTERY_ACCOUNT: u8 = 4;

// Can represent a user account OR a lottery account
type AccountKey = Sbu128;
type SecretAccountBalance = Sbu128;

// Account balance for a user or a lottery
#[derive(Debug, Clone, CreateTypeSpec, SecretBinary)]
pub struct AccountBalance {
    pub account_key: AccountKey,
    pub balance: SecretAccountBalance,
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
    sender_balance_updated: SecretAccountBalance,
    recipient_balance_updated: SecretAccountBalance,
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
pub fn create_account(sender_balance_id: SecretVarId) -> AccountBalance {
    let mut account_details: AccountCreationSecret =
        load_sbi::<AccountCreationSecret>(sender_balance_id);

    let recipient_balance =
        find_recipient_balance(account_details.account_key, sender_balance_id);

    let account_key = if recipient_balance.exists {
        Sbu128::from(0)
    } else {
        account_details.account_key
    };
    AccountBalance {
        account_key,
        balance: Sbu128::from(0),
    }
}

/// Produces true if the given [`SecretVarId`] points to a [`DepositBalanceSecrets`].
fn is_account_balance(variable_id: SecretVarId) -> bool {

    let kind = load_metadata::<u8>(variable_id);

    if kind == VARIABLE_KIND_DISCRIMINANT_ENTRY {
        return true;
    } else if kind == VARIABLE_KIND_DISCRIMINANT_WINNER {
        return true;
    }

    false

}

/// Produces true if the given [`Sbu128`] would be negative if casted to [`Sbi128`].
fn is_negative(x: Sbu128) -> Sbu1 {
    let bits = x.to_le_bits();
    bits[128 - 1]
}
