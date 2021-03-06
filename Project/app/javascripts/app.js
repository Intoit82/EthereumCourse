const Web3 = require("web3");
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

//Promise.promisifyAll(web3.eth, { suffix: "Promise"});
//Promise.promisifyAll(web3.version, { suffix: "Promise"});

const Regulator = truffleContract(RegulatorJson);
Regulator.setProvider(web3.currentProvider);

const TollBoothOperator = truffleContract(TollBoothOperatorJson);
TollBoothOperator.setProvider(web3.currentProvider);

var app = angular.module('TollRoadApp', []);

/*app.config(function( $locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
});*/

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

  txn = {};                // workaround for repetitive event emission (testRPC)
  
  $scope.newVehicleLog=[];   // verbose on-screen display of happenings
  $scope.vehiclesIndex={}; // row pointers
  $scope.vehicles=[]; // array of vehicles
  
  $scope.newOperatorLog= []; //array for operator logs
  $scope.operators= []; //array of operators
  $scope.operatorsIndex= {}; //pointers for the operators

  $scope.newBoothLog= []; //array for operator logs
  $scope.booths = [];
  $scope.boothsIndex= {}; //index for booths

  $scope.newEntryLog= []; //array for operator logs
  $scope.entries = [];
  $scope.entriesIndex= {}; //index for booths


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
  
  function updateBoothLog()  {
    console.log("enter update log");
    return TollBoothOperator.at($scope.operator,{from:$scope.operatorOwner})
    .then(instance=> {
      var operator = instance;
      operator.LogTollBoothAdded( {}, {fromBlock:0})
      .watch(function(err,newBooth) {
        if(err) 
        {
        console.error("new Booth Error:",err);
        return;
        }
      
        if(typeof(txn[newBooth.transactionHash])=='undefined')
      {
        $scope.newBoothLog.push(newBooth);         
        txn[newBooth.transactionHash]=true;
        upsertBooths(newBooth.args.sender,newBooth.args.tollBooth);
      }
    })
   })
  } 

  function watchForOperators() {
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

  function upsertBooths(addressSender,addressBooth)
  {
    var b = {};
    b.sender  = addressSender;
    b.booth   = addressBooth;

    console.log("entering updsert booth with " , addressBooth);
    
    if(typeof($scope.boothsIndex[addressBooth]) != 'undefined')
    {
      console.log("booth already in index");
      return;
    }

     //set new scope    
    $scope.boothsIndex[addressBooth]=$scope.booths.length;
    $scope.booths.push(b);
    $scope.numOfBooths = $scope.booths.length;


    console.log("New booth was set");
    $scope.$apply();

  }

  function upsertOperators(addressOperator,addressOwner,deposit) {
    console.log("Upserting operator address: ", addressOperator);
    console.log("Upserting operator owner: ", addressOwner);
    console.log("Upserting operator deposit: ", deposit);
    
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

  /////////////////////////////// Operator ///////////

   $scope.unpauseOperator = function() {
    console.log("Enter unpause function");
    if(typeof($scope.pausedOperator) == 'undefined')
    {
      alert('Paused state is not defined');
      console.log("No paused state");
      return;
    }

    if(!$scope.pausedOperator)
    {
      alert('Paused state is alreay unpaused');
      console.log("Paused state is already unpaused");
      return;
    }
       
    return TollBoothOperator.at($scope.operator,{from:$scope.operatorOwner})
    .then(instance=> {
    currentOperator = instance;
    return currentOperator.setPaused(false,{from:$scope.operatorOwner})
     })
    .then(tx =>{
    return currentOperator.isPaused({from:$scope.operatorOwner})
     })
    .then(isPaused=> {
      $scope.pausedOperator = isPaused;
      $scope.$apply();
      if(!isPaused)
        console.log("Unpaused successfully");
      
      else
        console.log("Unable to unpause operator");
    })

   }

  $scope.setOperator = function() {
     $scope.operator = $scope.operatorInSelect.operator;
     $scope.operatorOwner = $scope.operatorInSelect.owner;
     $scope.operatorBalance = web3.eth.getBalance($scope.operatorOwner).toString(10);

    return TollBoothOperator.at($scope.operator,{from:$scope.operatorOwner})
    .then(instance=> {
      currentOperator = instance;
    return currentOperator.isPaused({from:$scope.operatorOwner})
     })
    .then(isPaused=> {
      $scope.pausedOperator = isPaused;
      //$scope.$apply();
      console.log("is operator paused :",isPaused);
      updateBoothLog();

    })
  }


  $scope.addTollBooth = function() {
      if(typeof($scope.operator) == 'undefined')
      {
        alert('Must select operator first');
        return;
      }

    if(typeof($scope.boothsIndex[$scope.tollBoothAddress]) != 'undefined')
    {
      alert('Booth address already exist');
      return;
    }

    console.log("enter add function with address ", $scope.operator  );
    return TollBoothOperator.at($scope.operator,{from:$scope.operatorOwner})
    .then(instance=> {
      console.log("enter instance function = ", instance);
      var booth = instance;
      return booth.addTollBooth($scope.tollBoothAddress,{from:$scope.operatorOwner})
    })
    
    .then(tx=>{
     console.log("adding new Booth succesfully")
     const log = tx.logs[0];
     console.log("New Booth owner: " +log.args.sender);
     console.log("New Booth address: " +log.args.tollBooth);   
     updateBoothLog();
     //upsertBooths($scope.operatorOwner,log.args.tollBooth);
    })

  }

  $scope.setAccount = function() {
    
    $scope.accountSelected = $scope.accountInSelect;
    $scope.balance = web3.eth.getBalance($scope.accountSelected).toString(10);

    //set vehicle type
    setCurrentVehicleType();
  
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

    $scope.$apply();
  });


////////////////// Rounte Price /////////////////////
    $scope.setRoutePrice = function() {
        if(typeof($scope.operator) == 'undefined')
      {
        alert('Must select operator first');
        return;
      }
      //console.log("enter add function with address ", $scope.operator  );
      return TollBoothOperator.at($scope.operator,{from:$scope.operatorOwner})
     .then(instance=> {
       console.log("enter instance function = ", instance);
       var booth = instance;
        return booth.setRoutePrice($scope.setEntryBooth,$scope.setExitBooth,$scope.priceInWei,{from:$scope.operatorOwner})
     })
    
     .then(tx=>{
     console.log("adding new Price route succesfully");
     const log = tx.logs[0];
     console.log("Route owner: " +log.args.sender);
     console.log("Route entry booth: " +log.args.entryBooth);
     console.log("Route exit booth: " +log.args.exitBooth);
     console.log("Route price: " +log.args.priceWeis);
     $scope.currentRoute = log.args.priceWeis.toString(10);
     $scope.$apply();
     })

    }


    ////////////////// Multipliers Price /////////////////////
    $scope.setMultiplier = function() {
      if(typeof($scope.operator) == 'undefined')
      {
        alert('Must select operator first');
        return;
      }
      console.log("enter Multipliers"  );
      return TollBoothOperator.at($scope.operator,{from:$scope.operatorOwner})
     .then(instance=> {
       console.log("enter instance function = ", instance);
       var currentOperator = instance;
       return currentOperator.setMultiplier($scope.setTypeValue,$scope.setMulValue,{from:$scope.operatorOwner})
     })
    
     .then(tx=>{
     console.log("Setting Multipliers succesfully");
     const log = tx.logs[0];
     console.log("Multipliers type: " +log.args.vehicleType);
     console.log("Multipliers value: " +log.args.multiplier);
     $scope.multiplierOfType = log.args.vehicleType.toString(10);
     $scope.$apply();

     })
   }



     $scope.enterRoad = function () {
      
      var currentOperator;
      var vehiceMul;


      console.log(regulator.address);
      

       if (typeof($scope.vehicleSelected) == 'undefined' ||
        parseInt($scope.vehicleBalance) <=0  )
       {
        alert('please select a vehicle with a positive balance ')
        throw new Error("Vehicle is invalid");
       }

        if (typeof($scope.operator) == 'undefined' )
       {
        alert('please select road operator related to your booth ')
        throw new Error("No operator");
       }

      return TollBoothOperator.at($scope.operator,{from:$scope.vehicleSelected})
     .then(instance=> {
       console.log("Checking if booth is registered ", $scope.vehicleEntryBooth);
       currentOperator = instance; //set operator

      return currentOperator.isTollBooth($scope.vehicleEntryBooth,{from:$scope.vehicleSelected})
    })
      .then(isIndeed =>{
        console.log("Toll booth registeraion status: ", isIndeed);
       if(!isIndeed)
       {
        alert('Entry Booth is not registered - please use registered booths only');
        throw new Error("Entry booth is not registered");
       }

       return currentOperator.isPaused({from:$scope.vehicleSelected})
     })
      .then(isPaused=> {
        console.log("is operator paused :",isPaused);
        if(isPaused)
        {
          alert('Operator is paused, please unpause it');
          throw new Error("operator is paused");
        }
  
      return regulator.getVehicleType($scope.vehicleSelected)
    })
      .then(typeRes => {
        console.log("vehicleType is: ", typeRes.toString(10));
        if(typeRes ==0)
        {
          alert('No vehicle type was found for the given vehicle adress, Please select a valid vehicle address');
          throw new Error("Vehicle type 0");
        }

      return currentOperator.getMultiplier(typeRes,{from:$scope.vehicleSelected})
    })
    .then(mul => {

      console.log("Multipier defined is: ", mul.toString(10));
      vehiceMul = mul;
      if(mul ==0)
        {
          alert('No Multiplier defined for the vehicle type plse set a mulitplier with the regulator or choose another vehicle address');
          throw new Error("Multiplier for type is 0");
        }

      return currentOperator.getDeposit({from:$scope.vehicleSelected})
    })
    .then(amount => {

      var totalDepositRequired = vehiceMul * amount;
      console.log("Amount of ", amount.toString(10), " with total deposit requirement of ", totalDepositRequired);
      console.log("Current vehicle deposit: ", $scope.vehicleEntryDeposit);

      if(totalDepositRequired > $scope.vehicleEntryDeposit)
      {
        alert("Deposit of " + $scope.vehicleEntryDeposit + " is not sufficient for total base fee of " + totalDepositRequired);
        throw new Error("insufficient deposit");
      }

      return currentOperator.hashSecret($scope.vehicleEntryHash,{from:$scope.vehicleSelected})
    })
    .then(hashed => {
      $scope.secretHash = hashed;
      $scope.$apply();
      console.log("input vehicle: ", $scope.vehicleSelected);
      console.log("input entryBooth: ", $scope.vehicleEntryBooth);
      console.log("input exitSecretHashed: ", $scope.secretHash);
      console.log("input deposit: ", $scope.vehicleEntryDeposit);

      return currentOperator.enterRoad.call($scope.vehicleEntryBooth,
        $scope.secretHash,
        {from:$scope.vehicleSelected,
         value:$scope.vehicleEntryDeposit,
         gas:3000000})
    })
    .then(success =>{

      console.log("Call success status is ", success);

      return currentOperator.enterRoad($scope.vehicleEntryBooth,
        $scope.secretHash,
        {from:$scope.vehicleSelected,
         value:$scope.vehicleEntryDeposit,
         gas:3000000})

     })
    
     .then(tx=>{
     console.log("Enter road succesfully");
     const log = tx.logs[0];
     console.log("Enter vehicle: " +log.args.vehicle);
     console.log("Enter entry booth: " +log.args.entryBooth);
     console.log("Enter hash: " +log.args.exitSecretHashed);
     console.log("Enter deposits: " +log.args.depositedWeis);
     
     updateEntryLog();//update logs
     })
     .catch(error =>{
      console.log("error: ", error);
     })
   }

   function updateEntryLog()  {
    console.log("enter vehicle entry log update");
    return TollBoothOperator.at($scope.operator,{from:$scope.operatorOwner})
    .then(instance=> {
      var operator = instance;
      operator.LogRoadEntered( {}, {fromBlock:0})
      .watch(function(err,newEntry) {
        if(err) 
        {
        console.error("new entry Error:",err);
        return;
        }
      
        if(typeof(txn[newEntry.transactionHash])=='undefined')
      {
        $scope.newEntryLog.push(newEntry);         
        txn[newEntry.transactionHash]=true;
        upsertEntries(newEntry.args.vehicle,newEntry.args.entryBooth,
                      newEntry.args.exitSecretHashed,newEntry.args.depositedWeis);
      }
    })
   })
  }

  function upsertEntries(addressVehicle,addressBooth,hash,deposit)
  {
    var e = {};
    e.vehicle  = addressVehicle;
    e.entryBooth   = addressBooth;
    e.exitSecretHashed = hash;
    e.depositedWeis = deposit;

    console.log("entering updsert entry");
    
    if(typeof($scope.entriesIndex[addressVehicle]) != 'undefined')
    {
      console.log("entry already in index");
      return;
    }

     //set new scope    
    $scope.entriesIndex[addressVehicle]=$scope.entries.length;
    $scope.entries.push(e);
    $scope.numOfEntries = $scope.entries.length;


    console.log("New Entry was set");
    $scope.$apply();

  } 

    

    

  $scope.selectVehicle = function() {
  $scope.vehicleSelected = $scope.inSelectionVehicle;
  $scope.vehicleBalance = web3.eth.getBalance($scope.vehicleSelected).toString(10);
  updateEntryLog();//update log


  }
    
//////////////////////////////  Toll Both /////////////////
$scope.selectBooth = function()
{
  $scope.boothSelected = $scope.inSelectionBooth;
  
}

function updateOperatorInstance() {

  if (typeof($scope.operator) == 'undefined' )
       {
        alert('please select road operator related to your booth ')
        throw new Error("No operator");
       }

  if(typeof($scope.operatorInstance) != 'undefined')
    return operatorInstance;
  
  return TollBoothOperator.at($scope.operator,{from:$scope.accounts[0]})
  .then(instance=> {
    $scope.operatorInstance = instance;
      
    })
  }

  


$scope.exitRoad = function ()
{
   console.log("enter vehicle exit function");
   var opertorInstance;


   if(typeof($scope.boothSelected) == 'undefined')
   {
    alert("No booth was selected, please select a valid booth");
    return;
   }

   return TollBoothOperator.at($scope.operator,{from:$scope.accounts[0]})
  .then(instance=> {
    opertorInstance = instance;
    return opertorInstance.isTollBooth($scope.boothSelected,{from:$scope.boothSelected}) 
  })
   .then(isIndeed =>{
    console.log("Exit booth registration state ", isIndeed);
     if(!isIndeed)
       {
        alert('Exit Booth is not registered - please use registered booths only');
        throw new Error("Exit booth is not registered");
       }

    return opertorInstance.reportExitRoad($scope.exitHash,{from:$scope.boothSelected,gas:3000000})  
   }) 
    .then(tx=>{
     console.log("Exit road succesfully");
     const log = tx.logs[0];

     console.log("Event Name: " +log.event);
     console.log("Exit booth: " +log.args.exitBooth);
     console.log("Exit hash: " +log.args.exitSecretHashed);
     console.log("Enter refund Weis: " +log.args.refundWeis);
     console.log("Enter final Fee: " +log.args.finalFee);

     //init to not defined
     $scope.paymentStatus = "None";
     

     if(log.event == "LogRoadExited")
     {
        $scope.paymentStatus = " Payment was made for a fee of "+
        log.args.finalFee.toString(10) + " wei and with a refund of " +
        log.args.refundWeis.toString(10) + " wei";
     }

     if(log.event == "LogPendingPayment")
      $scope.paymentStatus = " payment is pending with entry booth: " +
      log.args.entryBooth + "and exit booth: " +
      log.args.exitBooth + " and secret hash: " +
      log.args.exitSecretHashed;


      $scope.$apply();
   })
         
}

}]);


  
