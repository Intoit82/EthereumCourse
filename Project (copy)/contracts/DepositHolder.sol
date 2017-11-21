pragma solidity ^0.4.13;

import "./interfaces/DepositHolderI.sol";
import "./Owned.sol";

contract DepositHolder is Owned, DepositHolderI {
    uint deposit;

        /**
     * Event emitted when the deposit value has been set.
     * @param sender The account that ran the action.
     * @param depositWeis The value of the deposit measured in weis.
     */
    event LogDepositSet(address indexed sender, uint depositWeis);

    function DepositHolder(uint initialDeposit)
    public
    {
        require(initialDeposit > 0);
        deposit = initialDeposit;
        //LogDepositSet(msg.sender,deposit);
    }

    /**
     * Called by the owner of the DepositHolder.
     *     It should roll back if the caller is not the owner of the contract.
     *     It should roll back if the argument passed is 0.
     *     It should roll back if the argument is no different from the current deposit.
     * @param depositWeis The value of the deposit being set, measure in weis.
     * @return Whether the action was successful.
     * Emits LogDepositSet.
     */
    function setDeposit(uint depositWeis)
    fromOwner
    public
    returns(bool success)
    {
        require(deposit != depositWeis);
        require(depositWeis > 0);
        deposit = depositWeis;
        LogDepositSet(msg.sender,deposit); 
        success = true;
    }

    /**
     * @return The base price, then to be multiplied by the multiplier, a given vehicle
     * needs to deposit to enter the road system.
     */
    function getDeposit()
        constant
        public
        returns(uint weis)
        {
            return deposit;
        }

    /*
     * You need to create:
     *
     * - a contract named `DepositHolder` that:
     *     - is `OwnedI`, and `DepositHolderI`.
     *     - has a constructor that takes:
     *         - one `uint` parameter, the initial deposit wei value, which cannot be 0.
     */
}