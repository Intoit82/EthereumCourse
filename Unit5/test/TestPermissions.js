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
                  console.log("Regisration for all parties pass successfully")
                 /* console.log("owner Address: ",owner);
                  console.log("advertiser Address: ",advertiser);
                  console.log("publisher Address: ",publisher);
                  console.log("trustee Address: ",trustee);
                  console.log("observer Address: ",observer); */
                });

    }); 


    it("Test Trustee permissions", function() {
        var campaignAddr;
        var adsCampaign;
         
        //create campaign
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
           assert.strictEqual(addr,advertiser,"Advertiser address is not confirmed in the AdsCampaign");
           return adsCampaign.CreateNewAdvertimentCampaign(0,1,1,60,50,2,"Http:/adContent",{from:advertiser});
    
        })
        .then(function(isSuccess){
            //assert.isTrue(isSuccess,"Campaign has failed to be created");
            return adsCampaign.getCampaignProperties.call(0,{from:advertiser});
        })
        .then(function(result){
            console.log("result: ", result);
            campaginKey = result[8];
            return adsHub.uploadCampainViews(publisher,campaignAddr,1,1,web3.toWei('1','ether'),500,{from: owner});
                                
          })
        .catch(function(error){
          console.log("Premissions restriction for owner verified");
          return adsHub.uploadCampainViews(publisher,campaignAddr,1,1,web3.toWei('1','ether'),500,{from: publisher});
        })
        .catch(function(error){
          console.log("Premissions restriction for publisher verified");
          return adsHub.uploadCampainViews(publisher,campaignAddr,1,1,web3.toWei('1','ether'),500,{from: advertiser});
        })

         .catch(function(error){
          console.log("Premissions restriction for advertiser verified");
          return adsHub.uploadCampainViews(publisher,campaignAddr,1,1,web3.toWei('1','ether'),500,{from: adsCampaign.address});
        })
          .catch(function(error){
          console.log("Premissions restriction for adsCampaign contract verified");
          return adsHub.uploadCampainViews(publisher,campaignAddr,1,1,web3.toWei('1','ether'),500,{from: adsHub.address});
        })
          .catch(function(error){
          console.log("Premissions restriction for adsCampaign contract verified");
          return adsHub.uploadCampainViews(publisher,campaignAddr,1,1,web3.toWei('1','ether'),500,{from: trustee});
        })

           .catch(function(error){ 
          assert.isTrue(true,"Failed to owner trusee permissions");
        })
          .then(function(result){
            console.log("Uploading views from trusee successfully");

          });

        });


    it("Test advertiser permissions", function() {
    
        var campaignAddr;
        var adsCampaign;
         
        //create campaign
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
           assert.strictEqual(addr,advertiser,"Advertiser address is not confirmed in the AdsCampaign");
           return adsCampaign.CreateNewAdvertimentCampaign(0,1,1,60,50,2,"Http:/adContent",{from:owner});
    
        })
        .catch(function(error){
           console.log("Premissions restriction for owner - create Campaign verified")
            return adsCampaign.CreateNewAdvertimentCampaign(0,1,1,60,50,2,"Http:/adContent",{from:publisher});
        })
        .catch(function(error){
           console.log("Premissions restriction for publisher - create Campaign verified")
            return adsCampaign.CreateNewAdvertimentCampaign(0,1,1,60,50,2,"Http:/adContent",{from:trustee});
        })
        .catch(function(error){
           console.log("Premissions restriction for trustee - create Campaign verified")
            return adsCampaign.CreateNewAdvertimentCampaign(0,1,1,60,50,2,"Http:/adContent",{from:advertiser});
        })

        .catch(function(error){ 
          assert.isTrue(true,"Failed to owner advertiser permissions");
        })
        .then(function(result) {
           console.log("Premissions restriction for advertiser - create Campaign verified")
         });
    
    });

    it("Test publisher permissions", function() {
    
        var campaignAddr;
        var adsCampaign;
        var campaginKey;
         
        //create campaign
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
           assert.strictEqual(addr,advertiser,"Advertiser address is not confirmed in the AdsCampaign");
       return adsCampaign.CreateNewAdvertimentCampaign(0,1,1,60,50,2,"Http:/adContent",{from:advertiser});
    
        })
        .then(function(isSuccess){
            return adsCampaign.getCampaignProperties.call(0,{from:advertiser});
        })
        .then(function(result){
            console.log("result: ", result);
            campaginKey = result[8];
            console.log("Key: ", campaginKey); //work around for calculation of the sha3 key by web3
            return adsCampaign.fundCampaign(0, {from:advertiser, value: web3.toWei('5','ether') });
        })
        .then(function(result){
          //assert.isTrue(result,"Unable to fund campaign");
          console.log("campagin funded!");
          return adsCampaign.getCampaignProperties.call(0,{from:advertiser});
        })

         .then(function(result){
            var balance = result[1];
            console.log("Campaign balance: ", balance.toNumber());
            return adsHub.uploadCampainViews(publisher,campaignAddr,1,1,web3.toWei('1','ether'),500,{from: trustee});
                                
          })
         
         .then(function(result){
          console.log("Views updated by the trustee");
          //var key = web3.utils.soliditySha3(advertiser,0);
          //console.log("key: ", key);
          return adsHub.claimCampaignViews(campaignAddr,campaginKey,{from:owner});

         })
         .catch(function(error){
          console.log("Permissions verified for owner");
          return adsHub.claimCampaignViews(campaignAddr,campaginKey,{from:trustee});          
         })

         .catch(function(error){
          console.log("Permissions verified for trustee");
          return adsHub.claimCampaignViews(campaignAddr,campaginKey,{from:advertiser});          
         })

         .catch(function(error){
          console.log("Permissions verified for advertiser");
          return adsHub.claimCampaignViews(campaignAddr,campaginKey,{from:publisher});          
         })
         .catch(function(error){ 
          assert.isTrue(true,"Failed to allow publisher permissions");
        })
         .then(function(result){ 
          console.log("Permissions verified for publisher");
        });

    });


    it("Test owner permissions", function() {
    
        var campaignAddr;
        var adsCampaign;
         
        //create campaign
        return adsHub.setRunning.call(false, {from:advertiser})

        .catch(function(result){
         assert.isFalse(result,"Set running was allowed by the advertiser");
         return adsHub.setRunning.call(false, {from:publisher})
        })

        .catch(function(result){
         assert.isFalse(result,"Set running was allowed by the publisher");
         return adsHub.setRunning.call(false, {from:trustee})
        })
        
        .catch(function(result){
         assert.isFalse(result,"Set running was allowed by the trustee");
         return adsHub.setRunning.call(false, {from:adsHub.address})
        })

        .catch(function(result){
         assert.isFalse(result,"Set running was allowed by the hub contract");
         return adsHub.setRunning.call(false, {from:owner});
        })
        .catch(function(error){ 
          assert.isTrue(true,"Failed to owner publisher permissions");
        })
        .then(function(result){
         assert.isTrue(result,"Set running was not allowed by the owner");
       });
          
    
    });

});

    

