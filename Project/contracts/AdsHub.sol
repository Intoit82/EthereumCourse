pragma solidity ^0.4.8;

import "./AdsCampaign.sol";
import "./TrustedViews.sol";
import "./RegisterAllParties.sol";

//Describes Hub system for creating Ads campagin
contract AdsHub is RegisterAllParties, AdsCampaignDataStructures {
    
    //Maps the advertiser to its campagin
    mapping (address => address) public runningCampagins;
    
    //Maps the publisher to its views
    mapping (address => address) public runningViews;
    
    //Map the active campagins
    mapping (address => bool) public activeCampaigns;
    
    //Logs
    event LogCreateCampaignsContract(address advertiser,address campaignAddress);
    event LogUploadViews(address truseeAdd,address campaignAddress,uint numberOfViews);
    event LogClaimViews(address publisher,address campaignAddress);
    event LogWithdrawApprovedFunds(address publisher,address campaignAddress);
    
    
    modifier campaignAcitve(address campaignAddress)
    {
         //check campgain is active
         require(activeCampaigns[campaignAddress] == true);
         _;
    }
  

    //Create campagin (for advertisers)
    function createCampaignsContract() 
    running
    isAdvertiserRegistered
    public
    returns(address campaginContractAddress)
    {
        
        //create new campagin contract
        AdsCampaign trustedCampaign = new AdsCampaign(msg.sender);
        
        runningCampagins[msg.sender] = trustedCampaign; //add trustedCampaign
        activeCampaigns[trustedCampaign] = true; //set active campagin
        //TODO implement deactivate campagins in another function
        
        LogCreateCampaignsContract(msg.sender,trustedCampaign); //log
        return trustedCampaign; 
        
    } 
    
    //Upload trusted views for a given campagin from a given publisher (for Trustees)
    function uploadCampainViews(address publisherAddress,address campaignAddress,
                                int setLatitude,int setLongitude, uint numberOfViews,uint setMinDuration)
    running
    isTrusteeRegistered
    campaignAcitve(campaignAddress)
    public
    returns (bool)
    {
            
            //refer to the campagin contract
            AdsCampaign trustedCampaign = AdsCampaign(campaignAddress);
            
            //upload the new views
            if(trustedCampaign.uploadNewViews(publisherAddress,campaignAddress,  setLatitude, setLongitude,numberOfViews, setMinDuration))
            {
              //log
              LogUploadViews(msg.sender,campaignAddress,numberOfViews);
              return true;
            }
            
            
    }
    
    
    
     //claim the views for the given campagin (for publishers)
     //The publisher needs to generate the campaignKey from the hash of (advertiser address,campaginId)
    function claimCampaignViews(address campaignAddress,bytes32 key)
    running
    isPublisherRegistered
    campaignAcitve(campaignAddress)
    public
    returns (bool)
    {
        
            //refer to the campagin contract
            AdsCampaign trustedCampaign = AdsCampaign(campaignAddress);
            
            //upload the new views
            if(trustedCampaign.claimViews(msg.sender,key))
            {
                //log
                LogClaimViews(msg.sender,campaignAddress);
                return true;
            }
              
            
            
    }
    
    //Withdraw the apporved funds (for publishers)
    function withdrawFunds(address campaignAddress)
    running
    isPublisherRegistered
    campaignAcitve(campaignAddress)
    public
    returns (bool)
    {
        
            //refer to the campagin contract
            AdsCampaign trustedCampaign = AdsCampaign(campaignAddress);
            
            //upload the new views
            if(trustedCampaign.withdrawFunds(msg.sender))
            {
                //log
                LogWithdrawApprovedFunds(msg.sender,campaignAddress);
                return true;
            }
              
            
            
    }
   
  
    
    /*
    //disable done campaigns
    function disableDoneCampaigns(address campaignAddress, bytes32 key)
    isOwner
    running
    public
    returns (bool)
    {
        AdvertiserCampaigns doneCampaign = AdvertiserCampaigns(campaignAddress);
        if (!doneCampaign.disablePassDueCampaigns(key))
           return false;
        
        //log the event
        LogDoneCampaign(campaignAddress,key);
        return true;
    }
    */

    
}
