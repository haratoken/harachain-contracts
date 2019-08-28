pragma solidity 0.5.2;

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
    address public dexAddress;

    mapping(address=>address[]) internal ownerDataAddress;
    mapping(address=>bool) public allowedAddressToStore;
    
    // events
    event DataFactoryAddressChangedLog(address indexed who, address indexed oldAddress, address indexed newAddress);
    event AllowedAddressLog(address indexed who, bool indexed isAllowed, address indexed by);
    // who: 0 => hara, 1=> data provider
    event PercentageChanged(uint8 indexed who, uint8 indexed oldPercentage, uint8 indexed newPercentage);
    event DexAddressChanged(address newAddress);

    /**
    * @dev Modifier to check if function called by hart contract.
    */
    modifier onlyAllowedAddress() {
        require(allowedAddressToStore[msg.sender] == true, "Can only called by allowed address.");
        _;
    }
    
    /**
    * @dev Constructor keep contract owner.
    */
    constructor(IDataFactory _dataFactoryAddress)
    public {
        haraAddress = msg.sender;
        dataFactory = _dataFactoryAddress;
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
    onlyAllowedAddress
    returns (address dataStoreContract)
    {   
        dataStoreContract = dataFactory.storeData2(_owner, _location, _signature, address(this));
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
    onlyAllowedAddress
    returns (address dataStoreContract)
    {  
        dataStoreContract = dataFactory.storeData(_owner, _location, _signature, _signatureFunc, address(this));
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
    * @dev Function to set Dex address to use.
    * @param _dexAddress The address to set.
    */
    function setDexAddress(address _dexAddress) 
    public 
    onlyOwner
    {
        dexAddress = _dexAddress;
        emit DexAddressChanged(dexAddress);
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

    /**
    * @dev Function to add allowed address to store data.
    * @param _address Address to add.
    */
    function addAllowedAddress(address _address) public onlyOwner 
    {
        allowedAddressToStore[_address] = true;
        emit AllowedAddressLog(_address, allowedAddressToStore[_address], msg.sender);
    }

    /**
    * @dev Function to remove add allowed address to store data.
    * @param _address Address to remove.
    */
    function removeAllowedAddress(address _address) public onlyOwner 
    {
        allowedAddressToStore[_address] = false;
        emit AllowedAddressLog(_address, allowedAddressToStore[_address], msg.sender);
    }
}