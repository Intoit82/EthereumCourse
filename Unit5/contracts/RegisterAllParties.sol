pragma solidity ^0.4.8;

import "./RegisterAdvertisers.sol";
import "./RegisterPublishers.sol";
import "./RegisterTrustees.sol";

//Describes Register process for all parties 
contract RegisterAllParties is RegisterAdvertisers, RegisterPublishers, RegisterTrustees  {
}
