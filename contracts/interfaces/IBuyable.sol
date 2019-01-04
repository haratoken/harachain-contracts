pragma solidity ^0.4.25;


/**
 * @title Buyable
 * @dev 
 */
interface IBuyable {

    // events
    event BoughtLog(address buyer, address seller, bytes32 id, uint256 value);
    
    function getPurchaseStatus(address buyer, bytes32 id) external view returns (bool permission);

    // ownerOnly
    // implementer of buy function must make sure there is txReceipt variable
    // txReceipt must not use twice
    // one txReceipt only for one transaction receipt
    function buy(uint256 _txReceipt) external returns (bool);
}