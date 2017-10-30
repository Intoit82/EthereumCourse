
const Promise = require("bluebird");
const AdsHub = artifacts.require("./AdsHub.sol");
const AdsCampaign = artifacts.require("./AdsCampaign.sol");

Promise.all = require("../utils/sequentialPromise.js");
makeSureAreUnlocked = require("../utils/makeSureAreUnlocked.js");

contract('FullFlowTest', function(accounts) {


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
        var adsCampaign;
        var campaginKey;
        var preClaimBalance;

        return adsHub.createCampaignsContract({from:advertiser})
        .then(function(txObject){

            const event0 = txObject.logs[0];
            /*console.log(event0.event);
            console.log(event0.args.advertiser);
            console.log(event0.args.campaignAddress);
            console.log("Return value: ", txObject);*/
            campaignAddr = event0.args.campaignAddress;
            return AdsCampaign.at(campaignAddr,{from:advertiser});
            
        })


        .then(function(instance){
            adsCampaign =instance;
            return adsCampaign.advertiserAddress();
        })

        .then(function(addr){
           assert.strictEqual(addr,advertiser,"Advertiser address is not confirmed in the AdsCampaign");
           return adsCampaign.CreateNewAdvertimentCampaign(0,1,1,60,50,2,"Http:/adContent",{from:advertiser});
    
        })
        .then(function(isSuccess){
            return adsCampaign.getCampaignProperties.call(0,{from:advertiser});
        })
        .then(function(result){
            assert.strictEqual(result[0],true,"Campaign activation doesn't match");
            assert.strictEqual(result[1].toNumber(),0,"Campaign balance doesn't match");
            assert.strictEqual(result[2].toNumber(),1,"Campaign location doesn't match");
            assert.strictEqual(result[3].toNumber(),1,"Campaign location doesn't match");
            assert.strictEqual(result[4].toNumber(),60,"Campaign view duration doesn't match");
            assert.isAtLeast(result[5].toNumber(),50,"Campaign offer duration doesn't match");
            assert.strictEqual(result[6].toNumber(),2,"Campaign price rate doesn't match");
            
            console.log("result: ", result);
            campaginKey = result[8];
            console.log("Key: ", campaginKey); //work around for calculation of the sha3 key by web3
            return adsCampaign.fundCampaign(0, {from:advertiser, value: web3.toWei('5','ether') });
        })
        .then(function(result){
          console.log("campagin funded!");
          return adsCampaign.getCampaignProperties.call(0,{from:advertiser});
        })

         .then(function(result){
            var balance = result[1];
            assert.strictEqual(balance.toString(10),web3.toWei('5','ether'),"Campaign was not funded with the correct ether amount");
            console.log("Campaign balance: ", balance.toNumber());
            return adsHub.uploadCampainViews(publisher,campaignAddr,1,1,web3.toWei('1','ether'),500,{from: trustee});
                                
          })
         
         .then(function(result){
          console.log("Views updated by the trustee");
          return adsCampaign.getNumberOfViews.call(publisher,{from:publisher});
          })

         .then(function(numOfViews){
          assert.strictEqual(numOfViews.toString(10),web3.toWei('1','ether'),"Invalid number of views found for publisher");
          //var key = web3.utils.soliditySha3(advertiser,0);
          //console.log("key: ", key);
          return adsHub.claimCampaignViews(campaignAddr,campaginKey,{from:publisher});

         })

          .then(function(result){
          console.log("Publisher balance before withdrawal");
          return web3.eth.getBalance(publisher);
          
          
         })
         .then(function(balance){
          preClaimBalance = balance;
          console.log("Before Publisher balance: ", balance.toNumber());
         })        

         .then(function(result){
          console.log("Publisher has calimed the views");
          return adsHub.withdrawFunds(campaignAddr,{from:publisher});

        })

         .then(function(result){
          console.log("Publisher had withdraw his calimed funds");
          return web3.eth.getBalance(publisher);
          
          
         })

         .then(function(balance){
          assert.isTrue(preClaimBalance < balance.toNumber(),"Publisher balance has not increased");
          console.log("After Publisher balance: ", balance.toNumber());
          return web3.eth.getBalance(advertiser);
                   
         })

         .then(function(balance){
          console.log("Before refund Advertiser balance: ", balance.toNumber());
          console.log("wait for the Campaign to expire");
          setTimeout(RequestRefund, 50*1000);
          
          
          function RequestRefund() {
            console.log("Done waiting for Campaign to expire");
            return adsCampaign.refundCampaign(0,{from:advertiser})
              
              .then(function(result){
                console.log("Campaign was refunded");
                return web3.eth.getBalance(advertiser);
                         
               })

               .then(function(balance){
                console.log("After Advertiser balance: ", balance.toNumber());
                
               });

             }

         });

    });

});


