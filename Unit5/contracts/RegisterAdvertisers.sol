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
      
       
       //TODO check funds and active campaigns
       //TODO close the campaigns
       //TODO do the same with Owner
       
       registeredAdvertisers[msg.sender] = false; // remove campagin
       
       return true;
    }
    
    
}
