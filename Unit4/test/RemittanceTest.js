var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function(accounts) {
  it("Should Pass test", function() {
    return Remittance.deployed().then(function(instance) {
       return instance.claimBackTimeLimit.call();
     }).then(function (time) {
              assert.equal(time, 60, "60 wasn't the default claim back time limit: "
        + time.toString());
    });
  });

});
 

