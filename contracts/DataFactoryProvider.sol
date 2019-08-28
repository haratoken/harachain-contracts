pragma solidity 0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";
import "./DataStore.sol";
import "./DataProviderAbstract.sol";


/**
 * @title DataFactoryProvider
 * @dev contract that will create data contract.
 */
contract DataFactoryProvider is Ownable {
    // storage
    DataStore public dataStore;
    DataProviderAbstract public dataProvider;
    
    // events
    event DataStoreChangedLog(address indexed who, address indexed oldAddress, address indexed newAddress);
    event DataProviderChangedLog(address indexed who, address indexed oldAddress, address indexed newAddress);
    event AllowedAddressLog(address indexed who, bool indexed isAllowed, address indexed by);
    event ProxyLog(bytes32 indexed functionHash, uint8 status);
    event RelationCreatedLog(string indexed fromAddr, string fromVersion, string indexed toAddr, string toVersion);
    event FromRelationLog(string indexed fromAddr, string indexed fromVersion, string toAddr, string toVersion);
    event ToRelationLog(string fromAddr, string fromVersion, string indexed toAddr, string indexed toVersion);
    
    /**
    * @dev Constructor keep contract owner.
    */
    constructor(DataStore _dataStore, DataProviderAbstract _dataProvider)
    public {
        setDataStore(_dataStore);
        setDataProvider(_dataProvider);
    }

    /**
    * @dev Function to set Data Store address to use.
    * @param _dataStore The address to set.
    */
    function setDataStore(DataStore _dataStore) 
    public 
    onlyOwner
    {
        address oldDataStoreAddress = address(dataStore);
        dataStore = DataStore(_dataStore);
        emit DataStoreChangedLog(msg.sender, oldDataStoreAddress, address(_dataStore));
    }

    /**
    * @dev Function to set Data Provider address to use.
    * @param _dataProvider The address to set.
    */
    function setDataProvider(DataProviderAbstract _dataProvider) 
    public 
    onlyOwner
    {
        address oldDataProvider = address(dataProvider);
        dataProvider = _dataProvider;
        emit DataProviderChangedLog(msg.sender, oldDataProvider, address(dataProvider));
    }

    /**
    * @dev Function to store value to data provider.
    * @param _version Version of data.
    * @param _signature Signature of data.
    * @param _fromAddr Address to connect.
    * @param _fromVersion Version of Address to connect.
    * @param _toAddr Address to be connect.
    * @param _toVersion Version of address to be connect.
    */
    function addNewVersion(
        bytes32 _version,
        bytes memory _signature,
        string memory _fromAddr, 
        string memory  _fromVersion,
        string memory _toAddr,
        string memory _toVersion)
    public
    onlyOwner
    {  
        bytes32 _from = keccak256(abi.encodePacked(_fromAddr, _fromVersion));
        string memory _to = string(abi.encodePacked(_toAddr, _toVersion));
        storeSignature(_version, _signature);
        upload(_from,_to);
        emit RelationCreatedLog(_fromAddr, _fromVersion, _toAddr, _toVersion);
        emit FromRelationLog(_fromAddr, _fromVersion, _toAddr, _toVersion);
        emit ToRelationLog(_fromAddr, _fromVersion, _toAddr, _toVersion);
    }
    
    // Data Store Functions    
    /**
    * @dev Function to set signature of new version on data store contract.
    * @param _version Version of Data.
    * @param _signature Signature of data.
    */
    function storeSignature(
        bytes32 _version,
        bytes memory _signature)
    internal
    returns (bool status)
    
    {  
        emit ProxyLog(keccak256("setSignature(bytes32,bytes)"),0);
        dataStore.setSignature(_version, _signature);
        emit ProxyLog(keccak256("setSignature(bytes32,bytes)"),1);
        return true;
    }
    
    // Data Provider Function
    /**
    * @dev Function to store value to data provider.
    * @param _from Bytes32 of Address and Version to connect.
    * @param _to Bytes32 of Address and Version to be connected.
    */
    function upload(
        bytes32 _from, 
        string memory _to)
    internal
    {  
        emit ProxyLog(keccak256("setEndpoint(bytes32,string)"),0);
        require(dataProvider.setEndpoint(_from, _to), "Set Data Provider Failed");
        emit ProxyLog(keccak256("setEndpoint(bytes32,string)"),0);
    }

}