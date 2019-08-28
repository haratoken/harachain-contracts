pragma solidity 0.5.2;

import './MultiSignature.sol';
import './../ens/HNS.sol';

contract MultiSigHNS is MultiSignature{

    HNSRegistry hns;

    constructor (HNSRegistry _ensAddress) public {
        hns = _ensAddress;
    }

    /// @dev Executes multisig functions.
    /// @param _transactionId Transaction ID.
    /// @param _txType Type of transaction.
    /// @param _data Data to execute.
    /// @return Confirmation status.
    function doExecute(uint _transactionId, uint256 _txType, bytes memory _data) public {
        if (_txType == 3){ // setOwner
            (bytes32 node, address owner) = abi.decode(_data, (bytes32, address));
            hns.setOwner(node, owner);
            emit Execution(_transactionId);
        }
        else if (_txType == 4) { // setSubOwner
            (bytes32 node, bytes32 label, address owner) = abi.decode(_data, (bytes32, bytes32, address));
            hns.setSubnodeOwner(node, label, owner);
            emit Execution(_transactionId);
        }
        else if (_txType == 5) { // setResolver
            (bytes32 node, address resolver) = abi.decode(_data, (bytes32, address));
            hns.setResolver(node, resolver);
            emit Execution(_transactionId);
        }
        else if (_txType == 6) { // setTTL
            (bytes32 node, uint64 ttl) = abi.decode(_data, (bytes32, uint64));
            hns.setTTL(node, ttl);
            emit Execution(_transactionId);
        }
        else if (_txType == 7) { // setRegistrar
            (address registraraddress) = abi.decode(_data, (address));
            hns.setRegistrar(registraraddress);
            emit Execution(_transactionId);
        }
        else {
            Transaction storage txn = transactions[_transactionId];
            txn.executed = false;
            emit ExecutionFailure(_transactionId);
        }
    }

    /// @dev Allows an owner to submit and confirm a hns set owner transaction.
    /// @param node HNS Node.
    /// @param owner Number of wei to withdraw.
    /// @return Returns transaction ID.
    function submitSetOwner(bytes32 node, address owner)
        public
        ownerExists(msg.sender)
        returns (uint transactionId)
    {
        bytes memory data = abi.encode(node, owner);
        transactionId = addTransaction(address(hns), data, 3);
        confirmTransaction(transactionId);
    }
    
    /// @dev Allows an owner to submit and confirm a hns set subnode owner transaction.
    /// @param node HNS parent node.
    /// @param label HNS sha3 label.
    /// @param owner Owner of HNS.
    /// @return Returns transaction ID.
    function submitSetSubnodeOwner(bytes32 node, bytes32 label, address owner)
        public
        ownerExists(msg.sender)
        returns (uint transactionId)
    {
        bytes memory data = abi.encode(node, label, owner);
        transactionId = addTransaction(address(hns), data, 4);
        confirmTransaction(transactionId);
    }

   /// @dev Allows an owner to submit and confirm a hns resolver transaction.
    /// @param node HNS node.
    /// @param resolver Resolver of HNS.
    /// @return Returns transaction ID.
    function submitSetResolver(bytes32 node, address resolver)
        public
        ownerExists(msg.sender)
        returns (uint transactionId)
    {
        bytes memory data = abi.encode(node, resolver);
        transactionId = addTransaction(address(hns), data, 5);
        confirmTransaction(transactionId);
    }

    /// @dev Allows an owner to submit and confirm a hns set ttl transaction.
    /// @param node HNS node.
    /// @param ttl TTL of node.
    /// @return Returns transaction ID.
    function submitSetTTL(bytes32 node, uint64 ttl)
        public
        ownerExists(msg.sender)
        returns (uint transactionId)
    {
        bytes memory data = abi.encode(node, ttl);
        transactionId = addTransaction(address(hns), data, 6);
        confirmTransaction(transactionId);
    }

    /// @dev Allows an owner to submit and confirm a hns set registrar transaction.
    /// @param _registrar Registrar of HNS.
    /// @return Returns transaction ID.
    function submitSetRegistrar(address _registrar)
        public
        ownerExists(msg.sender)
        returns (uint transactionId)
    {
        bytes memory data = abi.encode(_registrar);
        transactionId = addTransaction(address(hns), data, 7);
        confirmTransaction(transactionId);
    }
}