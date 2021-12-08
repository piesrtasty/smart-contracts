const config = require("../config");

const oneToken = ethers.BigNumber.from(10).pow(18);

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();
  const pubToken = await ethers.getContract("PUBToken");
  const tokenDistributor = await ethers.getContract("TokenDistributor");
  const tokenLockInvestor = await ethers.getContract("TokenLockInvestor");
  const tokenLockTeam = await ethers.getContract("TokenLockTeam");

  // Transfer airdrop tokens to the token distributor
  const baseAirdropTokens = oneToken.mul(config.BASE_AIRDROP_TOKENS);
  const dcptMigrationTokens = oneToken.mul(config.DCPT_MIGRATION_TOKENS);
  const airdropTokens = baseAirdropTokens.add(dcptMigrationTokens);
  await (
    await pubToken.transfer(tokenDistributor.address, airdropTokens)
  ).wait();

  // Transfer investor tokens to the investor tokenLock
  // Transfer team tokens to the team tokenLock
};
module.exports.tags = ["distribute"];
module.exports.dependencies = [
  "PUBToken",
  "TokenDistributor",
  "TokenLockInvestor",
  "TokenLockTeam",
];
module.exports.id = "distribute";
