pragma solidity ^0.4.25;


/**
 * @title Priceable
 * @dev 
 */
interface IPriceable {
    
    // events
    event PriceChangedLog(bytes32 id, uint oldValue, uint256 newValue);
    event SaleLog(address sellerAddress, bytes32 id, bool saleStatus);

    // functions
    function setPrice(bytes32 _id, uint256 _value) external;
    function getPrice(bytes32 _id) external view  returns (uint256 _idPrice);
}