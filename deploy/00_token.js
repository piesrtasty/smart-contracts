const config = require("../config");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer, treasury } = await getNamedAccounts();
  const namedAccounts = await getNamedAccounts();
  console.log("named accounts", namedAccounts);
  console.log("deployer", deployer);
  await deploy("PUBToken", {
    from: deployer,
    args: [treasury],
    log: true,
  });
};
module.exports.tags = ["PUBToken"];
