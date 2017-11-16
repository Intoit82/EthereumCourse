var Regulator = artifacts.require("./Regulator.sol");
var OperatorBooth = artifacts.require("./TollBoothOperator.sol");

module.exports = function(deployer) {
  deployer.deploy(Regulator);
};


module.exports = function(deployer,network,accounts) {
  let regulator,operator;
  let regulatotAddress = accounts[0];
  let operatorAddress = accounts[1];
  Regulator.deployed()

  .then(result => {
  	regulator = result;
  	//console.log(regulator.address + " vs " + regulatotAddress);
  	return regulator.createNewOperator(operatorAddress,100,{from:regulatotAddress})
  })
  
  .then(txObject => {
  const event0 = txObject.logs[1];
  console.log(event0.args.sender + " has created a new toll booth at " + event0.args.newOperator);
  return OperatorBooth.at(event0.args.newOperator)

  .then(instance =>{
  	operator = instance;
  	return operator.isPaused.call()
  })

  .then(result => {
  	console.log("Is the operator paused: " + result);
  	return operator.getOwner.call()
  })
  .then(result=>{

  	console.log("Operator owner is : " + result + " vs " + operatorAddress)
  	return operator.setPaused(false,{from: operatorAddress})
  })

  .then(txObject => {
   const event0 = txObject.logs[0];
   console.log("operator pause state is: " + event0.args.newPausedState);
  })


 });
  
};
