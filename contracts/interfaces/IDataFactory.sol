pragma solidity ^0.5.2;


/**
 * @title Data Factory Interface
 * @dev 
 */
interface IDataFactory {


    // events
    event DataCreationLog(
        address indexed contractDataAddress, address indexed owner, 
        address location, bytes signature, bytes signatureFunc
    );    
   
    function storeData2(address _owner, address _location, bytes calldata _signature) external 
    returns (address dataStoreContract);
    
    function storeData(address _owner, address _location, bytes calldata _signature, bytes calldata _signatureFunc) external 
    returns (address dataStoreContract);
}