pragma solidity ^0.4.8;

contract Owned {
    
    //holds the owner of the contract
    address public owner;
    
    //logs
    event LogChangeOwner(address prevOwner,address newOwner);

    //constructor save the owner address
    function Owned() 
    public
    {
        owner = msg.sender;
    }

    modifier isOwner {
        require (msg.sender == owner);
        _;
    }

    function setOwner(address newOwner)
    public
    isOwner {
        require (newOwner != 0);
        
        //change owner
        var tempOwner = owner;
        owner = newOwner;
        
        //log the event
        LogChangeOwner(tempOwner,newOwner);
    }
}
