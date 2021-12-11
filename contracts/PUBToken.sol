// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PUBToken is ERC20 {
    constructor(uint256 totalSupply) ERC20("Pub", "PUB") {
        _mint(msg.sender, totalSupply);
    }
}
