var ConvertLib = artifacts.require("./ConvertLib.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");
var MyGlobalRegistrar = artifacts.require("./MyGlobalRegistrar.sol");
var UrlHint = artifacts.require("./UrlHint.sol"); 


module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);
  deployer.deploy(MyGlobalRegistrar);
  deployer.deploy(UrlHint);
};
