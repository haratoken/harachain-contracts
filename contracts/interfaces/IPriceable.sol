pragma solidity ^0.5.2;


/**
 * @title Priceable
 * @dev 
 */
interface IPriceable {
    
    // events
    event PriceChangedLog(bytes32 indexed id, uint oldValue, uint256 newValue);
    event SaleLog(address indexed sellerAddress, bytes32 id, bool saleStatus);

    // functions
    function setPrice(bytes32 _id, uint256 _value) external;
    function getPrice(bytes32 _id) external view  returns (uint256 _idPrice);
    function isSale(bytes32 _id) external view returns (bool _saleStatus);
}