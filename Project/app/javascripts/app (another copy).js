const Web3 = require("web3");
//const Promise = require("bluebird");
const truffleContract = require("truffle-contract");
//const $ = require("jquery");
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

//Promise.promisifyAll(web3.eth, { suffix: "Promise"});
//Promise.promisifyAll(web3.version, { suffix: "Promise"});

const Regulator = truffleContract(RegulatorJson);
Regulator.setProvider(web3.currentProvider);

//const Campaign = truffleContract(CampaignJson);
//Campaign.setProvider(web3.currentProvider);

var app = angular.module('TollRoadApp', []);

app.config(function( $locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
});

app.controller("TollRoadController", 
  [ '$scope', '$location', '$http', '$q', '$window', '$timeout', 
  function($scope, $location, $http, $q, $window, $timeout) {

  var regulator;
  Regulator.deployed().then(function(instance) {
    regulator = instance;
    console.log("is regulator deployed: " +regulator);
    newVehicleTypeWatcher = watchForNewVehicleTypes();
    newOperatorWatcher = watchForOperators();
    $scope.currVehicleType = "not defined"; //reset displayed type

    
  });

  txn = {};                // workaround for repetitive event emission (testRPC)
  
  $scope.newVehicleLog=[];   // verbose on-screen display of happenings
  $scope.vehiclesIndex={}; // row pointers
  $scope.vehicles=[]; // array of vehicles
  
  $scope.newOperatorLog= []; //array for operator logs
  $scope.operators= []; //array of operators
  $scope.operatorsIndex= {}; //pointers for the operators

  $scope.setNewOperator = function () {
    console.log("Enter New Operator with " ,$scope.depositInWei ," deposit as default");
    console.log("Account selected: " , $scope.accountSelected);
    console.log("From: " , $scope.account);

    if($scope.accountSelected == $scope.account)
    {
      alert('Cannot create new operator from regulator address');
      return;
    }

    return regulator.createNewOperator($scope.accountSelected, $scope.depositInWei, {from: $scope.account, gas: 4000000})
    .then(tx => {
      console.log("was able to create new operator ");
      const log = tx.logs[1];
      console.log("New operator Address: " +log.args.newOperator);
      console.log("Operator deposit: " +log.args.depositWeis);
    })
  }

  $scope.setVehicleType = function() {
    console.log("Enter new vehicle function");
    var index = $scope.vehiclesIndex[$scope.accountSelected];
    console.log("index for account ",$scope.accountSelected," is ",index);
    //check no such vehicle exist or this is a new update
    if (typeof(index) !='undefined' && 
     $scope.vehicles[index].vehicleType == $scope.newVehicleType ) {
      alert('Vehicle with type already exist, accpeting only new updates');
      return;
    }
  
      return regulator.getOwner({from:$scope.account})
      .then(ownerOutput =>{
        console.log("Creating new vehicle");
        console.log("Owner: " ,ownerOutput);
        console.log("account: " ,$scope.account);
        console.log("vehicle: " ,$scope.accountSelected);
        console.log("type: " ,$scope.newVehicleType);
        return regulator.setVehicleType($scope.accountSelected,parseInt($scope.newVehicleType), {from: $scope.account, gas: 4000000})
      })
      .then(function(tx) {
        console.log("Create new vehicle - success");
        const log = tx.logs[0];
        console.log("New vehicle Address: " +log.args.vehicle);
        console.log("New vehicle type: " +log.args.vehicleType);
        $scope.newVehicleType = ""; 
        
      })
          
  }
 

  function watchForOperators() {
    console.log("enter watcher");
    regulator.LogTollBoothOperatorCreated( {}, {fromBlock: 0})
    .watch(function(err,newOperator) {
      if(err) 
      {
        console.error("new Operator Error:",err);
        return;
      }

      //set format for display
      newOperator.args.depositWeis = newOperator.args.depositWeis.toString(10);
      
      // normalizing data for output purposes
      console.log("Watcher New Operator", newOperator.args.newOperator.toString(10));
      // only if non-repetitive (testRPC)
      if(typeof(txn[newOperator.transactionHash])=='undefined')
      {
        $scope.newOperatorLog.push(newOperator);         
        txn[newOperator.transactionHash]=true;
        upsertOperators(newOperator.args.newOperator,newOperator.args.owner,newOperator.args.depositWeis);
      }
      
    })
  }


  function watchForNewVehicleTypes() {
    console.log("enter watcher");
    regulator.LogVehicleTypeSet( {}, {fromBlock: 0})
    .watch(function(err,newVehicle) {
      if(err) 
      {
        console.error("newVehicle Error:",err);
      } else {
        // normalizing data for output purposes
        console.log("Watcher New vehicle", newVehicle.args.vehicleType.toString(10));
        newVehicle.args.vehicleType = newVehicle.args.vehicleType.toString(10);     
        // only if non-repetitive (testRPC)
        if(typeof(txn[newVehicle.transactionHash])=='undefined')
        {
          $scope.newVehicleLog.push(newVehicle);         
          txn[newVehicle.transactionHash]=true;
          upsertVehicles(newVehicle.args.vehicle);
        }
      }
    })
  };

  function upsertOperators(addressOperator,addressOwner,deposit) {
    console.log("Upserting operator: ", addressOperator);
    console.log("Upserting operator: ", addressOwner);
    console.log("Upserting operator: ", deposit);
    
    var o = {};
    o.operator  = addressOperator;
    o.owner   = addressOwner;
    o.deposit = deposit;

    if(typeof($scope.operatorsIndex[addressOperator]) != 'undefined')
    {
      alert('Unable to set new operator, please select a different account for action');
      return;
    }
    
    //set new scope    
    $scope.operatorsIndex[addressOperator]=$scope.operators.length;
    $scope.operators.push(o);
    $scope.numOfOperators = $scope.operators.length;
    console.log("New operator was set");
    $scope.$apply();
  }

  function upsertVehicles(address) {
    console.log("Upserting vehicle: ", address);
    var type;
    
    return regulator.getVehicleType.call(address,{from: $scope.account})
    .then(typeOutput => {
     
      type = typeOutput;
      // build a row step-by-step

      var c = {};
      c.vehicleAddress  = address;
      c.vehicleType   = type;
     
      if(typeof($scope.vehiclesIndex[address]) == 'undefined')
        {
          $scope.vehiclesIndex[address]=$scope.vehicles.length;
          //console.log("adding to index address ", address, " index of " ,$scope.vehicles.length );
          //console.log(address , " vs ", $scope.account);
          $scope.vehicles.push(c);
          setCurrentVehicleType();
          $scope.$apply();
        } else {
          var index = $scope.vehiclesIndex[address];
          $scope.vehicles[index].address  = c.vehicleAddress;
          $scope.vehicles[index].type  = c.vehicleType;
          setCurrentVehicleType();   
          $scope.$apply();
        }
     
    });
    
  }

  function setCurrentVehicleType()
  {
    //set the current vehicle type
    var index = $scope.vehiclesIndex[$scope.accountSelected];
    if( typeof(index) != 'undefined')
        $scope.currVehicleType = $scope.vehicles[index].vehicleType;  
      else 
        $scope.currVehicleType = "not defined";
  }

   $scope.setAccount = function() {
    //$scope.account = $scope.accountSelected;
    $scope.balance = web3.eth.getBalance($scope.account).toString(10);
    
    //set vehicle type
    setCurrentVehicleType();
    
   /* var countCampaigns = $scope.campaigns.length;
    // the "User Contributed" col needs a new context, so refresh them
    for(i=0; i<countCampaigns; i++) {
      upsertCampaign($scope.campaigns[i].campaign);
    }*/

    console.log('Using account for action',$scope.accountSelected);
    
  }

    web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert("There was an error fetching your accounts.");
      return;
    }
    if (accs.length == 0) {
      alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }
    $scope.accounts = accs;
    $scope.account = $scope.accounts[0];
    $scope.balance = web3.eth.getBalance($scope.account).toString(10);
    $scope.accountSelected = $scope.accounts[1]; //select 1 as default      
    console.log('Using account for action',$scope.accountSelected);
    console.log('Using regulator account',$scope.account);
  });

}]);


   // Check contributions from the current user

/*
  txn = {};                // workaround for repetitive event emission (testRPC)
  $scope.campaigns=[];     // array of structs
  $scope.campaignIndex={}; // row pointers
  $scope.campaignLog=[];   // verbose on-screen display of happenings
  $scope.new = {};         // new campaign
  $scope.campaignSelected; // campaign selector
  $scope.contribution;     // contribution field

  // INTERACTIONS

  // select account

  $scope.setAccount = function() {
    $scope.account = $scope.accountSelected;
    $scope.balance = web3.eth.getBalance($scope.account).toString(10);
    var countCampaigns = $scope.campaigns.length;
    // the "User Contributed" col needs a new context, so refresh them
    for(i=0; i<countCampaigns; i++) {
      upsertCampaign($scope.campaigns[i].campaign);
    }
    console.log('Using account',$scope.account);
  }

  // new campaign

  $scope.newCampaign = function() {
    if(parseInt($scope.new.goal) > 0 && parseInt($scope.new.duration) > 0) {
      hub.createCampaign($scope.new.duration, $scope.new.goal, {from: $scope.account, gas: 4000000})
      .then(function(txn) {
        $scope.new.goal = "";
        $scope.new.duration = "";
      });
    } else {
      alert('Integers over Zero, please');
    }
  }

  // contribute to campaign

  $scope.contribute = function() {
    if($scope.campaignSelected=="") return;
    if(parseInt($scope.contribution)<=0) return;
    var campaign = Campaign.at($scope.campaignSelected);
    var amount = $scope.contribution;
    $scope.contribution = "";
    campaign.contribute({from: $scope.account, value: parseInt(amount), gas: 4000000})
    .then(function(txn) {
      return;
    });
  }

  // claim a refund

  $scope.refund = function(campaign) {
    var campaign = Campaign.at(campaign);
    return campaign.requestRefund({from: $scope.account, gas: 4000000})
    .then(function(txn) {
      // an event will arrive
    });
  }

  // DISPLAY

  // watch hub campaigns created. UI starts here.

  function watchForNewCampaigns() {
    hub.LogNewCampaign( {}, {fromBlock: 0})
    .watch(function(err,newCampaign) {
      if(err) 
      {
        console.error("Campaign Error:",err);
      } else {
        // normalizing data for output purposes
        console.log("New Campaign", newCampaign);
        newCampaign.args.user   = newCampaign.args.sponsor;
        newCampaign.args.amount = newCampaign.args.goal.toString(10);     
        // only if non-repetitive (testRPC)
        if(typeof(txn[newCampaign.transactionHash])=='undefined')
        {
          $scope.campaignLog.push(newCampaign);         
          txn[newCampaign.transactionHash]=true;
          upsertCampaign(newCampaign.args.campaign);
        }
      }
    })
  };

  // watch functions for each campaign we know about

  // watch receipts

  function watchReceived(address) {
    var campaign = Campaign.at(address);
    var watcher = campaign.LogContribution( {}, {fromBlock: 0})
    .watch(function(err,received) {
      if(err)
      {
        console.error('Received Error', address, err);
      } else {
        console.log("Contribution", received);
        if(typeof(txn[received.transactionHash+'rec'])=='undefined')
        {
          received.args.user = received.args.sender;
          received.args.amount = parseInt(received.args.amount);
          received.args.campaign = address;
          $scope.campaignLog.push(received);
          upsertCampaign(address);
          txn[received.transactionHash+'rec']=true;
        }
      }
    });
  }

  // watch refunds

  function watchRefunded(address) {
    var campaign = Campaign.at(address);
    var watcher = campaign.LogRefundSent( {}, {fromBlock: 0})
    .watch(function(err,refunded) {
      if(err)
      {
        console.error('Refunded Error', address, err);
      } else {
        console.log("Refund", refunded);
        if(typeof(txn[refunded.transactionHash+'ref'])=='undefined')
        {
          refunded.args.user = refunded.args.funder;
          refunded.args.amount = parseInt(refunded.args.amount);
          refunded.args.campaign = address;
          $scope.campaignLog.push(refunded);
          upsertCampaign(address);
          txn[refunded.transactionHash+'ref']=true;
        }
      }
    });
  }

  // update display (row) and instantiate campaign watchers
  // safe to call for newly discovered and existing campaigns that may have changed in some way

  function upsertCampaign(address) {
    console.log("Upserting campaign", address);
    var campaign = Campaign.at(address);
    // console.log("Campaign", campaign);
    var campaignDeadline;
    var campaignGoal;
    var campaignFundsRaised;
    var campaignIsSuccess;
    var campaignHasFailed;

    return campaign.deadline.call({from: $scope.account})
    .then(function(_deadline) {
      campaignDeadline = _deadline;
      //console.log("Deadline", campaignDeadline);
      return campaign.goal.call({from: $scope.account});
    })
    .then(function(_goal) {
      campaignGoal = _goal;
      //console.log("Goal", campaignGoal);
      return campaign.fundsRaised.call({from: $scope.account});
    })
    .then(function(_fundsRaised) {
      campaignFundsRaised = _fundsRaised;
      //console.log("Funds Raised", campaignFundsRaised);
      return campaign.withdrawn.call({from: $scope.account});
    })
    .then(function(_withdrawn) {
      campaignWithdrawn = _withdrawn;
      //console.log("Withdrawn", _withdrawn);
      return campaign.sponsor.call({from: $scope.account});
    })
    .then(function(_sponsor) {
      campaignSponsor = _sponsor;
      //console.log("Sponsor", campaignSponsor);
      return campaign.isSuccess.call({from: $scope.account});
    })
    .then(function(_isSuccess) {
      campaignIsSuccess = _isSuccess;
      //console.log("is Success", campaignIsSuccess);
      return campaign.hasFailed.call({from: $scope.account});
    })
    .then(function(_hasFailed) {
      campaignHasFailed = _hasFailed;
      //console.log("has Failed", campaignHasFailed);

      // build a row step-by-step

      var c = {};
      c.campaign  = address;
      c.sponsor   = campaignSponsor;
      c.goal      = campaignGoal.toString(10);
      c.deadline  = parseInt(campaignDeadline.toString(10));
      c.accepted  = parseInt(campaignFundsRaised.toString(10));
      c.withdrawn = parseInt(campaignWithdrawn.toString(10));
      c.isSuccess = campaignIsSuccess;
      c.hasFailed = campaignHasFailed;
      c.status = "open";
      if(c.isSuccess) c.status = "success";
      if(c.hasFailed) c.status = "failed";

      if(typeof($scope.campaignIndex[address]) == 'undefined')
        {
          $scope.campaignIndex[c.campaign]=$scope.campaigns.length;
          $scope.campaigns.push(c);
          var receiveWatcher = watchReceived(address);
          var refundWatcher  = watchRefunded(address);
          $scope.$apply();
        } else {
          var index = $scope.campaignIndex[c.campaign];
          $scope.campaigns[index].accepted  = c.accepted;
          $scope.campaigns[index].refunded  = c.refunded;
          $scope.campaigns[index].withdrawn = c.withdrawn;
          $scope.campaigns[index].isSuccess = c.isSuccess;
          $scope.campaigns[index].hasFailed = c.hasFailed;
          $scope.$apply();
        }
      return getFunder(address);
    });
  }

   // Check contributions from the current user

  function getFunder(address) {
    var campaign = Campaign.at(address);
    var index = $scope.campaignIndex[address];
    return campaign.funderStructs.call($scope.account, {from: $scope.account})
    .then(function(funder) {
      // when a function returns multiple values, we get an array
      $scope.campaigns[index].userAccepted = parseInt(funder[0].toString(10));
      $scope.campaigns[index].userRefunded = parseInt(funder[1].toString(10));
      $scope.$apply();
      return true;;
    })
  }

  // work with the first account.
*/
