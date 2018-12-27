pragma solidity ^0.4.25;

import "./Ownable.sol";
import "./interfaces/IDataFactory.sol";
import "./DataStore.sol";

/**
 * @title DataFactory
 * @dev contract that will create data contract.
 */
contract DataFactory is Ownable, IDataFactory {

    // storage    
    address public hartAddress;
    
    /**
    * @dev Constructor keep contract owner.
    */
    constructor(address _hartAddress)
    public {
        hartAddress = _hartAddress;
    }

    /**
    * @dev Function to create data store contract without signature function.
    * @param _owner Data owner.
    * @param _location Location of data.
    * @param _signature Signature of data.
    */
    function storeData(
        address _owner, 
        address _location, 
        bytes _signature
        )
    external
    returns (address dataStoreContract)
    {   
        dataStoreContract = new DataStore(
            _owner, _location,
            _signature, "keccak", hartAddress, address(this));
        emit DataCreationLog(dataStoreContract, _owner, _location, _signature, "keccak");
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
        bytes _signature, 
        bytes _signatureFunc)
    external
    returns (address dataStoreContract) {   
        dataStoreContract = new DataStore(
            _owner, _location,
            _signature, _signatureFunc, hartAddress, address(this));
        emit DataCreationLog(dataStoreContract, _owner, _location, _signature, _signatureFunc);
    }
}