const config = require("../config");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const pubToken = await ethers.getContract("PUBToken");
  await deploy("TokenDistributor", {
    from: deployer,
    args: [
      pubToken.address,
      config.MERKLE_ROOT[network.name],
      Math.floor(new Date(config.CLAIM_PERIOD_ENDS).getTime() / 1000),
    ],
    log: true,
  });
};
module.exports.tags = ["TokenDistributor"];
module.exports.dependencies = ["PUBToken"];
