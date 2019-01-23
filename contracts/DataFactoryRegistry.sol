pragma solidity ^0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";
import "./interfaces/IDataFactory.sol";


/**
 * @title DataFactoryRegistry
 * @dev contract that will create data contract.
 */
contract DataFactoryRegistry is Ownable {
    // storage
    IDataFactory public dataFactory;
    
    uint8 public haraPercentage;
    uint8 public dataProviderPercentage;

    address public haraAddress;

    mapping(address=>address[]) internal ownerDataAddress;
    
    // events
    event DataFactoryAddressChangedLog(address indexed who, address indexed oldAddress, address indexed newAddress);
    // who: 0 => hara, 1=> data provider
    event PercentageChanged(uint8 indexed who, uint8 indexed oldPercentage, uint8 indexed newPercentage);

    /**
    * @dev Constructor keep contract owner.
    */
    constructor(address _dataFactoryAddress)
    public {
        haraAddress = msg.sender;
        dataFactory = IDataFactory(_dataFactoryAddress);
        haraPercentage = 15;
        emit PercentageChanged(0, 0, haraPercentage);
        dataProviderPercentage = 5;
        emit PercentageChanged(1, 0, dataProviderPercentage);
    }

    /**
    * @dev Function to set percentage that hara and data provider will get.
    * @param _who Type who will the percentage  changed.
    * @param _percentageRatio New percentage ratio to changed.
    */
    function setPercentage(uint256 _who, uint8 _percentageRatio)
    public
    onlyOwner
    {   
        uint8 oldPercentage;
        if (_who == 0) {     
            oldPercentage = haraPercentage;       
            haraPercentage = _percentageRatio;
            emit PercentageChanged(0, oldPercentage, haraPercentage);        
        } else if (_who == 1) {
            oldPercentage = dataProviderPercentage;
            dataProviderPercentage = _percentageRatio;
            emit PercentageChanged(1, oldPercentage, dataProviderPercentage);
        } else {
            revert("Percentage type is not exists. Use 0 for hara percentage or 1 for data provider percentage");
        }
    }

    /**
    * @dev Function to get percentage..
    * @param _who Type who will the percentage  changed.
    */
    function getPercentage(uint256 _who)
    public
    view
    returns (uint8 percentage)
    {   
        if (_who == 0) {     
            percentage = haraPercentage;         
        } else if (_who == 1) {
            percentage = dataProviderPercentage;
        } else {
            revert("Percentage type is not exists. Use 0 for hara percentage or 1 for data provider percentage");
        }
    }

    /**
    * @dev Function to create data store contract without signature function.
    * @param _owner Data owner.
    * @param _location Location of data.
    * @param _signature Signature of data.
    */
    function storeData2(
        address _owner, 
        address _location, 
        bytes memory _signature
        )
    public
    returns (address dataStoreContract)
    {   
        dataStoreContract = dataFactory.storeData2(_owner, _location, _signature);
        ownerDataAddress[_owner].push(dataStoreContract);
    }
    
    /**
    * @dev Function to create data store contract with signature function.
    * @param _owner Data owner.
    * @param _location Location of data.
    * @param _signature Signature of data.
    * @param _signatureFunc Signature function of data.
    */
    function storeData(
        address _owner, 
        address _location,
        bytes memory _signature, 
        bytes memory _signatureFunc)
    public
    returns (address dataStoreContract)
    {  
        dataStoreContract = dataFactory.storeData(_owner, _location, _signature, _signatureFunc);
        ownerDataAddress[_owner].push(dataStoreContract);

    }

    /**
    * @dev Function to set Data Factory address to use.
    * @param _dataFactoryAddress The address to set.
    */
    function setDataFactoryAddress(address _dataFactoryAddress) 
    public 
    onlyOwner
    {
        address oldDataFactoryAddress = address(dataFactory);
        dataFactory = IDataFactory(_dataFactoryAddress);
        emit DataFactoryAddressChangedLog(msg.sender, oldDataFactoryAddress, _dataFactoryAddress);
    }

    /**
    * @dev Function to get the total data of specific data owner address.
    * @param _owner The address to query the the getDataTotalByOwner.
    * @return Uint256 representing the amount owned by the passed address.
    */
    function getDataTotalByOwner(address _owner)
    public
    view
    returns (uint256)
    {
        return ownerDataAddress[_owner].length;
    }

    /**
    * @dev Function to get the total data of specific data owner address.
    * @param _owner The address to query the the getDataTotalByOwner.
    * @return Uint256 representing the amount owned by the passed address.
    */
    function getDataAddressByOwner(address _owner, uint256 _index)
    public
    view
    returns (address)
    {
        return ownerDataAddress[_owner][_index];
    }
}