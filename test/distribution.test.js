const { expect } = require("chai");

const hre = require("hardhat");
const ethers = hre.ethers;
const BigNumber = ethers.BigNumber;

const { claims, merkleRoot } = require("./merkle-output.json");

// const bTree = require("../lib/balance-tree");
// const BalanceTree = bTree.default;

const AccountAmountMerkleTree = require("./account-amount-merkle-tree.js");

// 100m total tokens -> 100_000_000 * 10 ^ 18
const TOTAL_TOKENS = BigNumber.from("100000000000000000000000000");

// 4.5m total airdrop tokens -> 4_500_000 * 10 ^ 18
const AIRDROP_TOKENS = BigNumber.from("4500000000000000000000000");
const distributorInitialSupply = AIRDROP_TOKENS;

const accountClaimAmounts = require("./test-data.json");

async function main() {
  describe("Smart Contracts", async () => {
    let token,
      accounts,
      hopperAcct,
      claimant1Acct,
      claimant2Acct,
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

      // This is the address we transfer tokens too when initializing the ERC20 contract
      hopperAcct = accounts[1];

      claimant1Acct = accounts[10];
      claimant2Acct = accounts[11];

      claimant1Data = accountClaimAmounts[10];
      claimant2Data = accountClaimAmounts[11];

      claimant1Address = claimant1Data.account;
      claimant2Address = claimant2Data.account;

      // Deploy token contract
      const TokenContract = await hre.ethers.getContractFactory("DEME");
      token = await TokenContract.deploy(
        hopperAcct.address,
        hopperAcct.address
      );

      // Deploy TokenDistributor contract
      const DistributorContract = await hre.ethers.getContractFactory(
        "TokenDistributor"
      );
      distributor = await DistributorContract.deploy(token.address, merkleRoot);
      await distributor.deployed();

      // Transfer airdrop tokens to distributor
      await token
        .connect(hopperAcct)
        .transfer(distributor.address, distributorInitialSupply);
    });

    describe("Single claim tests", () => {
      it("successful claim", async () => {
        // Confirm initial balances
        expect(await token.balanceOf(claimant1Address)).to.equal(0);
        expect(await token.balanceOf(distributor.address)).to.equal(
          distributorInitialSupply
        );

        // Submit claim
        // const { index, amount, proof } = claimant1Data;
        // Generate merkle proof & successfully submit claim to contract
        const treeIndex = 10;
        const proof = tree.getProof(
          treeIndex,
          claimant1Address,
          claimant1Data.amount
        );
        await distributor.claim(
          treeIndex,
          claimant1Address,
          claimant1Data.amount,
          proof
        );

        // Confirm updated balances reflect claim
        // expect(await token.balanceOf(claimant1Address)).to.equal(amount);
        // expect(await token.balanceOf(distributor.address)).to.equal(
        //   distributorInitialSupply.sub(amount)
        // );
      });

      it(" is a test", async () => {
        // console.log("BalanceTree", BalanceTree);
      });
    });
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main();
