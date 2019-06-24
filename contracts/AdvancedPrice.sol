pragma solidity ^0.5.2;

import "./interfaces/IPriceable.sol";
import "./../open-zeppelin/ownership/Ownable.sol";
import "./../open-zeppelin/math/SafeMath.sol";


interface SpecialPrice {
    function getPrice(uint256 _basePrice) external view returns (uint256 finalPrice);
}


/**
 * @title AdvancedPrice
 * @dev Pricing with exchange rate.
 */
contract AdvancedPrice is IPriceable, Ownable {
    using SafeMath for uint256;
    // // storage
    mapping(address => mapping(bytes32 => uint256)) public basePrice;
    SpecialPrice public priceType;
    
    // events
    event PriceTypeChangedLog(address indexed by, address indexed oldAddress, address indexed newAddress);

    // constructor
    constructor(address _priceTypeAddress)
    public {
        setPriceType(_priceTypeAddress);
    }

    /**
    * @dev Function to set base price of specific price Id.
    * @param _id Price id of item.
    * @param _value Value of item.
    */
    function setPrice(bytes32 _id, uint256 _value) external {
        uint256 _oldValue = basePrice[msg.sender][_id];
        basePrice[msg.sender][_id] = _value;
        emit PriceChangedLog(address(this), _id, _oldValue, _value);
    }

    /**
    * @dev Function to get price of specific price Id.
    * @param _id Price id of item.
    * @return Uint256 of price.
    */
    function getPrice(bytes32 _id) external view returns (uint256 idPrice) {
        require(basePrice[msg.sender][_id] != 0, "base price must be set");
        uint256 _basePrice = basePrice[msg.sender][_id];
        idPrice = priceType.getPrice(_basePrice);
        // get price panggil priceTypeAddress(_baseprice)
    }

    /**
    * @dev Function to get sale status of specific price Id.
    * @param _id Price id of item.
    * @return Boolean of sale status. True means on sale.
    */
    function isSale(bytes32 _id)  external view returns (bool _saleStatus) {
        return true;
    }



    /**
    * @dev Function to set price type contract address. Only owner of contract can call this function.
    * @param _newAddress Contract address for price type, example ExchangeRate Contract.
    */
    function setPriceType(address _newAddress) public onlyOwner {
        address oldAddress = address(priceType);
        priceType = SpecialPrice(_newAddress);
        emit PriceTypeChangedLog(msg.sender, oldAddress, address(priceType));
    }

    /**
    * @dev function to destroy contract
    */
    function kill() 
    public
    onlyOwner {
        selfdestruct(address(uint160(owner())));
    }
}
