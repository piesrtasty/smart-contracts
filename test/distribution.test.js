const { expect } = require("chai");

const { ethers, upgrades } = require("hardhat");
const BigNumber = ethers.BigNumber;

const AccountAmountMerkleTree = require("./account-amount-merkle-tree.js");

// 5 tokens
const CLAIM_ADJUSTMENT = BigNumber.from("5000000000000000000");

// 4.5m total airdrop tokens -> 4_500_000 * 10 ^ 18
const AIRDROP_TOKENS = BigNumber.from("4500000000000000000000000");
const distributorInitialSupply = AIRDROP_TOKENS;

const accountClaimAmounts = require("./test-data.json");

const ELEMENT_NOT_IN_TREE_ERROR = "Element does not exist in Merkle tree";
const CLAIM_DISTRIBUTOR_INVALID_PROOF = "PubTokenDistributor: Invalid proof.";
const CLAIM_DISTRIBUTOR_ALREADY_CLAIMED =
  "PubTokenDistributor: Drop already claimed.";

async function main() {
  describe("Token Distributor", async () => {
    let token,
      accounts,
      treasury,
      claimant1Index,
      claimant2Index,
      claimant1Amount,
      claimant2Amount,
      claimant1Address,
      claimant2Address,
      claimant1Data,
      claimant2Data,
      distributor,
      tree,
      merkleRoot;

    beforeEach(async () => {
      accounts = await ethers.getSigners();

      // Initialize merkle tree from accounts data set
      tree = new AccountAmountMerkleTree(accountClaimAmounts);
      merkleRoot = tree.getHexRoot();

      treasury = accounts[0];

      claimant1Index = 10;
      claimant2Index = 11;

      claimant1Data = accountClaimAmounts[claimant1Index];
      claimant2Data = accountClaimAmounts[claimant2Index];

      claimant1Amount = BigNumber.from(claimant1Data.amount);
      claimant2Amount = BigNumber.from(claimant2Data.amount);

      claimant1Address = claimant1Data.account;
      claimant2Address = claimant2Data.account;

      // Deploy token contract
      const TokenContract = await ethers.getContractFactory("PUB");
      token = await TokenContract.deploy(treasury.address);

      // Deploy TokenDistributor contract
      const DistributorContract = await ethers.getContractFactory(
        "TokenDistributor"
      );
      distributor = await DistributorContract.deploy(token.address, merkleRoot);
      await distributor.deployed();

      // Transfer airdrop tokens to distributor
      await token
        .connect(treasury)
        .transfer(distributor.address, distributorInitialSupply);
    });

    describe("Single claim", () => {
      it("successful claim", async () => {
        // Confirm initial balances
        expect(await token.balanceOf(claimant1Address)).to.equal(0);
        expect(await token.balanceOf(distributor.address)).to.equal(
          distributorInitialSupply
        );

        // Generate merkle proof & successfully submit claim to contract
        const treeIndex = claimant1Index;
        const proof = tree.getProof(
          treeIndex,
          claimant1Address,
          claimant1Amount
        );
        await distributor.claim(
          treeIndex,
          claimant1Address,
          claimant1Amount,
          proof
        );

        // Confirm updated balances reflect claim
        expect(await token.balanceOf(claimant1Address)).to.equal(
          claimant1Amount
        );
        expect(await token.balanceOf(distributor.address)).to.equal(
          distributorInitialSupply.sub(claimant1Amount)
        );
      });

      it("confirm proof generation fails with invalid tree index", async () => {
        const invalidTreeIndex = claimant1Index - 1;
        try {
          tree.getProof(invalidTreeIndex, claimant1Address, claimant1Amount);
        } catch (e) {
          expect(e.message).to.equal(ELEMENT_NOT_IN_TREE_ERROR);
        }
      });

      it("confirm proof generation fails with invalid claimaint", async () => {
        const invalidClaimantAddress = claimant2Address;
        try {
          tree.getProof(
            claimant1Index,
            invalidClaimantAddress,
            claimant1Amount
          );
        } catch (e) {
          expect(e.message).to.equal(ELEMENT_NOT_IN_TREE_ERROR);
        }
      });

      it("confirm proof generation fails with invalid calim amount too large", async () => {
        const invalidClaimAmountTooLarge =
          claimant1Amount.add(CLAIM_ADJUSTMENT);
        try {
          tree.getProof(
            claimant1Index,
            claimant1Address,
            invalidClaimAmountTooLarge
          );
        } catch (e) {
          expect(e.message).to.equal(ELEMENT_NOT_IN_TREE_ERROR);
        }
      });

      it("confirm proof generation fails with invalid claim amount too small", async () => {
        const invalidClaimAmountTooSmall =
          claimant1Amount.sub(CLAIM_ADJUSTMENT);
        try {
          tree.getProof(
            claimant1Index,
            claimant1Address,
            invalidClaimAmountTooSmall
          );
        } catch (e) {
          expect(e.message).to.equal(ELEMENT_NOT_IN_TREE_ERROR);
        }
      });

      it("confirm claim fails with invalid tree index", async () => {
        const invalidTreeIndex = claimant1Index - 1;
        const proof = tree.getProof(
          claimant1Index,
          claimant1Address,
          claimant1Amount
        );
        await expect(
          distributor.claim(
            invalidTreeIndex,
            claimant1Address,
            claimant1Amount,
            proof
          )
        ).to.be.revertedWith(CLAIM_DISTRIBUTOR_INVALID_PROOF);
      });

      it("confirm claim fails with invalid claimant", async () => {
        const invalidClaimantAddress = claimant2Address;
        const proof = tree.getProof(
          claimant1Index,
          claimant1Address,
          claimant1Amount
        );
        await expect(
          distributor.claim(
            claimant1Index,
            invalidClaimantAddress,
            claimant1Amount,
            proof
          )
        ).to.be.revertedWith(CLAIM_DISTRIBUTOR_INVALID_PROOF);
      });

      it("confirm claim fails with invalid claim amount too large", async () => {
        const invalidClaimAmountTooLarge =
          claimant1Amount.add(CLAIM_ADJUSTMENT);
        const proof = tree.getProof(
          claimant1Index,
          claimant1Address,
          claimant1Amount
        );
        await expect(
          distributor.claim(
            claimant1Index,
            claimant1Address,
            invalidClaimAmountTooLarge,
            proof
          )
        ).to.be.revertedWith(CLAIM_DISTRIBUTOR_INVALID_PROOF);
      });

      it("confirm claim fails with invalid claim amount too small", async () => {
        const invalidClaimAmountTooSmall =
          claimant1Amount.sub(CLAIM_ADJUSTMENT);
        const proof = tree.getProof(
          claimant1Index,
          claimant1Address,
          claimant1Amount
        );
        await expect(
          distributor.claim(
            claimant1Index,
            claimant1Address,
            invalidClaimAmountTooSmall,
            proof
          )
        ).to.be.revertedWith(CLAIM_DISTRIBUTOR_INVALID_PROOF);
      });
    });

    describe("Multiple claims", async () => {
      it("confirm repeated claims fail", async () => {
        // Confirm claimant token balance is zero before claim
        expect(await token.balanceOf(claimant1Address)).to.equal(0);

        // Generate merkle proof & successfully submit claim to contract
        const proof = tree.getProof(
          claimant1Index,
          claimant1Address,
          claimant1Amount
        );
        await distributor.claim(
          claimant1Index,
          claimant1Address,
          claimant1Amount,
          proof
        );

        // confirm token balances reflect
        expect(await token.balanceOf(claimant1Address)).to.equal(
          claimant1Amount
        );
        expect(
          await token.balanceOf(distributor.address),
          distributorInitialSupply.sub(claimant1Amount)
        );

        // Confirm repeated claim will fail
        await expect(
          distributor.claim(
            claimant1Index,
            claimant1Address,
            claimant1Amount,
            proof
          )
        ).to.be.revertedWith(CLAIM_DISTRIBUTOR_ALREADY_CLAIMED);
      });

      it("confirm multiple claimants can successfully claim", async () => {
        /**
         * Successful claim for claimant 1
         */

        // Confirm claimaint1 token balance is zero before claim
        expect(await token.balanceOf(claimant1Address)).to.equal(0);

        // Generate merkle proof & successfully submit claim to contract
        const proof1 = tree.getProof(
          claimant1Index,
          claimant1Address,
          claimant1Amount
        );
        await distributor.claim(
          claimant1Index,
          claimant1Address,
          claimant1Amount,
          proof1
        );

        // confirm token balances reflect
        expect(await token.balanceOf(claimant1Address)).to.equal(
          claimant1Amount
        );
        expect(
          await token.balanceOf(distributor.address),
          distributorInitialSupply.sub(claimant1Amount)
        );

        /**
         * Successful claim for claimant 2
         */

        // Confirm claimaint1 token balance is zero before claim
        expect(await token.balanceOf(claimant2Address)).to.equal(0);

        // Generate merkle proof & successfully submit claim to contract
        const proof2 = tree.getProof(
          claimant2Index,
          claimant2Address,
          claimant2Amount
        );
        await distributor.claim(
          claimant2Index,
          claimant2Address,
          claimant2Amount,
          proof2
        );

        // confirm token balances reflect
        expect(await token.balanceOf(claimant1Address)).to.equal(
          claimant1Amount
        );
        expect(
          await token.balanceOf(distributor.address),
          distributorInitialSupply.sub(claimant1Amount).sub(claimant2Amount)
        );
      });
    });
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main();
