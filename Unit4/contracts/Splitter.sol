pragma solidity ^0.4.8;

contract Splitter {
    
    //Addresses
    address private owner;
     
    
    //log every fund transfer
    event LogFundsTransferred(string name, uint amount);
    
    //Sets the owner for kill fuction
    function Splitter() public
    {
        owner = msg.sender;
    }

    //Allow to deposit funds and split it between two accounts
    function splitDeposit(address firstReceiver ,address secondReceiver)
    public
    payable
    returns (bool)
    {
        require(msg.value > 0); //check funds
        require(firstReceiver != secondReceiver); //check the two addresses are different
        require(firstReceiver != address(0)); //make sure address is not empty
        require(secondReceiver != address(0)); //make sure address is not empty
        require(firstReceiver != msg.sender); //make sure address is not sender
        require(secondReceiver != msg.sender); //make sure address is not sender
        
        
        //get the first value for the split
        uint splitValue =  msg.value /2;
            
        if(firstReceiver.send(splitValue)) 
           LogFundsTransferred("first",splitValue);
        else throw; //no transaction occure
                
        if (secondReceiver.send(msg.value - splitValue))
           LogFundsTransferred("second",msg.value - splitValue);
        else revert(); //revert the first transaction as well
            
        return true; 
    }
    
    //Kill the contract
    function kill()
    {
        require(owner == msg.sender);
        return suicide(owner);
        
    }
    
}
