"use strict";
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const merkle_tree_1 = __importDefault(require("./merkle-tree"));
const ethers_1 = require("ethers");
const BalanceTree = /** @class */ (function () {
  function BalanceTree(balances) {
    this.tree = new merkle_tree_1.default(
      balances.map(function (_a, index) {
        const account = _a.account;
        const amount = _a.amount;
        return BalanceTree.toNode(index, account, amount);
      })
    );
  }
  BalanceTree.verifyProof = function (index, account, amount, proof, root) {
    let pair = BalanceTree.toNode(index, account, amount);
    for (let _i = 0, proof_1 = proof; _i < proof_1.length; _i++) {
      const item = proof_1[_i];
      pair = merkle_tree_1.default.combinedHash(pair, item);
    }
    return pair.equals(root);
  };
  // keccak256(abi.encode(index, account, amount))
  BalanceTree.toNode = function (index, account, amount) {
    return Buffer.from(
      ethers_1.utils
        .solidityKeccak256(
          ["uint256", "address", "uint256"],
          [index, account, amount]
        )
        .substr(2),
      "hex"
    );
  };
  BalanceTree.prototype.getHexRoot = function () {
    return this.tree.getHexRoot();
  };
  // returns the hex bytes32 values of the proof
  BalanceTree.prototype.getProof = function (index, account, amount) {
    return this.tree.getHexProof(BalanceTree.toNode(index, account, amount));
  };
  return BalanceTree;
})();
exports.default = BalanceTree;
