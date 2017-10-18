pragma solidity ^0.4.8;

import "./Runnable.sol";
import "./AdsCampaignDataStructures.sol";
import "./AdsCampaign.sol";
import "./AdsCampaignFunding.sol";

//Describes Hub system for creating Ads campagin
contract AdsHub is Runnable, AdsCampaignDataStructures {
    
    //Holds the mapping for the created campagins
    mapping(address => bool) public campaignsCreated;
    
    //Logs
    event LogNewCampagin(address advertiserAddress,uint id,int setLatitude,int setLongitude,
                         uint setDurationInMinutes,uint setOfferDuration,uint pricePerAd, bytes32 contentLink,address contractAddress);
    event LogDoneCampaign(address CampaignAddress, bytes32 key);
    
    //Creates new AdsCampaign
    function advertiserRegister()
    //function newAdsCampaign(uint id,int setLatitude,int setLongitude,
    //uint setDurationInMinutes,uint setOfferDuration,uint pricePerAd, bytes32 contentLink)
    running
    public
    returns(address campaginContractAddress)
    {
        //create new campagin contract
        AdsCampaign trustedCampaign = new AdsCampaign(msg.sender);
        
        //create new campagin
       // var isSuccessfull = trustedCampaign.CreateNewAdvertimentCampaign(id, setLatitude, setLongitude,setDurationInMinutes, setOfferDuration, pricePerAd,  contentLink);
        
    //    require(isSuccessfull);
        campaignsCreated[trustedCampaign] = true; //add to mapping
        
      //  LogNewCampagin(msg.sender, id, setLatitude, setLongitude,
    //                     setDurationInMinutes, setOfferDuration, pricePerAd, contentLink,trustedCampaign);
                         
                         
        return trustedCampaign; 
        
    }
    
    //disable done campaigns
    function disableDoneCampaigns(address campaignAddress, bytes32 key)
    isOwner
    returns (bool)
    {
        AdsCampaign doneCampaign = AdsCampaign(campaignAddress);
        doneCampaign.disablePassDueCampaigns(key);
        
        //log the event
        LogDoneCampaign(campaignAddress,key);
        return true;
    }
    
    
}
