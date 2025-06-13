
//! This module provides an interface for interacting with MPC20 token contracts.
//! 
//! MPC20 is the Partisia Blockchain's equivalent of ERC20 tokens, providing a standard
//! token interface with privacy features powered by Multi-Party Computation (MPC).
//! This module contains utilities for transferring tokens between accounts, checking
//! balances, and other token operations needed by the lottery system.

use pbc_contract_common::address::Address;
use pbc_contract_common::events::{EventGroupBuilder, GasCost};
use pbc_contract_common::shortname::Shortname;

/// Represents an individual [MPC20 contract](https://partisiablockchain.gitlab.io/documentation/smart-contracts/integration/mpc-20-token-contract.html) on the blockchain.
/// 
/// This struct provides methods to interact with the token contract for operations
/// like transferring tokens between accounts.
pub struct MPC20Contract {
    /// Address of the MPC20 token contract on the blockchain
    contract_address: Address,
}

/// Represents token transfer amounts for the MPC20 contract.
/// 
/// Uses u128 to accommodate tokens with large supplies and small decimal units.
pub type TokenTransferAmount = u128;

impl MPC20Contract {
    /// Shortname of the [`MPC20Contract::transfer`] invocation
    const SHORTNAME_TRANSFER: Shortname = Shortname::from_u32(0x01);

    /// Shortname of the [`MPC20Contract::transfer_from`] invocation
    const SHORTNAME_TRANSFER_FROM: Shortname = Shortname::from_u32(0x03);

    /// Gas amount sufficient for [`MPC20Contract::transfer`] invocation.
    ///
    /// Guarantees that the invocation does not fail due to insufficient gas.
    pub const GAS_COST_TRANSFER: GasCost = 15500;

    /// Gas amount sufficient for MPC20 [`MPC20Contract::transfer_from`] invocation.
    ///
    /// Guarantees that the invocation does not fail due to insufficient gas.
    pub const GAS_COST_TRANSFER_FROM: GasCost = 15500;

    /// Create new token contract representation for the given `contract_address`.
    ///
    /// It is expected that the given address indicates a [MPC20
    /// contract](https://partisiablockchain.gitlab.io/documentation/smart-contracts/integration/mpc-20-token-contract.html).
    pub fn at_address(contract_address: Address) -> Self {
        Self { contract_address }
    }

    /// Create an interaction with the `self` token contract, for transferring an `amount` of
    /// tokens from calling contract to `receiver`.
    pub fn transfer(
        &self,
        event_group_builder: &mut EventGroupBuilder,
        receiver: &Address,
        amount: TokenTransferAmount,
    ) {
        event_group_builder
            .call(self.contract_address, Self::SHORTNAME_TRANSFER)
            .argument(*receiver)
            .argument(amount)
            .with_cost(Self::GAS_COST_TRANSFER)
            .done();
    }

    /// Create an interaction with the `self` token contract, for transferring an `amount` of
    /// tokens from `sender` to `receiver`. Requires that calling contract have been given an
    /// allowance by `sender`, by using [`Self::approve`].
    pub fn transfer_from(
        &self,
        event_group_builder: &mut EventGroupBuilder,
        sender: &Address,
        receiver: &Address,
        amount: TokenTransferAmount,
    ) {
        event_group_builder
            .call(self.contract_address, Self::SHORTNAME_TRANSFER_FROM)
            .argument(*sender)
            .argument(*receiver)
            .argument(amount)
            .with_cost(Self::GAS_COST_TRANSFER_FROM)
            .done();
    }
}