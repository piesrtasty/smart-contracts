const config = require("../config");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployments, getNamedAccounts } = require("hardhat");
const AccountAmountMerkleTree = require("./utils/account-amount-merkle-tree.js");
const accountClaimAmounts = require("./data.json");

const oneToken = ethers.BigNumber.from(10).pow(18);

const claimAdjustment = oneToken.mul("5");

const ELEMENT_NOT_IN_TREE_ERROR = "Element does not exist in Merkle tree";
const CLAIM_DISTRIBUTOR_INVALID_PROOF = "PubTokenDistributor: Invalid proof.";
const CLAIM_DISTRIBUTOR_ALREADY_CLAIMED =
  "PubTokenDistributor: Drop already claimed.";

describe("Token Distributor", () => {
  let token;
  let distributor;
  let snapshot;
  let tree;
  let claimant1Index = 10;
  let claimant2Index = 11;
  let claimant1Data = accountClaimAmounts[claimant1Index];
  let claimant2Data = accountClaimAmounts[claimant2Index];
  let claimant1Amount = ethers.BigNumber.from(claimant1Data.amount);
  let claimant2Amount = ethers.BigNumber.from(claimant2Data.amount);
  let claimant1Address = claimant1Data.account;
  let claimant2Address = claimant2Data.account;
  const airdropAmount =
    parseInt(config.BASE_AIRDROP_TOKENS) +
    parseInt(config.DCPT_MIGRATION_TOKENS);
  const airdropTokens = oneToken.mul(airdropAmount);

  before(async () => {
    ({ deployer } = await getNamedAccounts());
    await deployments.fixture(["distribute"]);
    token = await ethers.getContract("PUBToken");
    distributor = await ethers.getContract("TokenDistributor");
    tree = new AccountAmountMerkleTree(accountClaimAmounts);
  });

  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });

  describe("single claim", () => {
    it("successful claim", async () => {
      // Confirm initial balances
      expect(await token.balanceOf(claimant1Address)).to.equal(0);
      expect(await token.balanceOf(distributor.address)).to.equal(
        airdropTokens
      );
      const treeIndex = claimant1Index;
      const proof = tree.getProof(treeIndex, claimant1Address, claimant1Amount);
      await distributor.claim(
        treeIndex,
        claimant1Address,
        claimant1Amount,
        proof
      );
      // Confirm updated balances reflect claim
      expect(await token.balanceOf(claimant1Address)).to.equal(claimant1Amount);
      expect(await token.balanceOf(distributor.address)).to.equal(
        airdropTokens.sub(claimant1Amount)
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
        tree.getProof(claimant1Index, invalidClaimantAddress, claimant1Amount);
      } catch (e) {
        expect(e.message).to.equal(ELEMENT_NOT_IN_TREE_ERROR);
      }
    });
    it("confirm proof generation fails with invalid calim amount too large", async () => {
      const invalidClaimAmountTooLarge = claimant1Amount.add(claimAdjustment);
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
      const invalidClaimAmountTooSmall = claimant1Amount.sub(claimAdjustment);
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
      const invalidClaimAmountTooLarge = claimant1Amount.add(claimAdjustment);
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
      const invalidClaimAmountTooSmall = claimant1Amount.sub(claimAdjustment);
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

  describe("multiple claims", () => {
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
      expect(await token.balanceOf(claimant1Address)).to.equal(claimant1Amount);
      expect(
        await token.balanceOf(distributor.address),
        airdropTokens.sub(claimant1Amount)
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
      expect(await token.balanceOf(claimant1Address)).to.equal(claimant1Amount);
      expect(
        await token.balanceOf(distributor.address),
        airdropTokens.sub(claimant1Amount)
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
      expect(await token.balanceOf(claimant1Address)).to.equal(claimant1Amount);
      expect(
        await token.balanceOf(distributor.address),
        airdropTokens.sub(claimant1Amount).sub(claimant2Amount)
      );
    });
  });
});
