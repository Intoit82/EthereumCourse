/*const Web3 = require("web3");
//const Promise = require("bluebird");
const truffleContract = require("truffle-contract");
const $ = require("jquery");
// Not to forget our built contract
const RegulatorJson = require("../../build/contracts/Regulator.json");
const TollBoothOperatorJson = require("../../build/contracts/TollBoothOperator.json");

// support Mist, and other wallets that provide 'web3'

// Supports Mist, and other wallets that provide 'web3'.
if (typeof web3 !== 'undefined') {
  // Use the Mist/wallet/Metamask provider.
  console.log("web3 is not undefined so using Mist");
  window.web3 = new Web3(web3.currentProvider);
} else {
  // Your preferred fallback.
  console.log("web3 is undefined so using the fallback.");
  window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); 
}

const Regulator = truffleContract(RegulatorJson);
Regulator.setProvider(web3.currentProvider);

const TollBoothOperator = truffleContract(TollBoothOperatorJson);
TollBoothOperator.setProvider(web3.currentProvider);

var app = angular.module('TollRoadApp', []);

app.controller("TollRoadController", 
  [ '$scope', '$location', '$http', '$q', '$window', '$timeout', 
  function($scope, $location, $http, $q, $window, $timeout) {

  var regulator;
  var globalOperator;
  Regulator.deployed().then(function(instance) {
    regulator = instance;
    console.log("is regulator deployed: " +regulator);
    newVehicleTypeWatcher = watchForNewVehicleTypes();
    newOperatorWatcher = watchForOperators();
    
    $scope.currVehicleType = "not defined"; //reset displayed type

    
  });

$scope.selectBooth = function()
{
	console.log("working");
}

}]);


*/