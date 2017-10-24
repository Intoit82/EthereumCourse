
const Promise = require("bluebird");
const AdsHub = artifacts.require("./AdsHub.sol");
const AdsCampagin = artifacts.require("./AdsCampaign.sol");

Promise.all = require("../utils/sequentialPromise.js");
makeSureAreUnlocked = require("../utils/makeSureAreUnlocked.js");

contract('CreateAdsCampaignTest', function(accounts) {

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
  

    it("Should create a new campaign", function() {
        var campaignAddr;
        var campaignContract;
        //return Promise.all([() => adsHub.createCampaignsContract.call({from: advertiser})])
        return adsHub.createCampaignsContract.call({from: advertiser})
              .then(addr =>
                 {  
                  campaignAddr = addr;
                  //console.log("Type:" , typeof(addr));
                  console.log("campaignAddr: ", campaignAddr);
                  
                 })
                 .then(() => AdsCampagin.at(campaignAddr,{from: advertiser}))
                // .then(() => AdsCampagin.new(advertiser,{from: advertiser}))
                 .then(instance=> instance.advertiserAddress())
                 .then(advertiserAddr => assert.strictEqual(advertiserAddr,advertiser,"should be advertiser address on the campaign contract"));
                                      
    }); 

});
