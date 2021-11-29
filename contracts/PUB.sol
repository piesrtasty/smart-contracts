// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PUB is ERC20 {
    constructor(address treasury) ERC20("Pub", "PUB") {
        _mint(treasury, 100_000_000 * 10**decimals());
    }
}
