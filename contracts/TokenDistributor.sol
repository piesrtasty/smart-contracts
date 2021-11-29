// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";

contract TokenDistributor {
    using BitMaps for BitMaps.BitMap;

    address public token;
    bytes32 public merkleRoot;

    BitMaps.BitMap private claimed;

    // This event is triggered whenever a call to #claim succeeds.
    event Claimed(uint256 index, address account, uint256 amount);

    constructor(address token_, bytes32 merkleRoot_) {
        token = token_;
        merkleRoot = merkleRoot_;
    }

    /**
     * @dev Returns true if the claim at the given index in the merkle tree has already been made.
     * @param index The index into the merkle tree.
     */
    function isClaimed(uint256 index) public view returns (bool) {
        return claimed.get(index);
    }

    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(
            !isClaimed(index),
            "PubTokenDistributor: Drop already claimed."
        );
        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(
            MerkleProof.verify(merkleProof, merkleRoot, node),
            "PubTokenDistributor: Invalid proof."
        );
        // Mark it claimed and send the token.
        claimed.set(index);
        require(
            IERC20(token).transfer(account, amount),
            "PubTokenDistributor: Transfer failed."
        );
        emit Claimed(index, account, amount);
    }
}
