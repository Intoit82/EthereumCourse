
const Promise = require("bluebird");
const AdsHub = artifacts.require("./AdsHub.sol");
const AdsCampaign = artifacts.require("./AdsCampaign.sol");

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
        var campaignAddr2;
        var adsCampaign;

        return adsHub.createCampaignsContract({from:advertiser})
        .then(function(txObject){

            const event0 = txObject.logs[0];
            console.log(event0.event);
            console.log(event0.args.advertiser);
            console.log(event0.args.campaignAddress);
            campaignAddr = event0.args.campaignAddress;
            return AdsCampaign.at(campaignAddr,{from:advertiser});
            
        })


        .then(function(instance){
            adsCampaign =instance;
            campaignAddr2 = adsCampaign.address;
            console.log("fetched add: ", campaignAddr2);
            return adsCampaign.advertiserAddress();
        })

        .then(function(addr){
            assert.strictEqual(addr,advertiser,"Advertiser address is not confirmed in the AdsCampaign");
        });

    });
        

       /* return adsHub.createCampaignsContract.call({from:advertiser})
        .then(function(instance){
            campaignAddr = instance;
            console.log("Created add:", campaignAddr);
            return adsHub.runningCampaigns[advertiser];
        })

        .then(function(isRunning){
            assert.isTrue(isRunning,"The campaign is not running");
            //return AdsCampaign.at(campaignAddr,{from:owner});
        }) 

        */


        
    

    /*



        //return Promise.all([() => adsHub.createCampaignsContract.call({from: advertiser})])
        return adsHub.createCampaignsContract.call({from: advertiser})
              .then(function(addr)
                 {  
                  campaignAddr = addr;
                  //console.log("Type:" , typeof(addr));
                  return console.log("campaignAddr: ", campaignAddr);
                 })
                 .then(AdsCampaign.at(campaignAddr,{from: advertiser}))
                 .then(function(instance) {
                    adsCampaign = instance; 
                    return  adsCampaign.advertiserAddress({from:owner})
                })
                 
                .then(add => assert.strictEqual(add,advertiser));
                // .then(() => AdsCampagin.new(advertiser,{from: advertiser}))
               //  .then(instance => campaignContract = instance)
               //  .then(campaignContract.advertiserAddress({from: owner}))
               // .then(advertiserAddr => assert.strictEqual(advertiserAddr,advertiser,"should be advertiser address on the campaign contract"));
                                      
    }); 
*/

});


