const config = require("../config");
const fs = require("fs");
const path = require("path");

const oneToken = ethers.BigNumber.from(10).pow(18);

const GROUP_TEAM = "team";
const GROUP_INVESTOR = "investor";

module.exports = async ({ getNamedAccounts }) => {
  const { treasury } = await getNamedAccounts();
  const pubToken = await ethers.getContract("PUBToken");
  const tokenDistributor = await ethers.getContract("TokenDistributor");
  const tokenLockTeam = await ethers.getContract("TokenLockTeam");
  const tokenLockInvestor = await ethers.getContract("TokenLockInvestor");

  const DISTRIBUTION_GROUPS = {
    [GROUP_TEAM]: {
      lockContract: tokenLockTeam,
      file: "team-allocations.csv",
    },
    [GROUP_INVESTOR]: {
      lockContract: tokenLockInvestor,
      file: "investor-allocations.csv",
    },
  };

  const distributeToGroup = async (group) => {
    const { lockContract, file } = DISTRIBUTION_GROUPS[group];
    const filePath = path.join(__dirname, `../${file}`);
    if (fs.existsSync(filePath)) {
      console.log(`Distributing locked ${group} tokens`);
      const contents = fs.readFileSync(
        filePath,
        { encoding: "utf-8" },
        (err) => {
          throw err;
        }
      );
      const lines = contents.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const row = lines[i];
        const columns = row.split(",");
        const [address, amount] = columns;
        const validatedAddress = ethers.utils.getAddress(address);
        const lockedTokens = oneToken.mul(amount);
        try {
          await (
            await lockContract.lock(validatedAddress, lockedTokens)
          ).wait();
          console.log(`Locked ${amount} tokens for ${address}`);
        } catch (e) {
          console.log(`Error locking ${amount} tokens for ${address} - `, e);
        }
      }
    }
  };

  // Transfer airdrop tokens to the token distributor
  const airdropAmount =
    parseInt(config.BASE_AIRDROP_TOKENS) +
    parseInt(config.DCPT_MIGRATION_TOKENS);
  const airdropTokens = oneToken.mul(airdropAmount);
  console.log("Distributing airdrop tokens");
  try {
    await (
      await pubToken.transfer(tokenDistributor.address, airdropTokens)
    ).wait();
    console.log(
      `Transferred ${airdropAmount} tokens to TokenDistributor (${tokenDistributor.address})`
    );
  } catch (e) {
    console.log(
      `Error transferring ${airdropAmount} tokens to TokenDistributor (${tokenDistributor.address})`
    );
  }

  // Transfer team tokens to the team tokenLock
  const teamTokens = oneToken.mul(config.TEAM_TOKENS);
  await (await pubToken.approve(tokenLockTeam.address, teamTokens)).wait();
  await distributeToGroup(GROUP_TEAM);

  // Transfer investor tokens to the investor tokenLock
  const investortokens = oneToken.mul(config.INVESTOR_TOKENS);
  await (
    await pubToken.approve(tokenLockInvestor.address, investortokens)
  ).wait();
  await distributeToGroup(GROUP_INVESTOR);

  // Transfer remaining tokens to the treasury
  const totalSupply = oneToken.mul(config.TOTAL_SUPPLY);
  const remainingSupply = totalSupply
    .sub(airdropTokens)
    .sub(teamTokens)
    .sub(investortokens);
  console.log("Distributing remaining tokens to Treasury");
  try {
    await (await pubToken.transfer(treasury, remainingSupply)).wait();
    console.log(
      `Transferred ${
        remainingSupply.toString() / Math.pow(10, 18)
      } tokens to Treasury (${treasury})`
    );
  } catch (e) {
    console.log("e", e);
    console.log(
      `Error transferring ${airdropAmount} tokens to Treasury (${treasury})`
    );
  }
};
module.exports.tags = ["distribute"];
module.exports.dependencies = [
  "PUBToken",
  "TokenDistributor",
  "TokenLockInvestor",
  "TokenLockTeam",
];
module.exports.id = "distribute";
