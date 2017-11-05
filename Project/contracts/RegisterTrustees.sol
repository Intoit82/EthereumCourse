pragma solidity ^0.4.8;

import "./Runnable.sol";

//Describes Register process
contract RegisterTrustees is Runnable {
    
    //Holds the mapping for the created trustees
    mapping(address => bool) public registeredTrustees;
    
    //Logs
    event LogTrusteeRegisteration(address trusteeAddress);
    
    //Is the Trustee registered 
    modifier isTrusteeRegistered()
    {
       //check the Trustee is registered
       require(registeredTrustees[msg.sender] == true);
       _;
    } 
    
    //Register 
    function registerTrustee()
    running
    public
    returns(bool)
    {
        //Action that should be done by the web portal
        //Verify the identity of the party
        //Collect relavent information for registeration
        
        //check existing registeration
        require(registeredTrustees[msg.sender] != true);
        
        registeredTrustees[msg.sender] = true; //add to mapping
        
        LogTrusteeRegisteration(msg.sender); //log
        
        //TODO create approval process for registration
        return true;
        
    } 
    
     //UnRegister by Advetiser
    function unregisterAdvertiser()
    isTrusteeRegistered
    running
    public
    returns (bool)
    {
      
       //Actions that should be done by the web portal
       //TODO check funds and active campaigns
       //TODO close the campaigns
       //TODO do the same with Owner
       
       registeredTrustees[msg.sender] = false; // remove campagin
       
       return true;
    }
    
    
}
