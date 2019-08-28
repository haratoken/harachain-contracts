pragma solidity 0.5.2;

import "./DataProviderAbstract.sol";

/**
 * @title DataProviderRelation
 * @dev Data provider contract with value.
 */
contract DataProviderRelation is DataProviderAbstract {

    mapping(bytes32=>string) internal endpoints;
    // events
    event EndpointChangedLog(string oldEndpoint, string newEndpoint, address indexed by);

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
    returns (string memory uri) {
        bytes32 key = keccak256(abi.encodePacked(_locationId, _version));
        uri = endpoints[key];
    }

     /**
    * @dev Function to get Uri item from location Id.
    * @param _from Object as key.
    * @param _to Endpoint to be stored on contract.
    */
    function setEndpoint(bytes32 _from, string memory _to) public onlyOwnerOrProxy returns (bool) {
        string memory _oldEndpoint = endpoints[_from];
        endpoints[_from] = _to;
        emit EndpointChangedLog(_oldEndpoint, endpoints[_from], msg.sender);
        return true;
    }
}