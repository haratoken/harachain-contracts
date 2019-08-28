pragma solidity 0.5.2;

import "./interfaces/IDataProvider.sol";
import "./../open-zeppelin/ownership/Ownable.sol";


/**
 * @title DataProviderNull
 * @dev Data provider contract that provide null endpoint.
 */
contract DataProviderNull is IDataProvider, Ownable {
    string internal endpoint;

    /**
    * @dev Function to get Uri item from location Id.
    * @param _locationId Location Id of item. Not in used.
    * @param _version Price Id as a version of item. Not in used.
    */
    function getUri(string memory _locationId, string memory _version) public view 
    returns (string memory uri) {
        return endpoint;
    }
}