pragma solidity 0.5.2;

import "./ENS.sol";


/**
 * Hara Name Service contract.
 * Name service registry based on Ethereum Name Service (ENS).
 */
contract HNSRegistry is ENS {

    struct Record {
        address owner;
        uint64 ttl;
    }

    mapping (bytes32 => Record) records;
    address public activeRegistrar;
    address public activeResolver;

    // Permits modifications only by the owner of the specified node
    modifier ownerOnly(bytes32 _node) {
        require(records[_node].owner == msg.sender, "Can only be accesed by owner");
        _;
    }

    // Permits modifications only by the owner of the specified node if active registrar not specified.
    // only active registrar address if active registar specified.
    modifier registrarOnly() {
        require(activeRegistrar == msg.sender, "Can only be accesed by registar");
        _;
    }

    event RegistrarChanged(address oldRegistrar, address newRegistrar);

    /**
     * @dev Constructs msg.sender as the owner of root.
     */
    constructor() public {
        records[0x0].owner = msg.sender;
    }

    /**
     * @dev Set active registrar. May only be called by the current owner of the root node.
     * @param _address Address of registrar.
     */
    function setRegistrar(address _address) external ownerOnly(0x0) {
        address _oldAddress = activeRegistrar;
        activeRegistrar = _address;
        emit RegistrarChanged(_oldAddress, _address);
    }

     /**
     * @dev Transfers ownership of a node to a new address. May only be called by the current owner of the node.
     * @param _node The node to transfer ownership of.
     * @param _owner The address of the new owner.
     */
    function setOwner(bytes32 _node, address _owner) external ownerOnly(_node) {
        emit Transfer(_node, _owner);
        records[_node].owner = _owner;
    }

    /**
     * @dev Transfers ownership of a subnode keccak256(node, label) to a new address. May only be called by the owner of the parent node.
     * @param _node The parent node.
     * @param _label The hash of the label specifying the subnode.
     * @param _owner The address of the new owner.
     */
    function setSubnodeOwner(bytes32 _node, bytes32 _label, address _owner) external registrarOnly() {
        bytes32 subnode = keccak256(abi.encodePacked(_node, _label));
        emit NewOwner(_node, _label, _owner);
        records[subnode].owner = _owner;
    }

    /**
     * @dev Sets the resolver address for the specified node.
     * @param _node The node to update. Not in use.
     * @param _resolver The address of the resolver.
     */
    function setResolver(bytes32 _node, address _resolver) external ownerOnly(0x0) {
        emit NewResolver("", _resolver);   
        activeResolver = _resolver;
    }

    /**
     * @dev Sets the TTL for the specified node.
     * @param _node The node to update.
     * @param _ttl The TTL in seconds.
     */
    function setTTL(bytes32 _node, uint64 _ttl) external ownerOnly(_node) {
        emit NewTTL(_node, _ttl);
        records[_node].ttl = _ttl;
    }

    /**
     * @dev Returns the address that owns the specified node.
     * @param _node The specified node.
     * @return address of the owner.
     */
    function owner(bytes32 _node) external view returns (address) {
        return records[_node].owner;
    }

    /**
     * @dev Returns the address of the resolver for the specified node.
     * @param _node The specified node. Not in use.
     * @return address of the resolver.
     */
    function resolver(bytes32 _node) external view returns (address) {
        return activeResolver;
    }

    /**
     * @dev Returns the TTL of a node, and any records associated with it.
     * @param _node The specified node.
     * @return ttl of the node.
     */
    function ttl(bytes32 _node) external view returns (uint64) {
        return records[_node].ttl;
    }

}