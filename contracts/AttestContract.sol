pragma solidity 0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";

contract AttestContract is Ownable{
    
    struct Attribute{
        bytes32 value;
        uint expiredTime;
    }
    
    mapping(bytes32=>Attribute) attestation;
    
    event AttestActionLog(bytes32 encryptedBytes, bytes32 version, address itemAddress, bytes32 topic, address proxyAddress, bytes32 value, uint expiredTime);
    event AttestResultLog(bytes32 encryptedBytes, bytes32 prevValue, uint prevExpiredTime, bytes32 newValue, uint newExpiredTime);
    event WhoAttestLog(bytes32 encryptedBytes, bytes32 version, address itemAddress, bytes32 topic, address indexed proxyAddress);
    event AttestLog(bytes32 encryptedBytes, bytes32 indexed version, address indexed itemAddress, bytes32 indexed topic, address proxyAddress);

    constructor() public{
        
    }

    /// @dev Allows anyone to attest an address. The address can be smart contract address.
    /// @param version The version of the data.
    /// @param itemAddress The address that will be attested.
    /// @param topic The topic of attestation.
    /// @param value the value of the attestation.
    /// @param expiredTime When attestation is still valid.
    /// @param proxyAddress msg.sender claims to be this proxy address
    /// @return Returns transaction receipt.
    function attest(bytes32 version, address itemAddress, bytes32 topic , address proxyAddress, bytes32 value, uint expiredTime) public {
        bytes32 encryptedBytes = keccak256(abi.encodePacked(version, itemAddress, topic, proxyAddress));
        emit AttestResultLog(encryptedBytes, attestation[encryptedBytes].value, attestation[encryptedBytes].expiredTime, value, expiredTime);
        attestation[encryptedBytes].value = value;
        attestation[encryptedBytes].expiredTime = expiredTime;
        emit AttestActionLog(encryptedBytes, version, itemAddress, topic, proxyAddress, value, expiredTime);
        emit WhoAttestLog(encryptedBytes, version, itemAddress, topic, proxyAddress);
        emit AttestLog(encryptedBytes, version, itemAddress, topic, proxyAddress);
    }
    
    /// @dev Allows anyone to get expired time of the attestation
    /// @param version The version of the data.
    /// @param itemAddress The address that will be attested.
    /// @param topic The topic of attestation.
    /// @param proxyAddress The address of the proxyAddress.
    /// @return Returns expired time from the spesific attestation.
    function getExpiredTime(bytes32 version, address itemAddress, bytes32 topic, address proxyAddress) public view returns(uint){
        bytes32 encryptedBytes = keccak256(abi.encodePacked(version, itemAddress, topic, proxyAddress));
        return attestation[encryptedBytes].expiredTime;
    }

    /// @dev Allows anyone to get value of the attestation
    /// @param version The version of the data.
    /// @param itemAddress The address that will be attested.
    /// @param topic The topic of attestation.
    /// @param proxyAddress The address of the proxyAddress.
    /// @return Returns expired time from the spesific attestation.
    function getValue(bytes32 version, address itemAddress, bytes32 topic, address proxyAddress) public view returns(bytes32){
        bytes32 encryptedBytes = keccak256(abi.encodePacked(version, itemAddress, topic, proxyAddress));
        return attestation[encryptedBytes].value;
    }
}
