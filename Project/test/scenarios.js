const expectedExceptionPromise = require("../utils/expectedException.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
Promise = require("bluebird");
Promise.allNamed = require("../utils/sequentialPromiseNamed.js");
const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");

if (typeof web3.eth.getAccountsPromise === "undefined") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

const Regulator = artifacts.require("./Regulator.sol");
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol");

contract('scenarios', function(accounts) {

    let owner0, owner1,
        booth0, booth1, booth2,
        vehicle0, vehicle1,
        regulator, operator;
    //const price01 = randomIntIn(1, 1000);
    const price01 = 10; //fix the route price
    //const deposit0 = price01 + randomIntIn(1, 1000);
    const deposit0 = 10; //fix the deposit to 10
    const deposit1 = deposit0 + randomIntIn(1, 1000);
    //const vehicleType0 = randomIntIn(1, 1000);
    const vehicleType0 = 1; //fix type to 1
    const vehicleType1 = 1;
    //const multiplier0 = randomIntIn(1, 1000);
    const multiplier0 = 1; //fix mul to 1
    const multiplier1 = multiplier0 + randomIntIn(1, 1000);
    const tmpSecret = randomIntIn(1, 1000);
    const secret0 = toBytes32(tmpSecret);
    const secret1 = toBytes32(tmpSecret + randomIntIn(1, 1000));
    let hashed0, hashed1;

    before("should prepare", function() {
        assert.isAtLeast(accounts.length, 8);
        owner0 = accounts[0];
        owner1 = accounts[1];
        booth0 = accounts[2];
        booth1 = accounts[3];
        booth2 = accounts[4];
        vehicle0 = accounts[5];
        vehicle1 = accounts[6];
        return web3.eth.getBalancePromise(owner0)
            .then(balance => assert.isAtLeast(web3.fromWei(balance).toNumber(), 10));
    });

    describe("deploy with 10", function() {
     
        beforeEach("Prepar regulator, operators and toll booths", function() {
            return TollBoothOperator.new(false, deposit0, owner0, { from: owner1 })
                .then(instance => operator = instance)
                .then(() => operator.isPaused())
                .then(paused => assert.isFalse(paused))
                .then(() => operator.getDeposit())
                .then(deposit => assert.strictEqual(deposit.toNumber(), deposit0))
                .then(() => Regulator.new({ from: owner0 }))
                .then(instance => regulator = instance)
                .then(() => regulator.setVehicleType(vehicle0, vehicleType0, { from: owner0 }))
                .then(tx => regulator.setVehicleType(vehicle1, vehicleType1, { from: owner0 }))
                .then(tx => regulator.createNewOperator(owner1, deposit0, { from: owner0 }))
                .then(tx => operator = TollBoothOperator.at(tx.logs[1].args.newOperator))
                .then(() => operator.addTollBooth(booth0, { from: owner1 }))
                .then(tx => operator.addTollBooth(booth1, { from: owner1 }))
                .then(tx => operator.addTollBooth(booth2, { from: owner1 }))
                .then(tx => operator.setMultiplier(vehicleType0, multiplier0, { from: owner1 }))
                //.then(tx => operator.setMultiplier(vehicleType1, multiplier1, { from: owner1 }))
                .then(tx => operator.setRoutePrice(booth0, booth1, price01, { from: owner1 }))
                .then(tx => operator.setPaused(false, { from: owner1 }))
                .then(tx => operator.hashSecret(secret0))
                .then(hash => hashed0 = hash)
                .then(tx => operator.hashSecret(secret1))
                .then(hash => hashed1 = hash);
        });

        describe("senario 1", function() {

            it("senario 1", function() {
                console.log("booth0: " + booth0);
                console.log("hashed0: " + hashed0);
                console.log("vehicle0: " + vehicle0);
                console.log("deposit: " +(deposit0 * multiplier0) )
                return operator.enterRoad.call(
                        booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0) })
                    .then(success => assert.isTrue(success))
                    .then(() => operator.enterRoad(
                        booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0) }))
                    .then(tx => {
                        assert.strictEqual(tx.receipt.logs.length, 1);
                        assert.strictEqual(tx.logs.length, 1);
                        const logEntered = tx.logs[0];
                        assert.strictEqual(logEntered.event, "LogRoadEntered");
                        assert.strictEqual(logEntered.args.vehicle, vehicle0);
                        assert.strictEqual(logEntered.args.entryBooth, booth0);
                        assert.strictEqual(logEntered.args.exitSecretHashed, hashed0);
                        assert.strictEqual(logEntered.args.depositedWeis.toNumber(), (deposit0 * multiplier0) );
                        console.log(tx.receipt.gasUsed);
                        return operator.getVehicleEntry(hashed0);
                    })
                    .then(info => {
                        assert.strictEqual(info[0], vehicle0);
                        assert.strictEqual(info[1], booth0);
                        assert.strictEqual(info[2].toNumber(), (deposit0 * multiplier0) );
                        return web3.eth.getBalancePromise(operator.address)
                    })
                    .then(balance => {
                        assert.strictEqual(balance.toNumber(), deposit0 * multiplier0 );
                        return operator.reportExitRoad(secret0, { from: booth1 })
                    })
                    .then(tx => {
                        assert.strictEqual(tx.receipt.logs.length, 1);
                        assert.strictEqual(tx.logs.length, 1);
                        const logExited = tx.logs[0];
                        assert.strictEqual(logExited.event, "LogRoadExited");
                        assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth2");
                        assert.strictEqual(logExited.args.exitSecretHashed, hashed0,"vehicle1 should provide the correct hash");
                        assert.strictEqual(logExited.args.finalFee.toNumber(), deposit0 * multiplier0,"vehicle1 should pay the exact fee");
                        assert.strictEqual(logExited.args.refundWeis.toNumber(), 0,"vehicle1 should have no refund");
                           

                    }); 

            });
        });

        describe("senario 2", function() {

            it("senario 2", function() {
                console.log("booth0: " + booth0);
                console.log("hashed0: " + hashed0);
                console.log("vehicle0: " + vehicle0);
                console.log("deposit: " +(deposit0 * multiplier0) )
                const higherPrice= 15;
                return operator.setRoutePrice(booth0, booth1, higherPrice, { from: owner1 })
              
                .then(tx =>{
                    const logEntered = tx.logs[0];
                    assert.strictEqual(logEntered.event, "LogRoutePriceSet");
                    assert.strictEqual(logEntered.args.priceWeis.toNumber(), higherPrice);
                    return operator.enterRoad.call(
                        booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0) })

                })
                .then(success => assert.isTrue(success))
                .then(() => operator.enterRoad(
                    booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0) }))
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logEntered = tx.logs[0];
                    assert.strictEqual(logEntered.event, "LogRoadEntered");
                    assert.strictEqual(logEntered.args.vehicle, vehicle0);
                    assert.strictEqual(logEntered.args.entryBooth, booth0);
                    assert.strictEqual(logEntered.args.exitSecretHashed, hashed0);
                    assert.strictEqual(logEntered.args.depositedWeis.toNumber(), (deposit0 * multiplier0) );
                    console.log(tx.receipt.gasUsed);
                    return operator.getVehicleEntry(hashed0);
                })
                .then(info => {
                    assert.strictEqual(info[0], vehicle0);
                    assert.strictEqual(info[1], booth0);
                    assert.strictEqual(info[2].toNumber(), (deposit0 * multiplier0) );
                    return web3.eth.getBalancePromise(operator.address)
                })
                .then(balance => {
                    assert.strictEqual(balance.toNumber(), deposit0 * multiplier0 );
                    return operator.reportExitRoad(secret0, { from: booth1 })
                })
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logExited = tx.logs[0];
                    assert.strictEqual(logExited.event, "LogRoadExited");
                    assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth2");
                    assert.strictEqual(logExited.args.exitSecretHashed, hashed0,"vehicle1 should provide the correct hash");
                    assert.strictEqual(logExited.args.finalFee.toNumber(), deposit0 * multiplier0,"vehicle1 should pay less than the original fee");
                    assert.strictEqual(logExited.args.refundWeis.toNumber(), 0,"vehicle1 should have no refund");
                       

                }); 

            });
        });

        describe("senario 3", function() {

            it("senario 3", function() {
                console.log("booth0: " + booth0);
                console.log("hashed0: " + hashed0);
                console.log("vehicle0: " + vehicle0);
                console.log("deposit: " +(deposit0 * multiplier0) )
                const lowerPrice= 6;
                return operator.setRoutePrice(booth0, booth1, lowerPrice, { from: owner1 })
              
                .then(tx =>{
                    const logEntered = tx.logs[0];
                    assert.strictEqual(logEntered.event, "LogRoutePriceSet");
                    assert.strictEqual(logEntered.args.priceWeis.toNumber(), lowerPrice);
                    return operator.enterRoad.call(
                        booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0) })

                })
                .then(success => assert.isTrue(success))
                .then(() => operator.enterRoad(
                    booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0) }))
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logEntered = tx.logs[0];
                    assert.strictEqual(logEntered.event, "LogRoadEntered");
                    assert.strictEqual(logEntered.args.vehicle, vehicle0);
                    assert.strictEqual(logEntered.args.entryBooth, booth0);
                    assert.strictEqual(logEntered.args.exitSecretHashed, hashed0);
                    assert.strictEqual(logEntered.args.depositedWeis.toNumber(), (deposit0 * multiplier0) );
                    console.log(tx.receipt.gasUsed);
                    return operator.getVehicleEntry(hashed0);
                })
                .then(info => {
                    assert.strictEqual(info[0], vehicle0);
                    assert.strictEqual(info[1], booth0);
                    assert.strictEqual(info[2].toNumber(), (deposit0 * multiplier0) );
                    return web3.eth.getBalancePromise(operator.address)
                })
                .then(balance => {
                    assert.strictEqual(balance.toNumber(), deposit0 * multiplier0 );
                    return operator.reportExitRoad(secret0, { from: booth1 })
                })
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logExited = tx.logs[0];
                    assert.strictEqual(logExited.event, "LogRoadExited");
                    assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth2");
                    assert.strictEqual(logExited.args.exitSecretHashed, hashed0,"vehicle1 should provide the correct hash");
                    assert.strictEqual(logExited.args.finalFee.toNumber(), lowerPrice,"vehicle1 should pay the fee and which is less than deposited");
                    assert.strictEqual(logExited.args.refundWeis.toNumber(), (deposit0 * multiplier0) - lowerPrice,"vehicle1 should have a refund");
                       

                }); 

            });
        });

        describe("senario 4", function() {

            it("senario 4", function() {
                console.log("booth0: " + booth0);
                console.log("hashed0: " + hashed0);
                console.log("vehicle0: " + vehicle0);
                console.log("deposit: " +(deposit0 * multiplier0) )
                const higerDeposit = 14;
                return operator.enterRoad.call(
                        booth0, hashed0, { from: vehicle0, value: higerDeposit })

                .then(success => assert.isTrue(success))
                .then(() => operator.enterRoad(
                    booth0, hashed0, { from: vehicle0, value: higerDeposit }))
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logEntered = tx.logs[0];
                    assert.strictEqual(logEntered.event, "LogRoadEntered");
                    assert.strictEqual(logEntered.args.vehicle, vehicle0);
                    assert.strictEqual(logEntered.args.entryBooth, booth0);
                    assert.strictEqual(logEntered.args.exitSecretHashed, hashed0);
                    assert.strictEqual(logEntered.args.depositedWeis.toNumber(), higerDeposit);
                    console.log(tx.receipt.gasUsed);
                    return operator.getVehicleEntry(hashed0);
                })
                .then(info => {
                    assert.strictEqual(info[0], vehicle0);
                    assert.strictEqual(info[1], booth0);
                    assert.strictEqual(info[2].toNumber(), higerDeposit );
                    return web3.eth.getBalancePromise(operator.address)
                })
                .then(balance => {
                    assert.strictEqual(balance.toNumber(), higerDeposit );
                    return operator.reportExitRoad(secret0, { from: booth1 })
                })
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logExited = tx.logs[0];
                    assert.strictEqual(logExited.event, "LogRoadExited");
                    assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth2");
                    assert.strictEqual(logExited.args.exitSecretHashed, hashed0,"vehicle1 should provide the correct hash");
                    assert.strictEqual(logExited.args.finalFee.toNumber(), (deposit0 * multiplier0),"vehicle1 should pay the fee and which is less than deposited");
                    assert.strictEqual(logExited.args.refundWeis.toNumber(), higerDeposit - (deposit0 * multiplier0),"vehicle1 should have a refund");
                       

                }); 

            });
        });

    });

    describe("deploy with unkown route price", function () {

        beforeEach("Prepar regulator, operators and toll booths", function() {
            return TollBoothOperator.new(false, 10, owner0, { from: owner1 })
                .then(instance => operator = instance)
                .then(() => operator.isPaused())
                .then(paused => assert.isFalse(paused))
                .then(() => operator.getDeposit())
                .then(deposit => assert.strictEqual(deposit.toNumber(), 10))
                .then(() => Regulator.new({ from: owner0 }))
                .then(instance => regulator = instance)
                .then(() => regulator.setVehicleType(vehicle0, vehicleType0, { from: owner0 }))
                .then(tx => regulator.setVehicleType(vehicle1, vehicleType1, { from: owner0 }))
                .then(tx => regulator.createNewOperator(owner1, 10, { from: owner0 }))
                .then(tx => operator = TollBoothOperator.at(tx.logs[1].args.newOperator))
                .then(() => operator.addTollBooth(booth0, { from: owner1 }))
                .then(tx => operator.addTollBooth(booth1, { from: owner1 }))
                .then(tx => operator.addTollBooth(booth2, { from: owner1 }))
                .then(tx => operator.setMultiplier(vehicleType0, multiplier0, { from: owner1 }))
                //.then(tx => operator.setMultiplier(vehicleType1, multiplier1, { from: owner1 }))
                //.then(tx => operator.setRoutePrice(booth0, booth1, price01, { from: owner1 }))
                .then(tx => operator.setPaused(false, { from: owner1 }))
                .then(tx => operator.hashSecret(secret0))
                .then(hash => hashed0 = hash)
                .then(tx => operator.hashSecret(secret1))
                .then(hash => hashed1 = hash);
        });

        describe("senario 5", function() {

            it("senario 5", function() {
                console.log("booth0: " + booth0);
                console.log("hashed0: " + hashed0);
                console.log("vehicle0: " + vehicle0);
                console.log("deposit: " +(deposit0 * multiplier0) )
                const higerDeposit = 14;
                const newRoutePrice =11;
                return operator.enterRoad.call(
                        booth0, hashed0, { from: vehicle0, value: higerDeposit })

                .then(success => assert.isTrue(success))
                .then(() => operator.enterRoad(
                    booth0, hashed0, { from: vehicle0, value: higerDeposit }))
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logEntered = tx.logs[0];
                    assert.strictEqual(logEntered.event, "LogRoadEntered");
                    assert.strictEqual(logEntered.args.vehicle, vehicle0);
                    assert.strictEqual(logEntered.args.entryBooth, booth0);
                    assert.strictEqual(logEntered.args.exitSecretHashed, hashed0);
                    assert.strictEqual(logEntered.args.depositedWeis.toNumber(), higerDeposit,"Expected higher deposit");
                    console.log(tx.receipt.gasUsed);
                    return operator.getVehicleEntry(hashed0);
                })
                .then(info => {
                    assert.strictEqual(info[0], vehicle0);
                    assert.strictEqual(info[1], booth0);
                    assert.strictEqual(info[2].toNumber(), higerDeposit,"expect higher deposit" );
                    return web3.eth.getBalancePromise(operator.address)
                })
                .then(balance => {
                    assert.strictEqual(balance.toNumber(), higerDeposit,"expect higher deposit in balance" );
                    return operator.reportExitRoad(secret0, { from: booth1 })
                })
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logExited = tx.logs[0];
                    assert.strictEqual(logExited.event, "LogPendingPayment");
                    assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth1");
                    assert.strictEqual(logExited.args.exitSecretHashed, hashed0,"vehicle1 should provide the correct hash");
                    assert.strictEqual(logExited.args.entryBooth, booth0,"entry booth should be booth0");
                    return operator.setRoutePrice.call(booth0,booth1,newRoutePrice,{from:owner1})
                })
                .then(success => {
                    assert.isTrue(success,"unable to update the route price");
                    return operator.setRoutePrice(booth0,booth1,newRoutePrice,{from:owner1})
                })
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 2,"Two logs should be emitted");
                    assert.strictEqual(tx.logs.length, 2);
                    const logExited = tx.logs[1];
                    assert.strictEqual(logExited.event, "LogRoadExited");
                    assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth2");
                    assert.strictEqual(logExited.args.exitSecretHashed, hashed0,"vehicle1 should provide the correct hash");
                    assert.strictEqual(logExited.args.finalFee.toNumber(), newRoutePrice,"vehicle1 should pay the fee and which is less than deposited");
                    assert.strictEqual(logExited.args.refundWeis.toNumber(), higerDeposit - newRoutePrice,"vehicle1 should have a refund");
                       

                }); 


            });
        });

        describe("senario 6", function() {

            it("senario 6", function() {
                console.log("booth0: " + booth0);
                console.log("hashed0: " + hashed0);
                console.log("vehicle0: " + vehicle0);
                console.log("deposit: " +(deposit0 * multiplier0) )
                const higerDeposit = 14;
                const newRoutePrice =6;
                const deposit2 =10;
                return operator.enterRoad.call(
                        booth0, hashed0, { from: vehicle0, value: higerDeposit })

                .then(success => assert.isTrue(success))
                .then(() => operator.enterRoad(
                    booth0, hashed0, { from: vehicle0, value: higerDeposit }))
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logEntered = tx.logs[0];
                    assert.strictEqual(logEntered.event, "LogRoadEntered");
                    assert.strictEqual(logEntered.args.vehicle, vehicle0);
                    assert.strictEqual(logEntered.args.entryBooth, booth0);
                    assert.strictEqual(logEntered.args.exitSecretHashed, hashed0);
                    assert.strictEqual(logEntered.args.depositedWeis.toNumber(), higerDeposit);
                    console.log(tx.receipt.gasUsed);
                    return operator.getVehicleEntry(hashed0);
                })
                .then(info => {
                    assert.strictEqual(info[0], vehicle0);
                    assert.strictEqual(info[1], booth0);
                    assert.strictEqual(info[2].toNumber(), higerDeposit );
                    return web3.eth.getBalancePromise(operator.address)
                })
                .then(balance => {
                    assert.strictEqual(balance.toNumber(), higerDeposit );
                    return operator.reportExitRoad(secret0, { from: booth1 })
                })
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logExited = tx.logs[0];
                    assert.strictEqual(logExited.event, "LogPendingPayment");
                    assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth1");
                    assert.strictEqual(logExited.args.exitSecretHashed, hashed0,"vehicle1 should provide the correct hash");
                    assert.strictEqual(logExited.args.entryBooth, booth0,"entry booth should be booth0");
                    return operator.enterRoad.call(
                        booth0, hashed1, { from: vehicle1, value: deposit2 })
                })
                .then(success => {
                    assert.isTrue(success);
                    return operator.enterRoad(
                        booth0, hashed1, { from: vehicle1, value: deposit2 })
                })
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logEntered = tx.logs[0];
                    assert.strictEqual(logEntered.event, "LogRoadEntered");
                    assert.strictEqual(logEntered.args.vehicle, vehicle1);
                    assert.strictEqual(logEntered.args.entryBooth, booth0);
                    assert.strictEqual(logEntered.args.exitSecretHashed, hashed1);
                    assert.strictEqual(logEntered.args.depositedWeis.toNumber(), deposit2);
                    console.log(tx.receipt.gasUsed);
                    return operator.getVehicleEntry(hashed1);
                })
                .then(info => {
                    assert.strictEqual(info[0], vehicle1);
                    assert.strictEqual(info[1], booth0);
                    assert.strictEqual(info[2].toNumber(), deposit2 );
                    return web3.eth.getBalancePromise(operator.address)
                })
                .then(balance => {
                    assert.strictEqual(balance.toNumber(), higerDeposit + deposit2, "operator should have both deposits");
                    return operator.reportExitRoad(secret1, { from: booth1 })
                })
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logExited = tx.logs[0];
                    assert.strictEqual(logExited.event, "LogPendingPayment");
                    assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth1");
                    assert.strictEqual(logExited.args.exitSecretHashed, hashed1,"vehicle2 should provide the correct hash");
                    assert.strictEqual(logExited.args.entryBooth, booth0,"entry booth should be booth0");
                    return operator.setRoutePrice.call(booth0,booth1,newRoutePrice,{from:owner1})

                })
                .then(success => {
                    assert.isTrue(success,"unable to update the route price");
                    return operator.setRoutePrice(booth0,booth1,newRoutePrice,{from:owner1})
                })
               .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 2,"Two logs should be emitted");
                    assert.strictEqual(tx.logs.length, 2);
                    const logExited = tx.logs[1];
                    assert.strictEqual(logExited.event, "LogRoadExited");
                    assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth2");
                    assert.strictEqual(logExited.args.exitSecretHashed, hashed0,"vehicle1 should provide the correct hash");
                    assert.strictEqual(logExited.args.finalFee.toNumber(), newRoutePrice,"vehicle1 should pay the fee and which is less than deposited");
                    assert.strictEqual(logExited.args.refundWeis.toNumber(), higerDeposit - newRoutePrice,"vehicle1 should have a refund");
                    return operator.clearSomePendingPayments(booth0,booth1,1,{from:owner1})
                })
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logExited = tx.logs[0];
                    assert.strictEqual(logExited.event, "LogRoadExited");
                    assert.strictEqual(logExited.args.exitBooth, booth1,"exit booth should be booth2");
                    assert.strictEqual(logExited.args.exitSecretHashed, hashed1,"vehicle2 should provide the correct hash");
                    assert.strictEqual(logExited.args.finalFee.toNumber(), newRoutePrice,"vehicle1 should pay the fee and which is less than deposited");
                    assert.strictEqual(logExited.args.refundWeis.toNumber(), deposit2 - newRoutePrice,"vehicle1 should have a refund");
                }); 


            });
        });
      
    }); 
    
});



