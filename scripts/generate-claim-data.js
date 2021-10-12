const fs = require("fs");
const path = require("path");
const ethers = require("ethers");

/** 5 input sources
 *
 * 1. decrypt season 1 tokenholders (decrypt.csv)
 * 2. decrypt snapshot voters (decrypt-snapshot.csv)
 * 3. mirror airdrop list (mirror.csv)
 * 4. bankless token holders (bankless.csv)
 * 5. forefront token holders (forefront.csv)
 *
 */

const DEFAULT_ALLOCATION = 450;

const decryptPath = path.join(__dirname, "../data/decrypt.csv");
// Format =>  [ '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', '517' ]

const decrypSnapshotPath = path.join(__dirname, "../data/decrypt-snapshot.csv");
// Format =>  [ '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266']

const mirrorPath = path.join(__dirname, "../data/mirror.csv");
// Format =>  ['9814','0x48cd62c26f2392472a04b3175b59706d26e5008e','0.0','0.0','0.0','0.0','0.0','0.0','0.0','0.0','0.0','0.0','10','0','0.0','0.0','0.0','0.0\r']

const banklessPath = path.join(__dirname, "../data/bankless.csv");
// Format => [ '0xc95dbc0ee4f4fba75b40b05aa8ee6a42d6b539a0', '"2267"', '"No"\r' ]

const forefrontPath = path.join(__dirname, "../data/forefront.csv");
// Format => [ '0xced608aa29bb92185d9b6340adcbfa263dae075b', '"72"', '"No"\r' ]

const inputSources = [
  {
    filePath: decryptPath,
    addressIndex: 0,
    allocation: (columns) => columns[1],
  },
  {
    filePath: decrypSnapshotPath,
    addressIndex: 0,
    allocation: DEFAULT_ALLOCATION,
  },
  {
    filePath: mirrorPath,
    addressIndex: 1,
    allocation: DEFAULT_ALLOCATION,
  },
  {
    filePath: banklessPath,
    addressIndex: 0,
    allocation: DEFAULT_ALLOCATION,
  },
  {
    filePath: forefrontPath,
    addressIndex: 0,
    allocation: DEFAULT_ALLOCATION,
  },
];

const wallets = {};

for (let i = 0; i < inputSources.length; i++) {
  const { filePath, addressIndex, allocation } = inputSources[i];
  const contents = fs.readFileSync(filePath, { encoding: "utf-8" }, (err) => {
    throw err;
  });

  const lines = contents.split("\n");

  for (let j = 0; j < lines.length; j++) {
    const row = lines[j];
    const columns = row.split(",");
    try {
      const address = ethers.utils.getAddress(columns[addressIndex]);
      const value = parseInt(
        typeof allocation === "function" ? allocation(columns) : allocation
      );
      const addressExists = Object.prototype.hasOwnProperty.call(
        wallets,
        address
      );
      if (addressExists) {
        wallets[address] += value;
      } else {
        wallets[address] = value;
      }
    } catch (e) {}
  }
}

let outputStr = "";

for (const [key, value] of Object.entries(wallets)) {
  outputStr += `${key},${value}\r\n`;
}

const outputPath = path.join(__dirname, "../data/claim-dataset.csv");

fs.writeFileSync(outputPath, outputStr, "utf8", (err) => {
  console.log(err);
});
