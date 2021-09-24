const hre = require("hardhat");
const { claims } = require("../data/merkle-output.json");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const HOPPER_ADDRESS = process.env.HOPPER_ADDRESS;
  const MERKLE_ROOT = process.env.MERKLE_ROOT;

  const accounts = await hre.ethers.getSigners();
  //   console.log("accounts", accounts);
  const hopperAccount = accounts[1];

  const claimant1Acct = accounts[10];
  const claimant2Acct = accounts[11];
  const claimant1Amt = 234;
  const claimant2Amt = 1128;
  const accountClaimAmounts = [
    { account: claimant1Acct, amount: claimant1Amt },
    { account: claimant2Acct, amount: claimant2Amt },
  ];

  console.log("claims", claims);

  console.log("accountClaimAmounts", accountClaimAmounts);
  console.log("HOPPER_ADDRESS", HOPPER_ADDRESS);
  console.log("MERKLE_ROOT", MERKLE_ROOT);

  const DEME = await hre.ethers.getContractFactory("DEME");
  const deme = await DEME.deploy(hopperAccount.address, hopperAccount.address);

  // We get the contract to deploy
  await deme.deployed();

  console.log("DEME token contract deployed to:", deme.address);

  const TokenDistributor = await hre.ethers.getContractFactory(
    "TokenDistributor"
  );
  const distributor = await TokenDistributor.deploy(deme.address, MERKLE_ROOT);

  await distributor.deployed();

  console.log("TokenDistributor contract deployed to:", distributor.address);

  await deme.connect(hopperAccount).transfer(distributor.address, 10000);

  const index = claims[claimant1Acct.address].index;
  const proof = claims[claimant1Acct.address].proof;
  console.log("proof", proof);
  //   console.log("index", index);
  await distributor
    .connect(claimant1Acct)
    .claim(index, claimant1Acct.address, claimant1Amt, proof);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
