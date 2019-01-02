pragma solidity ^0.4.25;

import "./interfaces/IPriceable.sol";
import "./../open-zeppelin/ownership/Ownable.sol";


/**
 * @title AdvancedPrice
 * @dev [WIP] Example contract of advanced pricing. Waiting the requirement.
 */
contract AdvancedPrice is IPriceable, Ownable {
    // storage
    mapping(bytes32=>uint256) price;
    address dataAddress;
    
    // events
    event PriceAddressChangedLog(address by, address oldAddress, address newAddress);

    //modifier
    modifier onlyData() {
        require(msg.sender == dataAddress, "Can only be acessed by data contract address");
        _;
    }

    constructor(address _dataAddress)
    public {
        dataAddress = _dataAddress;
    }
    
    /**
    * @dev Function to set price of specific price Id. Only owner of item can call this function.
    * @param _id Price id of item.
    * @param _value Value of item.
    */
    function setPrice(bytes32 _id, uint256 _value) external onlyData {
        price[_id] = _value;
    }

    /**
    * @dev Function to get price of specific price Id.
    * @param _id Price id of item.
    * @return Uint256 of price.
    */
    function getPrice(bytes32 _id) external view  returns (uint256 idPrice) {        
        idPrice = this.getPrice(_id, msg.sender);
    }

    /**
    * @dev Function to get price of specific price Id.
    * @param _id Price id of item.
    * @param _data Address.
    * @return Uint256 of price.
    */
    function getPrice(bytes32 _id, address _data) public view  returns (uint256 idPrice) {
        idPrice = price[_id];
    }

    /**
    * @dev Function to get sale status of specific price Id.
    * @param _id Price id of item.
    * @return Boolean of sale status. True means on sale.
    */
    function isSale(bytes32 _id)  external view returns (bool _saleStatus){
        return true;
    }

    /**
    * @dev function to destroy contract
    */
    function kill() 
    public
    onlyOwner {
        selfdestruct(owner());
    }
}