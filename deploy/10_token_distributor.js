const config = require("../config");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const pubToken = await ethers.getContract("PUBToken");
  await deploy("TokenDistributor", {
    from: deployer,
    args: [pubToken.address, config.MERKLE_ROOT],
    log: true,
  });
};
module.exports.tags = ["TokenDistributor"];
module.exports.dependencies = ["PUBToken"];
