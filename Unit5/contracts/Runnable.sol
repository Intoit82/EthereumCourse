
pragma solidity ^0.4.8;

import "./Owned.sol";

contract Runnable is Owned{

	 //Security mesures for pausing the contract
    bool public isRunning;

    //log the contract
    event LogContractPauseSet(address sender, bool isRunning);
    
    //constructor set running 
    function Runnable()
    public
    {
        isRunning = true;
    }

     //Is owner modifier
    modifier running()
    {
        require(isRunning);
        _;
    }

     //Pause the contract for Security\functionality checks
    function setRunning(bool run)
    isOwner
    public
    returns (bool)
    {
        //set pause
        isRunning = run;
        
        //log
        LogContractPauseSet(msg.sender, isRunning);
        return true;
    }

}
