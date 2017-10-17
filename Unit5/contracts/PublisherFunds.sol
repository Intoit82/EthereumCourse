pragma solidity ^0.4.8;

import "./AdView.sol";
import "./AdsCampaign.sol";

//Defines the Ad view propeties and functionality for the blockchain
contract PublisherFunds is AdView
{
    //Holds the balances for the publishers
    mapping(bytes32 => uint) public publisherBalances;
    
    //Holds the link to the Ads campaign
    AdsCampaign adContact;
    
    //Define events
    event OnClaimViews(address publisher,bytes32 adCampaginKey,uint amountClaimed,uint minViewDuration);
    event OnRedeemFunds(address publisher,uint amount);
    
    //Sets the contracs address to link with the existing campagins
    function PublisherFunds(address adContactAddress)
    {
        adContact = AdsCampaign(adContactAddress);
    }
    
     //Upload to the blockchain new view data
    function claimViews(bytes32 adCampaginKey, bytes32 key)
    notPaused()
    public
    returns (bool)
    {
        var constructedKey = keccak256 ( msg.sender,key);
        require(views[adCampaginKey].publisherKey == constructedKey);
        
        var (isActive, balance, durationInMinutes,pricePerAd) = adContact.getCampaignPropertiesByKey(adCampaginKey);
        
        //check min duration time for each view
        require(views[adCampaginKey].minViewDuration >= durationInMinutes);
        
        //update the number of views in the balace for the publisher
        //Amount is price * number of views
        var amount = views[adCampaginKey].numberOfViews * pricePerAd;
        //set amount to be the max of (amount,balance)
        if(amount> balance)
          amount = balance;
        views[adCampaginKey].numberOfViews =0;
        views[adCampaginKey].exist = false;
        publisherBalances[constructedKey] += amount;
        
        //log
        OnClaimViews(msg.sender,adCampaginKey,amount, views[adCampaginKey].minViewDuration);
        
        return true;
    }
    
      //Allow the publisher to reedem the funds 
    function redeemFunds(bytes32 publisherKey)
    notPaused()
    public
    returns (bool)
    {
        //check for positive funds
       var constructedKey = keccak256 ( msg.sender,publisherKey);
        require(publisherBalances[constructedKey] > 0);
        
        //save the amounter to avoid re enterance attack
        var amount = publisherBalances[constructedKey];
        publisherBalances[constructedKey] =0;
        require(msg.sender.send(amount));
        
        //log
        OnRedeemFunds(msg.sender,amount);
        
        return true;
    }
    
    
}