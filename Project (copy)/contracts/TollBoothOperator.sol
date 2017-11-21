pragma solidity ^0.4.13;

import "./interfaces/TollBoothOperatorI.sol";
import "./TollBoothHolder.sol";
import "./Pausable.sol";
import "./DepositHolder.sol";
import "./MultiplierHolder.sol";
import "./RoutePriceHolder.sol";
import "./Regulated.sol";

 
contract TollBoothOperator is Pausable ,DepositHolder , MultiplierHolder ,
RoutePriceHolder,Regulated, TollBoothHolder, TollBoothOperatorI  {

    uint collectedFees;
    uint claimedFees;
    
    //Data structure for entring vehicle
    struct entryData
    {
        address vehicle;
        address entryBooth;
        uint deposit;
    }
    
    struct pendingPayment
    {
        uint count;
        bytes32[] hashedSecretCollection;
    }
   
    mapping(bytes32 => entryData) secretMapping;
    
    mapping(bytes32 => bytes32[]) pendingPaymentsMapping; //map the hash of the entry and exit booth to the number of pending payments
    

    function TollBoothOperator(bool initState, uint initDeposit, address regulator)
    Pausable(initState)
    DepositHolder(initDeposit)
    Regulated(regulator)
    public
    {
        //all conditions are met in the constructors
        collectedFees = 0;
        
    }

    /**
     * This provides a single source of truth for the encoding algorithm.
     * @param secret The secret to be hashed.
     * @return the hashed secret.
     */
    function hashSecret(bytes32 secret)
        constant
        public
        returns(bytes32 hashed)
        {
            hashed = keccak256(secret);
        }

    /**
     * Event emitted when a vehicle made the appropriate deposit to enter the road system.
     * @param vehicle The address of the vehicle that entered the road system.
     * @param entryBooth The declared entry booth by which the vehicle will enter the system.
     * @param exitSecretHashed A hashed secret that when solved allows the operator to pay itself.
     * @param depositedWeis The amount that was deposited as part of the entry.
     */
    event LogRoadEntered(
        address indexed vehicle,
        address indexed entryBooth,
        bytes32 indexed exitSecretHashed,
        uint depositedWeis);

    /**
     * Called by the vehicle entering a road system.
     * Off-chain, the entry toll booth will open its gate up successful deposit and confirmation
     * of the vehicle identity.
     *     It should roll back when the contract is in the `true` paused state.
     *     It should roll back if `entryBooth` is not a tollBooth.
     *     It should roll back if less than deposit * multiplier was sent alongside.
     *     It should be possible for a vehicle to enter "again" before it has exited from the 
     *       previous entry.
     * @param entryBooth The declared entry booth by which the vehicle will enter the system.
     * @param exitSecretHashed A hashed secret that when solved allows the operator to pay itself.
     *   A previously used exitSecretHashed cannot be used ever again.
     * @return Whether the action was successful.
     * Emits LogRoadEntered.
     */
    function enterRoad(
            address entryBooth,
            bytes32 exitSecretHashed)
        whenNotPaused
        public
        payable
        returns (bool success)
        {
            require(isTollBooth(entryBooth));
            
            RegulatorI regulator = getRegulator();
            uint vehicleType = regulator.getVehicleType(msg.sender);
            require(vehicleType > 0); //make sure vehicle is Regulated
                        
            uint paymentRequire = getMultiplier(vehicleType) * getDeposit();
            require(msg.value >= paymentRequire); //make sure enough funds were sent alongside
            
            //update mapping values
            secretMapping[exitSecretHashed].vehicle = msg.sender;
            secretMapping[exitSecretHashed].entryBooth = entryBooth;
            secretMapping[exitSecretHashed].deposit = msg.value;
            
            LogRoadEntered(msg.sender, entryBooth, exitSecretHashed,msg.value);
            
            success = true;
            
        }

    /**
     * @param exitSecretHashed The hashed secret used by the vehicle when entering the road.
     * @return The information pertaining to the entry of the vehicle.
     *     vehicle: the address of the vehicle that entered the system.
     *     entryBooth: the address of the booth the vehicle entered at.
     *     depositedWeis: how much the vehicle deposited when entering.
     * After the vehicle has exited, `depositedWeis` should be returned as `0`.
     * If no vehicles had ever entered with this hash, all values should be returned as `0`.
     */
    function getVehicleEntry(bytes32 exitSecretHashed)
        constant
        public
        returns(
            address vehicle,
            address entryBooth,
            uint depositedWeis)
            {
               entryData memory data = secretMapping[exitSecretHashed];
               vehicle = data.vehicle;
               entryBooth = data.entryBooth;
               depositedWeis = data.deposit;
            }
        
    /**
     * Gets the pending route key for mapping the exit and entry booths
    */
    function getPendingRouteKey(address entryBooth,address exitBooth)
    private
    constant
    returns(bytes32)
    {
        require(isTollBooth(entryBooth));
        require(isTollBooth(exitBooth));
        return keccak256(entryBooth,exitBooth);
    }
    
    /**
     * Gets the pending hashSecret key for mapping 
    */
    function getPendingSecretKey(bytes32 routeKey,uint id)
    private
    constant
    returns(bytes32)
    {
       return keccak256(routeKey,id);
    }

    /**
     * Gets the total fee
    */
    function getTotalFee(address entryBooth,address exitBooth,address vehicle)
    private
    constant
    returns(uint)
    {
       uint basePrice = getRoutePrice(entryBooth , exitBooth);
       RegulatorI reg = getRegulator();
       uint vehicleType = reg.getVehicleType(vehicle);
       uint multiplier = getMultiplier(vehicleType);

       return basePrice * multiplier; 
    }

    /**
     * Event emitted when a vehicle exits a road system.
     * @param exitBooth The toll booth that saw the vehicle exit.
     * @param exitSecretHashed The hash of the secret given by the vehicle as it
     *     passed by the exit booth.
     * @param finalFee The toll fee taken from the deposit.
     * @param refundWeis The amount refunded to the vehicle, i.e. deposit - fee.
     */
    event LogRoadExited(
        address indexed exitBooth,
        bytes32 indexed exitSecretHashed,
        uint finalFee,
        uint refundWeis);

    /**
     * Event emitted when a vehicle used a route that has no known fee.
     * It is a signal for the oracle to provide a price for the pair.
     * @param exitSecretHashed The hashed secret that was defined at the time of entry.
     * @param entryBooth The address of the booth the vehicle entered at.
     * @param exitBooth The address of the booth the vehicle exited at.
     */
    event LogPendingPayment(
        bytes32 indexed exitSecretHashed,
        address indexed entryBooth,
        address indexed exitBooth);

    /**
     * Called by the exit booth.
     *     It should roll back when the contract is in the `true` paused state.
     *     It should roll back when the sender is not a toll booth.
     *     It should roll back if the exit is same as the entry.
     *     It should roll back if the secret does not match a hashed one.
     * @param exitSecretClear The secret given by the vehicle as it passed by the exit booth.
     * @return status:
     *   1: success, -> emits LogRoadExited
     *   2: pending oracle -> emits LogPendingPayment
     */
    function reportExitRoad(bytes32 exitSecretClear)
    whenNotPaused
        public
        returns (uint status)
        {
            require(isTollBooth(msg.sender));
            
            bytes32 hashed = hashSecret(exitSecretClear);
            
            entryData memory mappedData = secretMapping[hashed];
            
            //make sure vehicle is valid
            require(mappedData.vehicle != address(0));

            //make sure secret hash is valid
            require(mappedData.deposit != 0);
           
            //check booths
            require(msg.sender != mappedData.entryBooth);
             
            uint fee = getTotalFee(mappedData.entryBooth , msg.sender,mappedData.vehicle);
            
            if (fee <=0)
            {
                //update pending counter
                bytes32 key = getPendingRouteKey(mappedData.entryBooth,msg.sender);
                
                //set pending hash
                pendingPaymentsMapping[key].push(hashed);
                
                LogPendingPayment( hashed, mappedData.entryBooth, msg.sender);
                status = 2;
                return status;
            }
            
            uint refund = 0;

            //empty the deposit
            secretMapping[hashed].deposit = 0;
            
            //charge only available fees
            if(fee > mappedData.deposit)
            {
               fee = mappedData.deposit;
            }              
            else
            {
                //send refund
                refund = mappedData.deposit - fee;
                require(mappedData.vehicle.send(refund));
            }
            
            

            //report log
            LogRoadExited(msg.sender, hashed,fee, refund);
            
            //update collectedFees 
            collectedFees += fee;
            status = 1;
            
        }

  

    /**
     * @param entryBooth the entry booth that has pending payments.
     * @param exitBooth the exit booth that has pending payments.
     * @return the number of payments that are pending because the price for the
     * entry-exit pair was unknown.
     */
    function getPendingPaymentCount(address entryBooth, address exitBooth)
        constant
        public
        returns (uint count)
        {
            bytes32 key = getPendingRouteKey(entryBooth,exitBooth);
            count = pendingPaymentsMapping[key].length;
        }

    /**
     * Can be called by anyone. In case more than 1 payment was pending when the oracle gave a price.
     *     It should roll back when the contract is in `true` paused state.
     *     It should roll back if booths are not really booths.
     *     It should roll back if there are fewer than `count` pending payment that are solvable.
     *     It should roll back if `count` is `0`.
     * @param entryBooth the entry booth that has pending payments.
     * @param exitBooth the exit booth that has pending payments.
     * @param count the number of pending payments to clear for the exit booth.
     * @return Whether the action was successful.
     * Emits LogRoadExited as many times as count.
     */
    function clearSomePendingPayments(
            address entryBooth,
            address exitBooth,
            uint count)
            
        whenNotPaused
        public
        returns (bool success)
        {
            require(isTollBooth(entryBooth));
            require(isTollBooth(exitBooth));
            uint pendingCount = pendingPaymentsMapping[getPendingRouteKey(entryBooth,exitBooth)].length;
            require(pendingCount >= count);
            require(pendingCount >0);
            require(count >0);
            
            
            for(uint i =0; i< count; i++)
            {
                var pendingKey = getPendingRouteKey(entryBooth,exitBooth);
                
                //get hashedSecret
                bytes32 hashedSecret = pendingPaymentsMapping[pendingKey][i];
                entryData memory mappedData = secretMapping[hashedSecret];
                
                //Get the fee
                uint fee = getTotalFee(entryBooth , exitBooth,mappedData.vehicle);
            

                uint refund = 0;
                //empty the deposit
                secretMapping[hashedSecret].deposit = 0;

                 //charge only available fees
                if(fee > mappedData.deposit)
                {
                    fee = mappedData.deposit;
                }
                else
                {
                    //send refund
                    refund = mappedData.deposit - fee;
                    require(mappedData.vehicle.send(refund));
                }
                
                //report log
                LogRoadExited(exitBooth, hashedSecret,fee, refund);
                                
                //update collectedFees 
                collectedFees += fee;
                
            }
            
            RemoveHashes( count, pendingKey);
            
            
            success = true;
        }
        
        /**
         * Remove hashes from collection FIFO
        */ 
        function RemoveHashes(uint count,bytes32 key)
        private
        returns(bool)
        {
            bytes32[] memory temp = pendingPaymentsMapping[key];
            uint length = pendingPaymentsMapping[key].length;
            uint counter =0;
            for(uint i= length - count; i<length; i++)
            {
                pendingPaymentsMapping[key][counter] = temp[i];
                counter++;
            }
            
            pendingPaymentsMapping[key].length = length - count;
            
            return true;
        }

    /**
     * @return The amount that has been collected through successful payments. This is the current
     *   amount, it does not reflect historical fees. So this value goes back to zero after a call
     *   to `withdrawCollectedFees`.
     */
    function getCollectedFeesAmount()
        constant
        public
        returns(uint amount)
        {
         
            amount = collectedFees - claimedFees;
        }

    /**
     * Event emitted when the owner collects the fees.
     * @param owner The account that sent the request.
     * @param amount The amount collected.
     */
    event LogFeesCollected(
        address indexed owner,
        uint amount);

    /**
     * Called by the owner of the contract to withdraw all collected fees (not deposits) to date.
     *     It should roll back if any other address is calling this function.
     *     It should roll back if there is no fee to collect.
     *     It should roll back if the transfer failed.
     * @return success Whether the operation was successful.
     * Emits LogFeesCollected.
     */
    function withdrawCollectedFees()
        fromOwner
        public
        returns(bool success)
        {
            uint amountToClaim = getCollectedFeesAmount();
            require(amountToClaim >0);
            claimedFees += amountToClaim;
            require(msg.sender.send(amountToClaim));
            
            LogFeesCollected(msg.sender,amountToClaim);
            
            success = true;
        }

    /**
     * This function overrides the eponymous function of `RoutePriceHolderI`, to which it adds the following
     * functionality:
     *     - If relevant, it will release 1 pending payment for this route. As part of this payment
     *       release, it will emit the appropriate `LogRoadExited` event.
     *     - In the case where the next relevant pending payment is not solvable, which can happen if,
     *       for instance the vehicle has had wrongly set values in the interim:
     *       - It should release 0 pending payment
     *       - It should not roll back the transaction
     *       - It should behave as if there had been no pending payment, apart from the higher gas consumed.
     *     - It should be possible to call it even when the contract is in the `true` paused state.
     * Emits LogRoadExited if applicable.
     */
    function setRoutePrice(
            address entryBooth,
            address exitBooth,
            uint priceWeis)
        public
        returns(bool success)
        {
            super.setRoutePrice(entryBooth,exitBooth,priceWeis); //call the overrriden function
            
            bytes32 key = getPendingRouteKey(entryBooth,exitBooth);
            if(pendingPaymentsMapping[key].length > 0) 
            {
                clearSomePendingPayments(entryBooth,exitBooth,1);
            }
            
            //allow to continue as normal
            
            success = true;
        }
     

    /*
     * You need to create:
     *
     * - a contract named `TollBoothOperator` that:
     *     - is `OwnedI`, `PausableI`, `DepositHolderI`, `TollBoothHolderI`,
     *         `MultiplierHolderI`, `RoutePriceHolderI`, `RegulatedI` and `TollBoothOperatorI`.
     *     - has a constructor that takes:
     *         - one `bool` parameter, the initial paused state.
     *         - one `uint` parameter, the initial deposit wei value, which cannot be 0.
     *         - one `address` parameter, the initial regulator, which cannot be 0.
     */
}