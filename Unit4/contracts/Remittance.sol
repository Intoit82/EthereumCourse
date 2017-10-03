pragma solidity ^0.4.8;

contract Remittance{
    
    struct PayerStruct
    {
        uint amount;
        bytes32 hashedPasswords;
        address recevierAddress;
        uint timeOfDeposit;
        uint ownerCut;
        
    }
   
    address public owner;
    
    //holds the mappings of payers
    mapping(address => PayerStruct) payers;
    
    //holds list of Payers address array
    address[] public listOfPayers;
    
    //set time limit as default
    uint public claimBackTimeLimit = 1 minutes;
    
    //define events
    event LogOnDeposit(address payerAdd,uint amount,uint time);
    event LogOnCommitionCharge(address exchangeAdd,uint amount);
    event LogOnWithdrawal(address receiverAdd,uint amount);
    event LogOnClaimBack(address receiverAdd,uint amount,uint time);
    
    //constructor
    function Remittance()
    public 
    {
        owner = msg.sender;
    }
    
    //Sets the time limit
    function setTimeLimit(uint newTimeLimit)
    public
    returns (bool)
    {
       require(msg.sender == owner);
       claimBackTimeLimit = newTimeLimit;
       return true;
    }
    
    //Set a deposit for payment method
    function depositFundsForPayment
    (bytes32 fundsPassword,bytes32 recevierPassword,address receiverAdd)
    public
    payable
    returns (bool)
    {
        //check conditions
       require (msg.value >0 );
       require (msg.sender != receiverAdd );
       
       //hash the passwords
       var passHash = keccak256(recevierPassword,fundsPassword);
       
       //set the values
       payers[msg.sender].amount += msg.value;
       payers[msg.sender].hashedPasswords = passHash;
       payers[msg.sender].recevierAddress = receiverAdd;
       payers[msg.sender].timeOfDeposit = now;
       payers[msg.sender].ownerCut = msg.gas / 50;
       
       //log
       LogOnDeposit(msg.sender,msg.value,now);
       
       //add the payer to the list of payers
       listOfPayers.push(msg.sender);
       
       return true;
       
    }
    
    //Withdraw funds from the contract
    function withdrawFundsFromContract
    (bytes32 fundsPassword,bytes32 recevierPassword)
    public
    returns (bool found)
    {
        //check conditions
        require (listOfPayers.length >0);
        
        var hashPass = keccak256(recevierPassword,fundsPassword);
        
        //find the passwords location in the mapping
        uint i = 0;
        found = false;
        while (i <= listOfPayers.length && !found)
        {
            if(payers[listOfPayers[i]].hashedPasswords == hashPass)
                found = true;
            else
                i++;
        }
        
        //unlock funds if found
        if (found)
        {
            //check conditions
            var payer= payers[listOfPayers[i]];
            require(payer.recevierAddress != address(0));
            require(payer.amount != 0);
            
            //pay commition to the exchange
            uint commition = payer.amount /10;
            if(!msg.sender.send(commition))
            throw;
            LogOnCommitionCharge(msg.sender,commition);
            
             //pay commition to the owner
            if(!msg.sender.send(payer.ownerCut))
            throw;
            LogOnCommitionCharge(owner,payer.ownerCut);
            
            var remainingFunds = payer.amount - commition - payer.ownerCut;
            
            //send the funds
          if(!payer.recevierAddress.send(remainingFunds))
            throw;
          else
          {
              LogOnWithdrawal(payer.recevierAddress,remainingFunds);
             if(!initPayerMapping(listOfPayers[i]))
             throw;
              
          }
        }
          
        
        
    }
    
    //init the payers maaping at location payer
    function initPayerMapping(address payer)
    private
    returns (bool)
    {
        payers[payer].amount =0;
        payers[payer].recevierAddress = address(0);
        payers[payer].hashedPasswords = "0x0";
        
        return true;
    }
    
    //Payer will Claim back the funds 
    function claimBack(bytes32 fundsPassword,bytes32 recevierPassword )
    public
    returns (bool)
    {
       //check conditions
       var hashPass = keccak256(recevierPassword,fundsPassword);
       require(payers[msg.sender].hashedPasswords == hashPass);
       require(payers[msg.sender].amount >0);
       
       //check time limit
       if (payers[msg.sender].timeOfDeposit + claimBackTimeLimit < now)
        throw;
       
       //send back the funds
       if (!msg.sender.send(payers[msg.sender].amount))
        throw;
       else
       {
           LogOnClaimBack(msg.sender,payers[msg.sender].amount,now);
           if(!initPayerMapping(msg.sender))
             throw;
           
       }
       
       return true;
        
    }
    
    //Payer will Claim back the funds 
    function claimBackSecurityHole(address claimer )
    public
    returns (bool)
    {
       //check conditions
       require(payers[msg.sender].amount >0);
       
       //check time limit
       if (payers[msg.sender].timeOfDeposit + claimBackTimeLimit < now)
        throw;
       
       //send back the funds
       if (!msg.sender.send(payers[msg.sender].amount))
        throw;
       else
       {
           LogOnClaimBack(msg.sender,payers[msg.sender].amount,now);
           if(!initPayerMapping(msg.sender))
             throw;
           
       }
       
       return true;
        
    }
    
    function kill()
    public
    {
        require(owner == msg.sender);
        return suicide(owner);
        
    }
    
    
    
}
