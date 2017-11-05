pragma solidity ^0.4.8;

import "./Runnable.sol";

//Describes Register process
contract RegisterPublishers is Runnable {
    
    //Holds the mapping for the created Publishers
    mapping(address => bool) public registeredPublishers;
    
    //Logs
    event LogPublisherRegisteration(address publisherAddress);
    
    //Is the Publisher registered 
    modifier isPublisherRegistered()
    {
       //check the publisher is registered
       require(registeredPublishers[msg.sender] == true);
       _;
    }
    
    //Register 
    function registerPublisher()
    running
    public
    returns(bool)
    {
        //Action that should be done by the web portal
        //Verify the identity of the party
        //Collect relavent information for registeration
        
        //check existing registeration
        require(registeredPublishers[msg.sender] != true);
        
        registeredPublishers[msg.sender] = true; //add to mapping
        
        LogPublisherRegisteration(msg.sender); //log
        
        //TODO create approval process for registration
        return true;
        
    } 
    
     //UnRegister by Publisher
    function unregisterPublisher()
    isPublisherRegistered
    running
    public
    returns (bool)
    {
      
       //Actions that should be done by the web portal
       //TODO check funds and active campaigns
       //TODO close the campaigns
       //TODO do the same with Owner
       
       registeredPublishers[msg.sender] = false; // remove campagin
       
       return true;
    }
    
    
}
