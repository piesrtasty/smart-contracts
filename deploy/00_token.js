const config = require("../config");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const totalSupply = ethers.BigNumber.from(10)
    .pow(18)
    .mul(config.TOTAL_SUPPLY);
  await deploy("PUBToken", {
    from: deployer,
    args: [totalSupply],
    log: true,
  });
};
module.exports.tags = ["PUBToken"];
