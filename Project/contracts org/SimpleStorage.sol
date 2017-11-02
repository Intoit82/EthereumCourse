pragma solidity ^0.4.2;

contract SimpleStorage {
  uint storedData;

  event LogChanged(uint value);

  function set(uint x) {
    storedData = x;
    LogChanged(x);
  }

  function get() constant returns (uint) {
    return storedData;
  }
}
