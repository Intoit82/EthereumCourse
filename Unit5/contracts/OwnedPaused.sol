pragma solidity ^0.4.8;

import "./Paused.sol";
import "./Owned.sol";

//Enforce the order of inheritance
contract OwnedPaused is Owned, Paused{

}