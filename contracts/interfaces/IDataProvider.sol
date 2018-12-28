pragma solidity 0.4.25;

/**
 * @title Data Provider Interface
 * @dev 
 */
contract IDataProvider {

    function getUri(string _locationId, string _priceId, string _buyer) external view returns (string uri);

}