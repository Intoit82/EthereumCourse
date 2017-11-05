pragma solidity ^0.4.8;

import "./RegisterAdvertisers.sol";
import "./RegisterPublishers.sol";
import "./RegisterTrustees.sol";

//Describes Register process for all parties 
contract RegisterAllParties is RegisterAdvertisers, RegisterPublishers, RegisterTrustees  {
    
    //Holds the black list for party registration
    mapping (address => bool) public blackList;
    
    event LogOnUpdateBlackList(address partyToUpdate, bool onOff);
    
    //Check party is not in the black list
    modifier notInBlackList()
    {
        require(blackList[msg.sender] == false);
        _;
    }
    
    //Update the party flag in the blacklist
    function updatePartyInBlackList(address party, bool setOnOff)
    running
    isOwner
    public
    returns(bool)
    {
        //update party flag in blackList
        blackList[party] = setOnOff;
        
        LogOnUpdateBlackList(party,setOnOff);
        
        return true;
    }
}
