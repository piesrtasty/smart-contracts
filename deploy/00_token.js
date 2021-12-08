module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer, treasury } = await getNamedAccounts();
  await deploy("PUBToken", {
    from: deployer,
    args: [treasury],
    log: true,
  });
};
module.exports.tags = ["PUBToken"];
