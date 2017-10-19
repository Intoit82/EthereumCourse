pragma solidity ^0.4.8;

import "./Runnable.sol";
import "./AdvertiserCampaigns.sol";

//Defines the Ad view propeties and functionality for the blockchain
contract PublisherViews is Runnable
{
   
    //holds the balance for the publisher
    uint balance;
    
    //Holds the link to the Ads campaign
    AdvertiserCampaigns adContact;
    
    //holds the publisher address
    address public publisherAddress;
    
    //Check for publisher address
    modifier isPublisher()
    {
        require(msg.sender == publisherAddress);
        _;
    }
    
    //Define events
    event OnClaimViews(address publisher,bytes32 adCampaginKey,uint amountClaimed,uint minViewDuration);
    event OnRedeemFunds(address publisher,uint amount);
    
    //Sets the contracs address to link with the existing campagins
    function PublisherViews(address getPublisherAddress,address adContactAddress)
    public
    {
        adContact = AdvertiserCampaigns(adContactAddress); //set the related campaign
        publisherAddress = getPublisherAddress; //set the publisher
    }
    
  

    
      //Allow the publisher to reedem the funds 
    function redeemFunds()
    running   
    isPublisher
    public
    returns (bool)
    {
        TrustedViews tViews = TrustedViews(); //todo
        
        //check for positive funds
        require(balance> 0);
        
        //save the amounter to avoid re enterance attack
        var amount = balance;
        balance =0;
        require(msg.sender.send(amount));
        
        //log
        OnRedeemFunds(msg.sender,amount);
        
        return true;
    }
    
    
}
