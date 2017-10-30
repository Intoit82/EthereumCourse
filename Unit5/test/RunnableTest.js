const Promise = require("bluebird");
const AdsHub = artifacts.require("./AdsHub.sol");
const AdsCampaign = artifacts.require("./AdsCampaign.sol");

Promise.all = require("../utils/sequentialPromise.js");
makeSureAreUnlocked = require("../utils/makeSureAreUnlocked.js");

contract('RunnableTest', function(accounts) {


     //set addresses
    let owner, advertiser, publisher, trustee, observer;
    let adsHub;

    before("should have unlocked accounts", () => {
        assert.isAtLeast(accounts.length, 5, "should have at least 5 account");
        [ owner, advertiser, publisher, trustee, observer ] = accounts;
        return makeSureAreUnlocked([ owner, advertiser, publisher, trustee, observer ]);
    });

    beforeEach("should deploy a AdsHub", function() {
        return Promise.all([
                () => AdsHub.new({ from: owner })
                   ])
            .then(createds => [ adsHub ] = createds)

            //Advertiser
            .then(() => adsHub.registerAdvertiser({from: advertiser}))
            .then(() => adsHub.registeredAdvertisers(advertiser, {from: advertiser}))
            .then(isRegistered => assert.isTrue(isRegistered,"should do advertiser registration")) 

            //Publisher
            .then(() => adsHub.registerPublisher({from: publisher}))
            .then(() => adsHub.registeredPublishers(publisher, {from: publisher}))
            .then(isRegistered => assert.isTrue(isRegistered,"should do publisher registration"))
            //Trustee
            .then(() => adsHub.registerTrustee({from: trustee}))
            .then(() => adsHub.registeredTrustees(trustee, {from: trustee}))
            .then(isRegistered => 
                { assert.isTrue(isRegistered,"should do trustee registration");
                  console.log("owner Address: ",owner);
                  console.log("advertiser Address: ",advertiser);
                  console.log("publisher Address: ",publisher);
                  console.log("trustee Address: ",trustee);
                  console.log("observer Address: ",observer);
                });

    }); 
  

    it("Should stop on runnable change", function() {
        var campaignAddr;
        var adsCampaign;
        var campaginKey;
        var preClaimBalance;

        return adsHub.createCampaignsContract({from:advertiser})
        .then(function(txObject){

            const event0 = txObject.logs[0];
            campaignAddr = event0.args.campaignAddress;
            return AdsCampaign.at(campaignAddr,{from:advertiser});
            
        })


        .then(function(instance){
            adsCampaign =instance;
            return adsCampaign.advertiserAddress();
        })

        .then(function(addr){
            return adsCampaign.setRunning(false,{from:advertiser});
        })

        .then(function(txObject){
            const event0 = txObject.logs[0];
            assert.isFalse(event0.args.isRunning,"Unable to stop contract from running");
            return adsCampaign.CreateNewAdvertimentCampaign(0,1,1,60,50,2,"Http:/adContent",{from:advertiser});
        })
        .then(function(noError){
            assert.isTrue(false,"Should not be able to create new campaign when contract is not running");
        })

        .catch(function(error){
            console.log("Unable to create new campaign as expected - contract is not running");
            adsCampaign.setRunning(true,{from:advertiser});
            return adsCampaign.CreateNewAdvertimentCampaign(0,1,1,60,50,2,"Http:/adContent",{from:advertiser});
        })

        .then(function(txObject){
            console.log("Contract campaign was created successfully");
            const event0 = txObject.logs[0];
            assert.strictEqual(event0.args.sender,advertiser,"Advertiser should be able to create new campaign on running contract");
        });



    });
});

        