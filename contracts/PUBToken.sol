// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PUBToken is ERC20, Ownable {
    constructor(uint256 totalSupply) ERC20("Pub", "PUB") {
        _mint(msg.sender, totalSupply);
    }
}
