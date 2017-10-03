var StringUtils = artifacts.require("./StringUtils.sol");
var Splitter = artifacts.require("./Splitter.sol");
var Remittance = artifacts.require("./Remittance.sol");


module.exports = function(deployer) {
  deployer.deploy(StringUtils);
  deployer.link(StringUtils,Splitter);
  deployer.deploy(Splitter);
  deployer.deploy(Remittance);
 
};


