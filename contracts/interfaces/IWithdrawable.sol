pragma solidity ^0.4.25;


/**
 * @title Buyable
 * @dev 
 */
interface IWithdrawable {

    // events
    event WithdrawnLog(address to, address seller, uint256 value);
    
    // functions
    function withdrawSales(address _to, uint256 _value) external;
}