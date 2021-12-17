const config = require("../config");

module.exports = async ({ getNamedAccounts }) => {
  const { treasury } = await getNamedAccounts();
  const pubToken = await ethers.getContract("PUBToken");
  const tokenDistributor = await ethers.getContract("TokenDistributor");
  // Transfer ownership of the token to the treasury
  try {
    await pubToken.transferOwnership(treasury);
    console.log(
      `Tansferred ownership of PUBToken contract (${pubToken.address}) to Treasury (${treasury})`
    );
  } catch (e) {
    console.log(
      `Failed to transfer ownership of PUBToken contract (${pubToken.address}) to Treasury (${treasury})`
    );
  }
  // Transfer ownership of the token distributor to the treasury
  try {
    await tokenDistributor.transferOwnership(treasury);
    console.log(
      `Tansferred ownership of TokenDistributor contract (${tokenDistributor.address}) to Treasury (${treasury})`
    );
  } catch (e) {
    console.log(
      `Failed to transfer ownership of TokenDistributor contract (${tokenDistributor.address}) to Treasury (${treasury})`
    );
  }
};
module.exports.dependencies = [
  "PUBToken",
  "TokenDistributor",
  "TokenLockInvestor",
  "TokenLockTeam",
];
module.exports.tags = ["ownership"];
