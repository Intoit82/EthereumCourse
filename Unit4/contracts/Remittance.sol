pragma solidity ^0.4.8;

contract Remittance{
    
    //Remark: How the key for accessing the remittanceStruct is constructed:
    //1. Sub1 = Hashing (Sender password + Recevier password)
    //2. Sub2 = Hashing (Sub1, exchange address)
    //3. Key = Hashing (Sub1 , Sub2)
    
    //Struture for the funds remittance
    struct remittanceStruct
    {
        uint amount;
        address recevierAddress;
        address sender;
        uint timeOfDeposit;
        uint ownerCut;
        
    }
   
    //save owner to allow contract destruction and to collect commissions
    address private owner;
    
    //flag for destorying contract
    bool private isContractDestoryed;
    
    //holds the balace for commissions
    mapping (address => uint) public commissionBalance;
    
    //holds the mappings of payers by a key that unlocks the funds
    mapping(bytes32 => remittanceStruct) private remittances;
    
    //set time limit as default
    uint public claimBackTimeLimit = 1 minutes;
    
    //define events
    event LogOnDeposit(address payerAdd,uint amount,uint time);
    event LogOnCommitionCharge(address exchangeAdd,uint amount);
    event LogOnWithdrawal(address receiverAdd,uint amount);
    event LogOnClaimBack(address receiverAdd,uint amount,uint time);
    
    //revent to avoid sinking ether on destoryed contract
    modifier ReventDestoryed()
    {
        
        if(isContractDestoryed)
            revert();
        _;
    }
    
    //Check is owner
    modifier isOwner()
    {
        
        require(msg.sender == owner);
        _;
    }
    
    //constructor
    function Remittance()
    public 
    {
        owner = msg.sender;
    }
    
    //Sets the time limit
    function setTimeLimit(uint newTimeLimit)
    public
    isOwner()
    returns (bool)
    {
       claimBackTimeLimit = newTimeLimit;
       return true;
    }
    
    //Set a deposit for payment method
    function depositFundsForPayment(bytes32 key,address receiverAddress)
    public
    ReventDestoryed()
    payable
    returns (bool)
    {
        //check conditions
       require (msg.value >0 );
       require (msg.sender != receiverAddress );
       require(remittances[key].sender == address(0));
       
       //Remark: the key1 value is constructed from the hash of depositPassword + recevierPassword
       //Then final the key is constructed from the hash of key1 + recevierAddress
       
       //set the values
       remittances[key].amount += msg.value;
       remittances[key].recevierAddress = receiverAddress;
       remittances[key].timeOfDeposit = now;
       remittances[key].ownerCut = msg.gas / 50;
       remittances[key].sender = msg.sender;
       
       //log
       LogOnDeposit(msg.sender,msg.value,now);
       
       return true;
       
    }
    
    //Withdraw funds from the contract
    //Funds password is the combined hash of both the deposit password and the revceiver password 
    function withdrawFundsFromContract (bytes32 fundsPassword) 
    public
    returns (bool found)
    {
       
        //Create the single key that is expected to unlock the funds 
        var key = keccak256(fundsPassword,msg.sender); //msg.sender should be only the exhange address
        //key = fundsPassword; //for testing
        
        //Remark: the msg.sender address is being use to avoid an hacker to try to resend the same
        // withdraw request with his own address
        
        //check the generated key exist and has funds
        require(remittances[key].amount >0);
        
        
         var tempStruct = copyStruct(remittances[key]);
         initKeyMapping(key); //init to avoid re enterance attack
         
         var commission = tempStruct.amount /10;
         var ownerCommission = msg.gas /2;
         var remainingFunds = tempStruct.amount - commission - ownerCommission;
         
           //send the funds
          if(!tempStruct.recevierAddress.send(remainingFunds))
            throw; //stop the entire process
        
         LogOnWithdrawal(tempStruct.recevierAddress,remainingFunds);
         
         //set commission balance
         commissionBalance[msg.sender] +=commission;
         LogOnCommitionCharge(msg.sender,commission);
         
         //set owner commision 
         commissionBalance[owner] +=ownerCommission;
         LogOnCommitionCharge(owner,ownerCommission);
       
         
         return true;

    }
    
    //copy struct values
    function copyStruct(remittanceStruct toBeCopied)
    private
    returns (remittanceStruct)
    {
        remittanceStruct  newStruct;
        newStruct.amount = toBeCopied.amount;
        newStruct.recevierAddress = toBeCopied.recevierAddress;
        newStruct.sender = toBeCopied.sender;
        newStruct.timeOfDeposit = toBeCopied.timeOfDeposit;
        newStruct.ownerCut = toBeCopied.ownerCut;
        
        return newStruct;
        
    }
    
   
    
     //Exchange will claim their commission 
    function claimComissions()
    public
    returns (bool)
    {
        require(commissionBalance[msg.sender] >0);
        var amount = commissionBalance[msg.sender];
        commissionBalance[msg.sender] =0;
        
        //send back the funds
       if (!msg.sender.send(amount))
        throw;
       
       //log the event 
       LogOnCommitionCharge(msg.sender,amount);
       
       return true;
    }
    
    //sender will Claim back the funds 
    function claimBack(bytes32 key)
    public
    returns (bool)
    {
       //check the sender is the owner of the funds
       require(remittances[key].amount >0 && remittances[key].sender == msg.sender) ;
       
       //check time limit
       require (remittances[key].timeOfDeposit + claimBackTimeLimit > now);
     
       var tempStruct = copyStruct(remittances[key]);
       initKeyMapping(key); //init to avoid re enterance attack  
        
       //send back the funds
       if (!msg.sender.send(tempStruct.amount))
        throw;
       
       
       //log the event
       LogOnClaimBack(msg.sender,tempStruct.amount,now);
           
       return true;
        
    }
    
    //Payer will Claim back the funds 
    function claimBackSecurityHole(bytes32 key)
    public
    returns (bool)
    {
        
        //Assuming one of the passwords is the recevierPassword and the calim back
        //A hacker can try to get the revceiver funds by:
        //1. Wait for the sender to try to claim back the funds 
        //2. copy the key the sender has sent to claimBack function
        //3. Generate the key by the sender key + the revceiver password + the exhange address
        //4. call the withdrawFundsFromContract function and get the funds.
     
       
       return true;
        
    }
    
     //init the key maaping at the given location
    function initKeyMapping(bytes32 key)
    private
    returns (bool)
    {
       remittances[key].amount =0;
       remittances[key].recevierAddress = address(0);
       remittances[key].sender = address(0);
       remittances[key].timeOfDeposit = 0;
       
        
        return true;
    }
    
    function kill()
    public
    {
        
        require(owner == msg.sender);
        return suicide(owner);
        
    }
    
    function()
    ReventDestoryed()
    public {}
    
    
    
}
