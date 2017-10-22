//var Owned = artifacts.require("./Owned.sol");
//var Paused = artifacts.require("./Paused.sol");
//var AdsCampagin = artifacts.require("./AdsCampagin.sol");
//var AdsCampaginDataStrucutes = artifacts.require("./AdsCampaginDataStrucutes.sol");
//var AdsCampaginFunds = artifacts.require("./AdsCampaginFunds.sol");
var AdsHub = artifacts.require("./AdsHub.sol")

module.exports = function(deployer) {
  //deployer.deploy(ConvertLib);
  //deployer.link(ConvertLib, MetaCoin);
  //deployer.deploy(MetaCoin);

  deployer.deploy(AdsHub);
  //deployer.deploy(Paused);
  //deployer.deploy(AdsCampaginDataStrucutes);
  //deployer.deploy(AdsCampaginFunds);
  //deployer.deploy(AdsCampagin);
};
