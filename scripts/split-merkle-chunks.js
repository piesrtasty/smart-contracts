// This file contains the logic used to generate the chunks of data.
const { readFileSync, writeFileSync } = require("fs");

const file = readFileSync("./data/merkle-output.json").toString("utf-8");
const allClaims = JSON.parse(file).claims;

const sortedAddresses = Object.keys(allClaims);
sortedAddresses.sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));

// evenly divides 14130, the number of claims, into 157 files
const DESIRED_COHORT_SIZE = 90;

const addressChunks = {};

for (let i = 0; i < sortedAddresses.length; i += DESIRED_COHORT_SIZE) {
  const lastIndex = Math.min(
    i + DESIRED_COHORT_SIZE - 1,
    sortedAddresses.length - 1
  );
  addressChunks[sortedAddresses[i].toLowerCase()] =
    sortedAddresses[lastIndex].toLowerCase();
  writeFileSync(
    `./data/chunks/${sortedAddresses[i].toLowerCase()}.json`,
    JSON.stringify(
      sortedAddresses.slice(i, lastIndex + 1).reduce((claims, addr) => {
        claims[addr] = allClaims[addr];
        return claims;
      }, {})
    )
  );
}

writeFileSync(`./data/chunks/mapping.json`, JSON.stringify(addressChunks));
