pragma solidity ^0.5.2;

/**
 * @title Attest
 * @dev 
 */
interface IAttest {

    // events
    event AttestActionLog(bytes32 encryptedBytes, uint64 version, address dataStoreAddress, bytes32 topic, address attestor, bytes32 value, uint expiredTime);
    event AttestResultLog(bytes32 encryptedBytes, bytes32 prevValue, uint prevExpiredTime, bytes32 newValue, uint newExpiredTime);
    event WhoAttestLog(bytes32 encryptedBytes, uint64 version, address dataStoreAddress, bytes32 topic, address indexed attestor);
    event AttestLog(bytes32 encryptedBytes, uint64 indexed version, address indexed dataStoreAddress, bytes32 indexed topic, address attestor);
    
    function attest(uint64 version, address dataStoreAddress, bytes32 topic, bytes32 value, uint expired, address attestor) external;
    function getExpired(uint64 version, address dataStoreAddress, bytes32 topic, address attestor) external view returns(uint);
    function getValue(uint64 version, address dataStoreAddress, bytes32 topic, address attestor) external view returns(bytes32);
    
}
