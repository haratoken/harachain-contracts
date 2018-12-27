pragma solidity ^0.4.25;


/**
 * @title Data Factory Interface
 * @dev 
 */
interface IDataFactory {


    // events
    event DataCreationLog(
        address contractDataAddress, address owner, 
        address location, bytes signature, bytes signatureFunc
    );    
   
    function storeData(address _owner, address _location, bytes _signature) external returns (address dataStoreContract);
    function storeData(address _owner, address _location, bytes _signature, bytes _signatureFunc) external returns (address dataStoreContract);
    // function getDataTotalByOwner(address _owner) external view returns (uint256);
}