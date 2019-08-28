pragma solidity 0.5.2;

import "./DataProviderAbstract.sol";

/**
 * @title DataProviderHara
 * @dev Data provider contract by hara.
 */
contract DataProviderHara is DataProviderAbstract {
    string internal endpoint;
        
    // events
    event EndpointChangedLog(string oldEndpoint, string newEndpoint, address indexed by);

    // modifier
    /**
    * @dev Modifier to check if endpoint is exists.
    */
    modifier endpointExists() {
        require(bytes(endpoint).length > 0, "Endpoint is not exists");
        _;
    }

    /**
    * @dev Constructor.
    */
    constructor() public {
    }

    /**
    * @dev Function to get Uri item from location Id.
    * @param _locationId Location Id of item.
    * @param _version Version of item.
    */
    function getUri(string memory _locationId, string memory _version) public view 
    endpointExists returns (string memory uri) {
        return string(abi.encodePacked(endpoint, "?id=", _locationId, "&&version=", _version));
    }

    /**
    * @dev Function to get Uri item from location Id.
    * @param _key Not in use.
    * @param _newEndpoint Endpoint to be stored on contract.
    */
    function setEndpoint(bytes32 _key, string memory _newEndpoint) public onlyOwnerOrProxy returns (bool) {
        string memory _oldEndpoint = endpoint;
        endpoint = _newEndpoint;
        emit EndpointChangedLog(_oldEndpoint, endpoint, msg.sender);
        return true;
    }
}