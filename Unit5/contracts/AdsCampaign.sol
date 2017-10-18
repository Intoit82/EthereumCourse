pragma solidity ^0.4.8;

import "./Runnable.sol";
import "./AdsCampaignDataStructures.sol";

//Describes a bidding system within the blockchain between advertisers and publisher per location.
contract AdsCampaign is Runnable, AdsCampaignDataStructures {

        
    //Log events
    event LogNewAdCampaign(address sender,uint id, int setLatitude,int setLongitude, uint setDurationInMinutes,uint setOfferDuration,uint pricePerAd,bytes32 contentLink);
    event LogUpdateAdCampaign(address sender,uint id, int setLatitude,int setLongitude, uint setDurationInMinutes,uint setOfferDuration,uint pricePerAd);
    event LogStopCamgain(address sender,uint id);
    event LogContractPauseSet(bool isPaused);
    
    //Default constractor set the campagin creator as advertiser
    function AdsCampaign(address registeredAdvertiserAddress)
    {
        advertiserAddress = registeredAdvertiserAddress;
    }
    
    //Gets the campagin properties
    function getCampaignProperties(uint id)
    constant
    isAdvertiser
    public
    returns (bool isActive, uint balance,  int setLatitude,int setLongitude,
            uint setDurationInMinutes,uint setOfferDuration,uint pricePerAd,bytes32 contentLink)
    {
       var key = keccak256(msg.sender,id);
       
       //check if the campaigns really active
       var isReallyActive = campaigns[key].offerDuration > now && campaigns[key].isActive;
       return (isReallyActive,campaigns[key].balance,campaigns[key].latitude,campaigns[key].longitude,campaigns[key].durationInMinutes,
              campaigns[key].offerDuration,campaigns[key].pricePerAd,campaigns[key].contentLink);
    }
    
     //Gets the campagin properties
    function getCampaignPropertiesByKey(bytes32 key)
    constant
    public
    returns (bool isActive, uint balance, uint setDurationInMinutes,uint pricePerAd)
    {
       //check if the campaigns really active
       var isReallyActive = campaigns[key].offerDuration > now && campaigns[key].isActive;
       return (isReallyActive,campaigns[key].balance,campaigns[key].durationInMinutes
             ,campaigns[key].pricePerAd);
    }
    
   
    
    /*Creates a new advertisment campaign
    id - a uniqe number for each campaign for this advertiser
    Creates a new campaign in for the avdvertiser with the given id number.
    Sets all the parameters to the campaign data structure
    duration of Ad should be at least 50 seconds
    duration of offer to the publisher should be at least 50 seconds
    */
    function CreateNewAdvertimentCampaign(uint id,int setLatitude,int setLongitude,
    uint setDurationInMinutes,uint setOfferDuration,uint pricePerAd, bytes32 contentLink)
    public
    isAdvertiser
    running
    payable
    returns (bool)
    {
        //Create the campaignKey
        var campaignKey = keccak256(msg.sender,id);
        
        //Campain is not already active
        require(!campaigns[campaignKey].isActive);
        
        //check inputs
        require(setDurationInMinutes >= 50); //check for a valid duration
        require(setOfferDuration >= 50); //check for a valid duration
        require(pricePerAd > 0); //check for a valid maxBidOffer
        
        
        //create a new Campaign
        campaignProperties memory newCampaign;
        newCampaign.latitude = setLatitude;
        newCampaign.longitude = setLongitude;
        newCampaign.durationInMinutes = setDurationInMinutes;
        newCampaign.offerDuration = now + setOfferDuration; //add the offer durtion for the current time
        newCampaign.pricePerAd = pricePerAd;
        newCampaign.isActive = true;
        newCampaign.contentLink = contentLink;
        
        //add the campaign to the collection
        campaigns[campaignKey] = newCampaign;
        
        //log the event
        LogNewAdCampaign(msg.sender,id, setLatitude, setLongitude,setDurationInMinutes,setOfferDuration,pricePerAd,contentLink);
        
        return true;
        
    }
    
    //Update an existing advertisment campaign
    function updateExistingAdvertimentCampaign(uint id,int currentLatitude,int currentLongitude,uint newDurationInMinutes,uint newOfferDuration,uint pricePerAd)
    public
    isAdvertiser
    running
    campaignExist(id)
    returns (bool)
    {
        require(newDurationInMinutes > 50); //check for a valid duration
        require(newOfferDuration > 50); //check for a valid duration
        require(pricePerAd > 0); //check for a valid maxBidOffer
        
        var campaignKey = keccak256(msg.sender, id);
        
        //update the campaign
        campaigns[campaignKey].durationInMinutes = newDurationInMinutes;
        campaigns[campaignKey].offerDuration = now + newOfferDuration; //add the offer durtion for the current time;
        campaigns[campaignKey].pricePerAd = pricePerAd;
        
        //log the update
        LogUpdateAdCampaign(msg.sender,id, currentLatitude, currentLongitude, newDurationInMinutes, newOfferDuration, pricePerAd);
        
        return true;
        
    }
    
    //Stops an existing advertisment campaign
    function stopAdvertimentCampaign(uint id)
    public
    isAdvertiser
    running
    campaignExist(id)
    returns (bool)
    {
        var campaignKey = keccak256(msg.sender,id);
        
        //stops the campaign
        campaigns[campaignKey].isActive = false;
       
        //log the stop
        LogStopCamgain(msg.sender,id);
        
        return true;
        
    }
    
    //Go over all campaigns and remove pass due campaigns
    function disablePassDueCampaigns(bytes32 campaignKey)
    isOwner()
    running
    public
    returns (bool)
    {
        //check that the campaign is not active or offering time is due
        require(campaigns[campaignKey].isActive = false || campaigns[campaignKey].offerDuration > now);
        
        //Only clear campaigns which have no balances to continue or refund
        require(campaigns[campaignKey].balance == 0);
        
        //disable the campaign
        campaigns[campaignKey].isActive = false;
        campaigns[campaignKey].offerDuration = now -1;
        
        return true;
        
    }
    
  
}
