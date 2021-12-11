const config = require("../config");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const pubToken = await ethers.getContract("PUBToken");
  await deploy("TokenLockInvestor", {
    from: deployer,
    contract: "TokenLock",
    args: [
      pubToken.address,
      Math.floor(new Date(config.INVESTOR_UNLOCK_BEGIN).getTime() / 1000),
      Math.floor(new Date(config.INVESTOR_UNLOCK_CLIFF).getTime() / 1000),
      Math.floor(new Date(config.INVESTOR_UNLOCK_END).getTime() / 1000),
    ],
    log: true,
  });
};
module.exports.tags = ["TokenLockInvestor"];
module.exports.dependencies = ["PUBToken"];
