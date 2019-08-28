pragma solidity ^0.5.2;


/**
 * @title Data Provider Interface
 * @dev 
 */
contract IDataProvider {

    function getUri(string calldata _locationId, string calldata _version) external view returns (string memory uri);

}