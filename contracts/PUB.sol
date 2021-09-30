// contracts/DEME.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PUB is ERC20 {
    /// @notice Total number of tokens in circulation
    uint256 public initialTotalSupply = 100_000_000 * 10**decimals(); // 100 million DEME

    /**
     * @notice Construct a new PUB token
     */
    constructor() ERC20("Pub", "PUB") {
        _mint(msg.sender, initialTotalSupply);
    }
}
