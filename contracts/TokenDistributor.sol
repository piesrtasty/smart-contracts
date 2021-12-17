// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";

contract TokenDistributor is Ownable {
    using BitMaps for BitMaps.BitMap;

    address public token;
    bytes32 public merkleRoot;
    uint256 public claimPeriodEnds; // Timestamp

    BitMaps.BitMap private claimed;

    // This event is triggered whenever a call to #claim succeeds.
    event Claimed(uint256 index, address account, uint256 amount);

    /**
     * @dev Constructor.
     * @param token_ Address of the token being distributed
     * @param merkleRoot_ Merkle root of tree used for airdrop
     * @param claimPeriodEnds_ The timestamp at which tokens are no longer claimable.
     */
    constructor(
        address token_,
        bytes32 merkleRoot_,
        uint256 claimPeriodEnds_
    ) {
        token = token_;
        merkleRoot = merkleRoot_;
        claimPeriodEnds = claimPeriodEnds_;
    }

    /**
     * @dev Allows the owner to sweep unclaimed tokens after the claim period ends.
     * @param dest The address to sweep the tokens to.
     */
    function sweep(address dest) external onlyOwner {
        require(
            block.timestamp > claimPeriodEnds,
            "PUB: Claim period not yet ended"
        );
        IERC20(token).transfer(dest, IERC20(token).balanceOf(address(this)));
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
