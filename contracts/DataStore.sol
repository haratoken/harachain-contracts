pragma solidity ^0.4.25;

import "./BasicMarketItem.sol";
import "./interfaces/IBuyMechanism.sol";
import "./DataFactoryRegistry.sol";

import "./../open-zeppelin/token/ERC20/ERC20.sol";
import "./../open-zeppelin/math/SafeMath.sol";

/**
 * @title DataStore
 * @dev contract that store all data information.
 */

contract DataStore is BasicMarketItem {    

    using SafeMath for uint256;

    // storage
    address public priceAddress;
    mapping(bytes32=>uint256) internal price;

    mapping(bytes32=>bool) internal saleStatus;
    mapping(address=>mapping(bytes32=>bool)) private purchaseStatus;

    DataFactoryRegistry dataFactory;
    IBuyMechanism private buyMechanism;
    ERC20 private hart;
    address public hartAddress;

    address public owner;
    bytes public signature;
    bytes public signatureFunc; 
    address public location; 
    mapping(bytes32=>bytes32) public metadata;
    
    
    // events
    event DataLog(address owner, address location, bytes signature, bytes signatureFunc);
    event DataUpdateLog(string dataType, bool dataValid);
    event MetadataLog(bytes32 keyMetadata, bytes32 valueMetadata);
    event LocationSetLog(string dataType, bytes newLocation);
    event PriceAddressChangedLog(address by, address oldAddress, address newAddress);

    //modifiers
    /**
    * @dev Modifier to check metadata length.
    * @param key Key of metadata.
    * @param value Value of metadata.
    */
    modifier checkMetadataLength(bytes32[] key, bytes32[] value){
        require(key.length == value.length, "Key length is not same with value length");
        _;
    }

    /**
    * @dev Modifier to check if function called by hara token contract address.
    */
    modifier onlyHart() {
        require(msg.sender == hartAddress, "Can only accesed by Hart.");
        _;
    }

    /**
    * @dev Constructor to intial data information on contract.
    * @param _owner Data owner.
    * @param _location Location of data.
    * @param _signature Signature of data.
    * @param _signatureFunc Signature function of data.
    * @param _hartAddress Address of hara token contract.
    */
    constructor(
        address _owner, 
        address _location, 
        bytes _signature, 
        bytes _signatureFunc,
        address _hartAddress,
        address _dataFactoryRegistryAddress
        )    
    BasicMarketItem(_owner)
    public
    {
        owner = _owner;
        signature = _signature;
        signatureFunc = _signatureFunc;
        location = _location;
        dataFactory = DataFactoryRegistry(_dataFactoryRegistryAddress);
        emit DataLog(_owner, _location, _signature, _signatureFunc);
        buyMechanism = IBuyMechanism(_hartAddress);
        hart = ERC20(_hartAddress);
        hartAddress = _hartAddress;
    }
    
    /**
    * @dev Function to add additional information of data. Only owner can call this function.
    * @param _metadataType Type of information, example size, dimension, etc.
    * @param _metadataDetails Value of new information.
    */
    function setMetadata(bytes32 _metadataType, bytes32 _metadataDetails)
    public
    onlyOwner    
    {
        metadata[_metadataType] = _metadataDetails;
        emit MetadataLog(_metadataType, _metadataDetails);
    }

    /**
    * @dev Function to initial metadata. Only owner can call this function. Only item that not valid can use this function.
    * @param _keyMetadata List of keys of metadata.
    * @param _valueMetadata List of value of metadata.
    */
    function setMetadatas(
        bytes32[] _keyMetadata, 
        bytes32[] _valueMetadata
        ) 
        public
        onlyOwner
        checkMetadataLength(_keyMetadata, _valueMetadata)
        {
        for (uint i = 0; i < _keyMetadata.length; i++) {
            metadata[_keyMetadata[i]] = _valueMetadata[i];
            emit MetadataLog(_keyMetadata[i], metadata[_keyMetadata[i]]);
        }
    }
        
    /**
    * @dev Function to get specific information of data.
    * @param _dataType Type of information to query
    * @return Bytes of data value.
    * 
    */
    function getMetadata(bytes32 _dataType) 
    public
    view 
    returns(bytes32){
        return metadata[_dataType];
    }
    
    /**
    * @dev Function to set price address of item.
    * @param _newAddress New price address.
    */
    function setPriceAddress(address _newAddress) public onlyOwner {
        address oldAddress = priceAddress;
        priceAddress = _newAddress;
        emit PriceAddressChangedLog(msg.sender, oldAddress, _newAddress);
    }
    
    /**
    * @dev Function to set price of specific price Id. Only owner of item can call this function.
    * @param _id Price id of item.
    * @param _value Value of item.
    */
    function setPrice(bytes32 _id, uint256 _value) external onlyOwner {
        uint256 _oldValue;
        if (priceAddress == address(0)) {
            _oldValue = price[_id];
            price[_id] = _value;
        } else {
            IPriceable priceContract = IPriceable(priceAddress);
            _oldValue = priceContract.getPrice(_id);
            priceContract.setPrice(_id, _value);
        }
        emit PriceChangedLog(_id, _oldValue, _value);
    }

    /**
    * @dev Function to get price of specific price Id.
    * @param _id Price id of item.
    * @return Uint256 of price.
    */
    function getPrice(bytes32 _id) external view  returns (uint256 idPrice) {
        if (priceAddress == address(0)) {
            idPrice = price[_id];
        } else {
            IPriceable priceContract = IPriceable(priceAddress);
            idPrice = priceContract.getPrice(_id);
        }
    }

    /**
    * @dev Function to set sale status of specific price Id. Only owner of item can call this function.
    * @param _id Price id of item.
    * @param _saleStatus Sale status of specific item price Id. True means on sale.
    */
    function setSale(bytes32 _id, bool _saleStatus) public onlyOwner {
        saleStatus[_id] = _saleStatus;
        emit SaleLog(address(this), _id, _saleStatus);
    }

    /**
    * @dev Function to get sale status of specific price Id.
    * @param _id Price id of item.
    * @return Boolean of sale status. True means on sale.
    */
    function isSale(bytes32 _id)  external view returns (bool _saleStatus){
        _saleStatus = saleStatus[_id];
    }

    /**
    * @dev Function to withdraw sales token. Only owner can call this function.
    * @param _to Address destination to transfer the sales token.
    * @param _value Value of token to withdraw.
    */
    function withdrawSales(address _to, uint256 _value) public onlyOwner {
        require(hart.balanceOf(address(this)) >= _value, "Your sales is less than value you want to withdraw");
        require(hart.transfer(_to, _value), "Failed to withdraw sales");
        emit WithdrawnLog(_to, address(this), _value);
    }

    /**
    * @dev Function to buy item from transaction receipt. Only hara token contract address can call this function.
    * @param _txReceipt Transaction receipt of buy proccess.
    * @return Boolean of buy status.
    */
    function buy(uint256 _txReceipt) public onlyHart returns (bool) {
    // function buy(address seller, bytes32 id, uint256 value, address buyer, uint256 txReciept) 
    // public onlyHart returns (bool) {
        // require(isSale(id) == true, "Item is not on sale");
        // require(value >= getPrice(id), "Value underpriced");

        address buyer;
        address seller;
        bytes32 id;
        uint256 value;
        (buyer, seller, id, value) = buyMechanism.getReceipt(_txReceipt);
        purchaseStatus[buyer][id] = true;
        emit BoughtLog(buyer, seller, id, value);

        uint256 forHara = getPercentage(value, dataFactory.getPercentage(0));
        uint256 forDataProvider = getPercentage(value, dataFactory.getPercentage(1));
        require(hart.transfer(location, forDataProvider), "Payment to Data Provider failed");
        require(hart.transfer(dataFactory.haraAddress(), forHara), "Payment to Hara failed");
        return true;
    }

    function getPercentage(uint256 number, uint256 percent) internal pure returns(uint256 result) {
        result = number.mul(percent) / 100;
    }

    /**
    * @dev Function to get purchase status of buyer for specific item id
    * @param _buyer Buyer to get purchase status
    * @param _id Price id item to get purchase status.
    */
    function getPurchaseStatus(address _buyer, bytes32 _id) external view  returns (bool permission) {
        if (_buyer == owner) {
            permission = true;
        } else {
            permission = purchaseStatus[_buyer][_id];
        }
    }

    /**
    * @dev function to destroy contract
    */
    function kill() 
    public
    onlyOwner(){
        selfdestruct(owner);
    }
}