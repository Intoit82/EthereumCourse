pragma solidity ^0.4.8;

import "./Runnable.sol";

//Describes Register process
contract RegisterAdvertisers is Runnable {
    
    //Holds the mapping for the created advertisers
    mapping(address => bool) public registeredAdvertisers;
    
    //Logs
    event LogAdvertiserRegisteration(address advertiserAddress);
    
    //Is the advertiser registered 
    modifier isAdvertiserRegistered()
    {
       //check the advertiser is registered
       require(registeredAdvertisers[msg.sender] == true);
       _;
    }
    
    //Register 
    function registerAdvertiser()
    running
    public
    returns(bool)
    {
        //Action that should be done by the web portal
        //Verify the identity of the party
        //Collect relavent information for registeration
        
        //check existing registeration
        require(registeredAdvertisers[msg.sender] != true);
        
        registeredAdvertisers[msg.sender] = true; //add to mapping
        
        LogAdvertiserRegisteration(msg.sender); //log
        
        //TODO create approval process for registration
        return true;
        
    } 
    
     //UnRegister by Advetiser
    function unregisterAdvertiser()
    isAdvertiserRegistered
    running
    public
    returns (bool)
    {
      
       //Actions that should be done by the web portal
       //TODO check funds and active campaigns
       //TODO close the campaigns
       //TODO do the same with Owner
       
       registeredAdvertisers[msg.sender] = false; // remove campagin
       
       return true;
    }
    
    
}
