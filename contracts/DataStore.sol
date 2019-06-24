pragma solidity ^0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";
import "./DataFactoryRegistry.sol";


/**
 * @title DataStore
 * @dev contract that store all data information.
 */

contract DataStore is Ownable {    

    mapping(address=>mapping(bytes32=>bool)) private purchaseStatus;
    bytes private signature;
    bytes private signatureFunc; 
    address private location; 
    mapping(bytes32=>bytes32) public metadata;
    DataFactoryRegistry public dataFactory;
    
    
    // events
    event DataLog(address indexed owner, address location, bytes signature, bytes signatureFunc);
    event DataUpdateLog(string indexed dataType, bool dataValid);
    event MetadataLog(bytes32 indexed keyMetadata, bytes32 valueMetadata);
    // event DexAddressChanged(address newDexAddress, address by);

    //modifiers
    /**
    * @dev Modifier to check metadata length.
    * @param key Key of metadata.
    * @param value Value of metadata.
    */
    modifier checkMetadataLength(bytes32[] memory key, bytes32[] memory value) {
        require(key.length == value.length, "Key length is not same with value length");
        _;
    }

    /**
    * @dev Modifier to check if function called by Dex contract address.
    */
    modifier onlyDex() {
        address dexAddress = dataFactory.dexAddress();
        require(msg.sender == dexAddress, "Can only accesed by Dex.");
        _;
    }

    /**
    * @dev Constructor to intial data information on contract.
    * @param _owner Data owner.
    * @param _location Location of data.
    * @param _signature Signature of data.
    * @param _signatureFunc Signature function of data.
    * @param _dfRegistryAddress Address of DataFactory Registry Contract.
    */
    constructor(
        address _owner, 
        address _location, 
        bytes memory _signature, 
        bytes memory _signatureFunc,
        address _dfRegistryAddress
        )    
    public {
        signature = _signature;
        signatureFunc = _signatureFunc;
        location = _location;
        emit DataLog(_owner, _location, _signature, _signatureFunc);
        dataFactory = DataFactoryRegistry(_dfRegistryAddress);
        transferOwnership(_owner);
    }

    /**
    * @dev Function to get purchase status of buyer for specific item id
    * @param _id Price id item to get purchase status.
    * @param _buyer Buyer to get purchase status
    */
    function getPurchaseStatus(address _buyer, bytes32 _id) external view returns (bool permission) {
        if (_buyer == owner()) {
            permission = true;
        } else {
            permission = purchaseStatus[_buyer][_id];
        }
    }

    /**
    * @dev Function set purchase status of specific data version.
    * @param _id version of data.
    * @param _buyer Buyer of data.
    * @param _status buyr purchase status of data.
    */
    function setPurchaseStatus(
        bytes32 _id, 
        address _buyer,
        bool _status
        ) 
        external
        onlyDex
        {
        purchaseStatus[_buyer][_id] = _status;
    }

    /**
    * @dev Function to add additional information of data. Only owner can call this function.
    * @param _metadataType Type of information, example size, dimension, etc.
    * @param _metadataDetails Value of new information.
    */
    function setMetadata(bytes32 _metadataType, bytes32 _metadataDetails)
    external
    onlyOwner    
    {
        metadata[_metadataType] = _metadataDetails;
        emit MetadataLog(_metadataType, _metadataDetails);
    }

    /**
    * @dev Function to initial metadata. Only owner can call this function. 
           Only item that not valid can use this function.
    * @param _keyMetadata List of keys of metadata.
    * @param _valueMetadata List of value of metadata.
    */
    function setMetadatas(
        bytes32[] memory _keyMetadata, 
        bytes32[] memory _valueMetadata
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
    returns(bytes32) {
        return metadata[_dataType];
    }

    /**
    * @dev Function to get location address of data.
    * @return Address of location contract.
    * 
    */
    function getLocation() 
    external
    view 
    returns(address payable) {
        return address(uint160(address(location)));
    }

    /**
    * @dev Function toget signature function of data.
    * @return Bytes of signature function hash.
    * 
    */
    function getSignatureFunction() 
    external
    view 
    returns(bytes memory) {
        return signatureFunc;
    }

    /**
    * @dev Function to get signature of data.
    * @return Bytes of data signature.
    * 
    */
    function getSignature() 
    external
    view 
    returns(bytes memory) {
        return signature;
    }

    /**
    * @dev Function to get owner of data.
    * @return Address of owner.
    * 
    */
    function getOwner() 
    external
    view 
    returns(address) {
        return owner();
    }

    /**
    * @dev function to destroy contract
    */
    function kill() 
    public
    onlyOwner() {
        selfdestruct(address(uint160(owner())));
    }
}