pragma solidity ^0.4.8;

import "./TrustedViews.sol";
import "./AdsCampaignFundable.sol";

//Describes a bidding system within the blockchain between advertisers and publisher per location.
contract AdsCampaign is AdsCampaignFundable, TrustedViews {

        
    //Log events
    event LogNewAdCampaign(address sender,uint id, int setLatitude,int setLongitude, uint setDurationInMinutes,uint setOfferDuration,uint pricePerAd,bytes32 contentLink);
    event LogUpdateAdCampaign(address sender,uint id, int setLatitude,int setLongitude, uint setDurationInMinutes,uint setOfferDuration,uint pricePerAd);
    event LogStopCamgain(address sender,uint id);
    event LogReducingClaimedAmount(address publisherAdd,address campaignAdd,uint calimAmount,uint approvedAmount);
    event LogApprovedClaim(address publisherAdd,address campaignAdd,uint approvedAmount);
    event LogWithdrawFunds(address publisherAdd,address campaignAdd,uint amount);
    event LogContractPauseSet(bool isPaused);
    
    //Holds the advertiser address - creator of the the Ads campaign 
    address public advertiserAddress;
    
    //Is this the advertiser
    modifier isAdvertiser()
    {
        require(msg.sender == advertiserAddress); 
        _;
    }
    
    
    //Default constractor set the campagin creator as advertiser
    function AdsCampaign(address registeredAdvertiserAddress)
    public
    {
        advertiserAddress = registeredAdvertiserAddress;
    }
    
    
    
    //TODO remove testingKey
    //Gets the campagin properties
    function getCampaignProperties(uint id)
    constant
    isAdvertiser
    public
    returns (bool isActive, uint balance,  int setLatitude,int setLongitude,
            uint setDurationInMinutes,uint setOfferDuration,uint pricePerAd,bytes32 contentLink,bytes32 testingKey)
    {
       var key = keccak256(msg.sender,id);
       
       //check if the campaigns really active
       var isReallyActive = campaigns[key].offerDuration > now && campaigns[key].isActive;
       return (isReallyActive,campaigns[key].balance,campaigns[key].latitude,campaigns[key].longitude,campaigns[key].viewDuration,
              campaigns[key].offerDuration,campaigns[key].pricePerAd,campaigns[key].contentLink,key);
    }
    
     //Gets the campagin properties
    function getCampaignPropertiesByKey(bytes32 key)
    constant
    public
    returns (bool isActive, uint balance, uint setDurationInMinutes,uint pricePerAd)
    {
       //check if the campaigns really active
       var isReallyActive = campaigns[key].offerDuration > now && campaigns[key].isActive;
       return (isReallyActive,campaigns[key].balance,campaigns[key].viewDuration
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
    uint setViewDuration,uint setOfferDuration,uint pricePerAd, bytes32 contentLink)
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
        require(setViewDuration >= 50); //check for a valid duration
        require(setOfferDuration >= 50); //check for a valid duration
        require(pricePerAd > 0); //check for a valid maxBidOffer
        
        
        //create a new Campaign
        campaignProperties memory newCampaign;
        newCampaign.latitude = setLatitude;
        newCampaign.longitude = setLongitude;
        newCampaign.viewDuration = setViewDuration;
        newCampaign.offerDuration = now + setOfferDuration; //add the offer durtion for the current time
        newCampaign.pricePerAd = pricePerAd;
        newCampaign.isActive = true;
        newCampaign.contentLink = contentLink;
        
        //add the campaign to the collection
        campaigns[campaignKey] = newCampaign;
        
        //log the event
        LogNewAdCampaign(msg.sender,id, setLatitude, setLongitude,setViewDuration,setOfferDuration,pricePerAd,contentLink);
        
        return true;
        
    }
    
    //Update an existing advertisment campaign
    function updateExistingAdvertimentCampaign(uint id,int currentLatitude,int currentLongitude,uint newViewDuration,uint newOfferDuration,uint pricePerAd)
    public
    isOwner
    running
    campaignExist(id)
    returns (bool)
    {
        require(newViewDuration > 50); //check for a valid duration
        require(newOfferDuration > 50); //check for a valid duration
        require(pricePerAd > 0); //check for a valid maxBidOffer
        
        var campaignKey = keccak256(msg.sender, id);
        
        //update the campaign
        campaigns[campaignKey].viewDuration = newViewDuration;
        campaigns[campaignKey].offerDuration = now + newOfferDuration; //add the offer durtion for the current time;
        campaigns[campaignKey].pricePerAd = pricePerAd;
        
        //log the update
        LogUpdateAdCampaign(msg.sender,id, currentLatitude, currentLongitude, newViewDuration, newOfferDuration, pricePerAd);
        
        return true;
        
    }
    
    
    //Upload to the blockchain new view data
    //Minimum of 100 views per upload
    function uploadNewViews(address publisherAddress,address setCampaignAddress,
                            int setLatitude,int setLongitude, uint numberOfViews,uint setMinDuration)
    isOwner
    running
    public
    returns (bool)
    {
       
        //check for valid imputs
        require(numberOfViews >100);
        require(setMinDuration >0);
        
         //create a unique key for the views
        var key = keccak256(publisherAddress,setCampaignAddress);
        
        //check no such view is already define and active
        require(views[key].exist == false);
        
        //set new values for the view
        views[key].latitude = setLatitude;
        views[key].longitude = setLongitude;
        views[key].minViewDuration = setMinDuration;
        views[key].numberOfViews = numberOfViews;
        views[key].exist = true;
        
        //log
        OnNewViewUpload(publisherAddress,setCampaignAddress,setLatitude,setLongitude,
                        numberOfViews,setMinDuration);
        
        return true;
    }
    
    //Claim Views from sucessfull published campaign (for publishers)
    function claimViews(address publisherAddress,bytes32 campaignId)
    running
    isOwner
    public
    returns (bool)
    {
        
        
        var campaignBalance = campaigns[campaignId].balance;
        
        //check that balance for the campaigns
        require(campaignBalance >0);
        
         //create a unique key for the views
        var key = keccak256(publisherAddress,this);
        
        //Protect re- enterance attack
        var viewNumberTemp = views[key].numberOfViews;
        views[key].numberOfViews = 0;
        
        //check no such view is already define and active
        require(views[key].exist == true);
        require(viewNumberTemp >0);
        require(views[key].minViewDuration >= campaigns[campaignId].viewDuration); //check views are with standrads defined by the campaign
        
        
        var tokenAmount = viewNumberTemp * campaigns[campaignId].pricePerAd;
        
        //Set approved amount
        if (tokenAmount > campaignBalance)
        {
          tokenAmount = campaignBalance;
          LogReducingClaimedAmount(publisherAddress,this, viewNumberTemp * campaigns[campaignId].pricePerAd,tokenAmount);
        }
        
        //set the balance
        campaigns[campaignId].balance -= tokenAmount;
        
        //add the claimed tokens
        publishersApprovedClaims[publisherAddress] += tokenAmount;
        
        //log
        LogApprovedClaim(publisherAddress,this,tokenAmount);
        
        return true;
        
    }
    
    //Withdraw funds from approved claims (for publishers)
    function withdrawFunds(address publisherAddress)
    running
    isOwner
    public
    returns (bool)
    {
        
        //check for positive balance
        require(publishersApprovedClaims[publisherAddress] >0);
        
        //handle re enterance attack
        var amount = publishersApprovedClaims[publisherAddress];
        publishersApprovedClaims[publisherAddress] = 0;
        
        //send the funds
        require(publisherAddress.send(amount));
        
        //log
        LogWithdrawFunds(publisherAddress,this,amount);
        
        return true;
        
    }
    
    
    /* TODO needs to implement Pause mode for the campaign
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
        
    }*/
    
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
