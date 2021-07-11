const Aave = artifacts.require("Aave");

module.exports = function (deployer) {
  deployer.deploy(Aave);
};
