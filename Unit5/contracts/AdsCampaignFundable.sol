pragma solidity ^0.4.8;

import "./Runnable.sol";
import "./AdsCampaignDataStructures.sol";

//Todo handle gas? implement settles


//Describes the funding process for each campaign
contract AdsCampaignFundable is Runnable, AdsCampaignDataStructures {
    
    //Describes the address and balances that were uncalimed and saved as vaults
    mapping(address => uint) public uncalimedFundsVault;
    
    //Describes the address and balances for publishers with approved claims
    mapping(address => uint) public publishersApprovedClaims;
    
    //Log events
    event LogFundCampagin(address sender,uint id, uint amount);
    event LogRefundCampagin(address sender,uint id, uint amount);
    event LogMoveFundsToVault(address sender,uint id, uint amount);
    event LogCalimFromVault(address sender, uint amount);
    
     //Is campaign exist modifier
    modifier canRefund(uint id)
    {
        bytes32 campaignKey = keccak256(msg.sender,id);
        //check that the campaign is not active or offering time is due
        require(campaigns[campaignKey].isActive == false || campaigns[campaignKey].offerDuration > now);
        
        //require balance to exist
        require(campaigns[campaignKey].balance > 0);
        _;
    }

  
    //TODO should restric funding?
     //Fund an active campaigns
    //The amount of invested funds in the campaign must be at least 1000 tokens
    function fundCampaign(uint id)
    public
    running
    campaignExist(id) //check the campaignExist
    payable
    returns (bool)
    {
       require(msg.value >= 1000); //check for a valid minimum funding
       
       //update the balance
       var campaignKey = keccak256(msg.sender,id);
       campaigns[campaignKey].balance += msg.value;
       
       //log
       LogFundCampagin(msg.sender,id,msg.value);
       
       return true;
    }
    

     //Refund a Campaign
    function refundCampaign(uint id)
    canRefund(id)
    running
    public
    returns (bool)
    {
        var campaignKey = keccak256(msg.sender,id);
       
        //Handle re enterance attack
        var tempBalance = campaigns[campaignKey].balance;
        campaigns[campaignKey].balance =0;
        
        require(msg.sender.send(tempBalance));
        
        //log
        LogRefundCampagin(msg.sender,id,tempBalance);
        
        return true;
    }
    
    //Force Refund for a Campaign to vault - for future reterival
    function moveRefundToVault(uint id, address reciever)
    isOwner()
    running
    canRefund(id)
    public
    returns (bool)
    {
        //generate the key
        var campaignKey = keccak256(reciever,id);
        
        //Handle re enterance attack
        var tempBalance = campaigns[campaignKey].balance;
        campaigns[campaignKey].balance =0;
        
        uncalimedFundsVault[reciever] += tempBalance;
        
        //log
        LogMoveFundsToVault(reciever,id, tempBalance);
        
        return true;
        
    }
    
    //calim Refund form vault
    function claimFundFromVault()
    running
    public
    returns (bool)
    {
        //check for funds
        require(uncalimedFundsVault[msg.sender] > 0);
        
        //Handle re enterance attack
        var tempBalance = uncalimedFundsVault[msg.sender];
        uncalimedFundsVault[msg.sender] =0;
        
        //send funds
        require(msg.sender.send(tempBalance));
        
        //log
        LogCalimFromVault(msg.sender,tempBalance);
        
        return true;
        
    }
}

