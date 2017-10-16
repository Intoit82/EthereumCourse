pragma solidity ^0.4.8;

import "./Owned.sol";

contract Paused is Owned{

	 //Security mesures for pausing the contract
    bool public pauseContract;

    //log the contract
    event LogContractPauseSet(bool pauseContract);

     //Is owner modifier
    modifier notPaused()
    {
        require(!pauseContract);
        _;
    }

     //Pause the contract for Security\functionality checks
    function pause(bool setPause)
    public
    returns (bool)
    {
        //set pause
        pauseContract = setPause;
        
        //log
        LogContractPauseSet(pauseContract);
        return true;
    }

}