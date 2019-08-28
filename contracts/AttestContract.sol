pragma solidity 0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";

contract AttestContract is Ownable{
    
    struct Attribute{
        bytes32 value;
        uint expiredTime;
    }
    
    mapping(bytes32=>Attribute) attestation;
    
    event AttestActionLog(bytes32 encryptedBytes, bytes32 version, address itemAddress, bytes32 topic, address attestor, bytes32 value, uint expiredTime);
    event AttestResultLog(bytes32 encryptedBytes, bytes32 prevValue, uint prevExpiredTime, bytes32 newValue, uint newExpiredTime);
    event WhoAttestLog(bytes32 encryptedBytes, bytes32 version, address itemAddress, bytes32 topic, address indexed attestor);
    event AttestLog(bytes32 encryptedBytes, bytes32 indexed version, address indexed itemAddress, bytes32 indexed topic, address attestor, bytes32 value, uint expiredTime);
    event ClaimSet(address indexed issuer, address indexed subject, bytes32 indexed key, bytes32 value, uint updatedAt);
    event ClaimRemoved(address indexed issuer, address indexed subject, bytes32 indexed key, uint removedAt);
    
    constructor() public{
        
    }

    /// @dev Allows anyone to attest an address. The address can be smart contract address.
    /// @param version The version of the data.
    /// @param itemAddress The address that will be attested.
    /// @param topic The topic of attestation.
    /// @param value the value of the attestation.
    /// @param expiredTime When attestation is still valid.
    /// @return Returns transaction receipt.
    function attest(bytes32 version, address itemAddress, bytes32 topic , bytes32 value, uint expiredTime) public {
        bytes32 encryptedBytes = keccak256(abi.encodePacked(version, itemAddress, topic, msg.sender));
        emit AttestResultLog(encryptedBytes, attestation[encryptedBytes].value, attestation[encryptedBytes].expiredTime, value, expiredTime);
        attestation[encryptedBytes].value = value;
        attestation[encryptedBytes].expiredTime = expiredTime;
        emit AttestActionLog(encryptedBytes, version, itemAddress, topic, msg.sender, value, expiredTime);
        emit WhoAttestLog(encryptedBytes, version, itemAddress, topic, msg.sender);
        emit AttestLog(encryptedBytes, version, itemAddress, topic, msg.sender, value, expiredTime);
    }
    
    /// @dev Allows anyone to get expired time of the attestation
    /// @param version The version of the data.
    /// @param itemAddress The address that will be attested.
    /// @param topic The topic of attestation.
    /// @param attestor The issuer of the attestation
    /// @return Returns expired time from the spesific attestation.
    function getExpiredTime(bytes32 version, address itemAddress, bytes32 topic, address attestor) public view returns(uint){
        bytes32 encryptedBytes = keccak256(abi.encodePacked(version, itemAddress, topic, attestor));
        return attestation[encryptedBytes].expiredTime;
    }

    /// @dev Allows anyone to get value of the attestation
    /// @param version The version of the data.
    /// @param itemAddress The address that will be attested.
    /// @param topic The topic of attestation.
    /// @param attestor The issuer of the attestation
    /// @return Returns value from the spesific attestation.
    function getValue(bytes32 version, address itemAddress, bytes32 topic, address attestor) public view returns(bytes32){
        bytes32 encryptedBytes = keccak256(abi.encodePacked(version, itemAddress, topic, attestor));
        return attestation[encryptedBytes].value;
    }
    /*=======EIP-780=======*/
    /// @dev Used by an issuer to set the claim value with the key about the subject.
    /// @param subject The address that will be attested
    /// @param key The topic of attestation
    /// @param value The value of the attestation
    function setClaim(address subject, bytes32 key, bytes32 value) public {
        bytes32 version = 0x0;
        bytes32 encryptedBytes = keccak256(abi.encodePacked(version, subject, key, msg.sender));
        attestation[encryptedBytes].value = value;
        attestation[encryptedBytes].expiredTime = 0;
        emit ClaimSet(msg.sender, subject, key, value, now);
    }

    /// @dev Convenience function for an issuer to set a claim about themself.
    /// @param key The topic of attestation
    /// @param value The value of the attestation
    function setSelfClaim(bytes32 key, bytes32 value) public {
        setClaim(msg.sender, key, value);
    }

    /// @dev Used by anyone to get a specific claim.
    /// @param issuer The version of the data.
    /// @param subject The address that will be attested.
    /// @param key The topic of attestation.
    /// @return Returns value from the spesific attestation.
    function getClaim(address issuer, address subject, bytes32 key) public view returns(bytes32) {
        bytes32 version = 0x0;
        bytes32 encryptedBytes = keccak256(abi.encodePacked(version, subject, key, issuer));
        return attestation[encryptedBytes].value;
    }

    /// @dev Used by an issuer to remove a claim it has made.
    /// @param issuer The version of the data.
    /// @param subject The address that will be attested.
    /// @param key The topic of attestation.
    function removeClaim(address issuer, address subject, bytes32 key) public {
        require(msg.sender == issuer);
        bytes32 version = 0x0;
        bytes32 encryptedBytes = keccak256(abi.encodePacked(version, subject, key, issuer));
        delete attestation[encryptedBytes];
        emit ClaimRemoved(msg.sender, subject, key, now);
    }
}