pragma solidity ^0.4.8;

import './StringUtils.sol';

contract Splitter {
    
    //Addresses
    address private splitterAddress;
    address private receiver1;
    address private receiver2;
    address private owner;
    
    event LogSetAddress(address setAddress, string name);
    event LogFundsTransferred(string name, uint amount);
    
    //Sets the owner
    function Splitter() public
    {
        owner = msg.sender;
    }
    
    function setAccountType(string typeOfAccount) 
    public
    returns (bool success)
    {
        success = false;
        //make sure sender is not already defined
        require(msg.sender != splitterAddress);
        require(msg.sender != receiver1);
        require(msg.sender != receiver2);
        if (StringUtils.equal(typeOfAccount,"splitter") && splitterAddress == address(0))
        {
          splitterAddress = msg.sender;
          success = true;
         
        }
          
        if (StringUtils.equal(typeOfAccount,"first") && receiver1 == address(0))
        {
            receiver1 = msg.sender;
            success=true;
        }
          
        if (StringUtils.equal(typeOfAccount,"second") && receiver2 == address(0))
        {
            receiver2 = msg.sender;
            success = true;
        }
        
        if (success)
         LogSetAddress(msg.sender, typeOfAccount);
        
        return success;
        
          
        
    }
    
    function getBalance() 
    public
    constant
    returns (uint)
    {
        return msg.sender.balance;
    }
    
    function getContractBalance() 
    public
    constant
    returns (uint)
    {
        return this.balance;
    }
    
    function deposit()
    public
    payable
    returns (bool)
    {
        uint splitValue;
        
        if (msg.sender == splitterAddress)
        {
            require(receiver1 != address(0));
            require(receiver2 != address(0));
            
            splitValue =  msg.value /2;
            if(receiver1.send(splitValue)) 
               LogFundsTransferred("first",splitValue);
               else throw;
                
            if (receiver2.send(msg.value - splitValue))
               LogFundsTransferred("second",msg.value - splitValue);
               else throw;
            
        }
        
        return true;
    }
    
    
    
}