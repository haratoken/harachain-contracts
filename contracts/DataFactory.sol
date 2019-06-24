pragma solidity ^0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";
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
    * @param _dataFactoryR Address of DataFactoryRegistry.
    */
    function storeData2(
        address _owner, 
        address _location, 
        bytes memory _signature,
        address _dataFactoryR
        )
    public
    returns (address dataStoreContractAddress)
    {   
        DataStore dataStoreContract = new DataStore(
            _owner, _location,
            _signature, "keccak", _dataFactoryR);
        dataStoreContractAddress = address(dataStoreContract);
        emit DataCreationLog(dataStoreContractAddress, _owner, _location, _signature, "keccak");
    }
    
    /**
    * @dev Function to create data store contract with signature function.
    * @param _owner Data owner.
    * @param _location Location of data.
    * @param _signature Signature of data.
    * @param _signatureFunc Signature function of data.
    * @param _dataFactoryR Address of DataFactoryRegistry.
    */
    function storeData(
        address _owner, 
        address _location,
        bytes memory _signature, 
        bytes memory _signatureFunc,
        address _dataFactoryR)
    public
    returns (address dataStoreContractAddress) {   
        DataStore dataStoreContract = new DataStore(
            _owner, _location,
            _signature, _signatureFunc, _dataFactoryR);
        dataStoreContractAddress = address(dataStoreContract);
        emit DataCreationLog(dataStoreContractAddress, _owner, _location, _signature, _signatureFunc);
    }
}