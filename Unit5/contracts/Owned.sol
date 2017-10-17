pragma solidity ^0.4.8;

contract Owned {
    address public owner;

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
        owner = newOwner;
    }
}