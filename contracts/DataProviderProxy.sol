pragma solidity 0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";
import "./DataProviderAbstract.sol";


/**
 * @title Data ProviderProxy
 * @dev Contract that proxy data provider contract.
 */
contract DataProviderProxy is Ownable {
    // storage
    DataProviderAbstract public dataProvider;

    // events
    event DataProviderChangedLog(address indexed who, address indexed oldAddress, address indexed newAddress);
    event ProxyLog(bytes32 indexed functionHash, uint8 status); // 0 before, 1 after
    
    /**
    * @dev Constructor keep data provider.
    */
    constructor(DataProviderAbstract _dataProvider)
    public {
        setDataProvider(_dataProvider);
    }

    /**
    * @dev Function to set data provider contract.
    * @param _newDataProvider Address of data provider contract.
    */
    function setDataProvider(DataProviderAbstract _newDataProvider) public onlyOwner returns (string memory uri) 
    {   
        address old = address(dataProvider);
        dataProvider = _newDataProvider;
        emit DataProviderChangedLog(msg.sender, old, address(dataProvider));
    }

    /**
    * @dev Function to set endpoint of data provider.
    * @param _key .
    * @param _newEndpoint New Endpoint for Data Provider.
    */
    function setEndpoint(bytes32 _key, string memory _newEndpoint)
    public
    onlyOwner
    returns (bool)
    {   
        emit ProxyLog(keccak256("SetEndpoint(address"), 0);
        dataProvider.setEndpoint(_key, _newEndpoint);
        emit ProxyLog(keccak256("SetEndpoint(address"), 1);
        return true;
    }

    /**
    * @dev Function to get Uri address of data location.
    * @param _locationId Location Id of item.
    * @param _version Version of item.
    */
    function getUri(string calldata _locationId, string calldata _version)  external view returns (string memory uri) 
    {
        uri = dataProvider.getUri(_locationId, _version);
    }
}