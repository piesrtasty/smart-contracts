// Convert exported CSV claim data to json

/** Example Input
 *
 * 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266,517
 * 0x70997970c51812dc3a010c7d01b50e0d17dc79c8,3697
 * 0x90f79bf6eb2c4f870365e785982e1f101e93b906,1402
 *
 */

/** Example Output
 *
 * [
 *  {
 *    address: "0x040629e31a68119093b9a0111257c8449c2f8e10",
 *    earnings: "68006000000000000000000",
 *    reasons: "",
 *  },
 *  ...
 * ]
 *
 */

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/claim-dataset.csv");

// Read CSV
const contents = fs.readFileSync(filePath, { encoding: "utf-8" }, (err) => {
  console.log(err);
});

const lines = contents.split("\n");

const output = [];

for (let i = 0; i < lines.length; i++) {
  const row = lines[i];
  const items = row.split(",");
  const [address, tokens] = items;
  // Convert tokens to value in WEI (18 decimals)
  const earnings = BigInt(parseInt(tokens) * Math.pow(10, 18)).toString();
  output.push({ address, earnings, reasons: "" });
}

const outputPath = path.join(__dirname, "../data/merkle-input.json");

fs.writeFileSync(outputPath, JSON.stringify(output), "utf8", (err) => {
  console.log(err);
});
