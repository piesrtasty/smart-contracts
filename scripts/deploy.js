// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const MERKLE_ROOT = process.env.MERKLE_ROOT;

  const PUB = await hre.ethers.getContractFactory("PUB");
  const pub = await PUB.deploy();

  await pub.deployed();

  console.log("PUB token contract deployed to:", pub.address);

  const TokenDistributor = await hre.ethers.getContractFactory(
    "TokenDistributor"
  );
  const distributor = await TokenDistributor.deploy(pub.address, MERKLE_ROOT);

  await distributor.deployed();

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
