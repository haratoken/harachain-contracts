pragma solidity ^0.4.25;


/**
 * @title Buy Mechanism Interface
 * @dev 
 */
interface IBuyMechanism {
    function getReceipt(uint256 _txReceiptId)   external view
    returns (address buyer, address seller, string id, uint256 value);
}