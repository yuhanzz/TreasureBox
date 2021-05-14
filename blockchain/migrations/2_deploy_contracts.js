var TreasureboxOrders = artifacts.require("./TreasureboxOrders.sol");

module.exports = function(deployer) {
  deployer.deploy(TreasureboxOrders);
};
