
pragma solidity ^0.4.8;

contract Splitter {
    
    //Addresses
    address private owner;
    
    //Init the destroyed flag
    bool isContractDestoryed = false;
    
    //Holds the current balance for each address
    mapping (address => uint) balances;
     
    //log every fund transfer
    event LogFundsTransferred(address receiver, uint amount);
    event LogFundsDeposit(uint amountSplit1, uint amountSplit2);
    
    //Sets the owner for kill fuction
    function Splitter() public
    {
        owner = msg.sender;
    }
    
      //revent to avoid sinking ether on destoryed contract
    modifier ReventDestoryed()
    {
        
        if(isContractDestoryed)
            revert();
        _;
    }

    //Allow to deposit funds and split it between two accounts
    function splitDeposit(address firstReceiver ,address secondReceiver)
    public
    payable
    ReventDestoryed()
    returns (bool)
    {
        require(msg.value > 0); //check funds
        require(firstReceiver != msg.sender); //make sure address is not sender
        require(secondReceiver != msg.sender); //make sure address is not sender
        
        
        //get the first value for the split
        uint splitValue =  msg.value /2;
        
        //update the funds 
        balances[firstReceiver] += splitValue;
        balances[secondReceiver] += msg.value - splitValue;
        LogFundsDeposit(splitValue,msg.value - splitValue);
        
        return true; 
    }
    
    //get a single account value
    function getAccountTotalValue(address checkAdd)
    constant
    public
    returns (uint)
    {
        return balances[checkAdd];
    }
    
    //Allow to users to request the funds
    function withDrawFunds()
    public
    returns (bool)
    {
        //check the sender have any balance leftover
       require(balances[msg.sender] >0);
       
       //save and init the balance to prevent re-entrancy attacks
       var amount = balances[msg.sender];
       balances[msg.sender] = 0;
       
       //do the transfer
       if(!msg.sender.send(amount))
        throw;
       
       //log the transfer
       LogFundsTransferred(msg.sender,amount);
       
       return true;
        
    }
    
    //Kill the contract
    function kill()
    {
        isContractDestoryed = true;
        require(owner == msg.sender);
        return suicide(owner);
        
    }
  
    
    function()
    ReventDestoryed()
    {
       
    }
    
}
