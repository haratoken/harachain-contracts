pragma solidity ^0.5.2;


/**
 * @title Data Provider Interface
 * @dev 
 */
contract IDataProvider {

    function getUri(string calldata _locationId, string calldata _priceId, string calldata _buyer) external view returns (string memory uri);

}