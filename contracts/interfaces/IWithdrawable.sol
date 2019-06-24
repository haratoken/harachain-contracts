pragma solidity ^0.5.2;


/**
 * @title Buyable
 * @dev 
 */
interface IWithdrawable {

    // events
    event WithdrawnLog(address indexed to, address indexed from, uint256 value);
    
    // functions
    function withdraw(address _to, uint256 _value) external;
}