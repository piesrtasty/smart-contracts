// contracts/DEME.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DEME is ERC20, AccessControl {
    /// @notice Total number of tokens in circulation
    uint256 public initialTotalSupply = 100_000_000 * 10**decimals(); // 100 million DEME

    /// @notice role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * @notice Construct a new DEME token
     * @param account The initial account to grant all the tokens
     * @param minter_ The account with the minting ability
     */
    constructor(address account, address minter_)
        ERC20("Decentralized Media", "DEME")
    {
        _mint(account, initialTotalSupply);
        _setupRole(MINTER_ROLE, minter_);
    }
}
