pragma solidity 0.5.2;

import "./interfaces/IDataProvider.sol";
import "./../open-zeppelin/ownership/Ownable.sol";


/**
 * @title DataProviderAbstract
 * @dev Abstratc Data provider contract.
 */
contract DataProviderAbstract is IDataProvider, Ownable {
    address private proxy;

    // events
    event EndpointChangedLog(string oldEndpoint, string newEndpoint, address indexed by);
    event ProxyChangedLog(address by, address oldProxy, address newProxy);

    // modifier
    /**
    * @dev Modifier to check if function called by owner or proxy.
    */
    modifier onlyOwnerOrProxy() {
        require(msg.sender == owner() || msg.sender == proxy, "Can only accesed by owner or proxy.");
        _;
    }

    /**
    * @dev Function to get Uri item from location Id.
    * @param _newEndpoint Endpoint to be stored on contract.
    */
    function setEndpoint(bytes32 _key, string memory _newEndpoint) public returns (bool);

    /**
    * @dev Function to set data provider contract.
    * @param _newProxyAddress Address of proxy.
    */
    function setProxyAddress(address _newProxyAddress) public onlyOwner {   
        address old = address(proxy);
        proxy = _newProxyAddress;
        emit ProxyChangedLog(msg.sender, old, address(proxy));
    }

}