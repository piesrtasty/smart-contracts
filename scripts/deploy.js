// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers, upgrades } = require("hardhat");
const BigNumber = ethers.BigNumber;

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const MERKLE_ROOT =
    "0x7303fa15df153525f19bfb1cd9db0b88db7b738b30ce4f69dd955327500432df";

  const PUB = await ethers.getContractFactory("PUB");
  const pub = await upgrades.deployProxy(PUB);
  await pub.deployed();

  console.log("PUB token contract deployed to:", pub.address);

  const TokenDistributor = await ethers.getContractFactory("TokenDistributor");
  const distributor = await TokenDistributor.deploy(pub.address, MERKLE_ROOT);

  await distributor.deployed();

  // Transfer tokens to distributor
  // 4.5m total airdrop tokens -> 4_500_000 * 10 ^ 18
  const AIRDROP_TOKENS = BigNumber.from("4500000000000000000000000");
  const distributorInitialSupply = AIRDROP_TOKENS;
  await pub.transfer(distributor.address, distributorInitialSupply);

  console.log("TokenDistributor contract deployed to:", distributor.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
