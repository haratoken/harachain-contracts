pragma solidity ^0.5.2;


/**
 * @title Buyable
 * @dev 
 */
interface IWithdrawable {

    // events
    event WithdrawnLog(address indexed to, address indexed seller, uint256 value);
    
    // functions
    function withdrawSales(address _to, uint256 _value) external;
}