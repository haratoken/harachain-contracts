pragma solidity 0.5.2;

import "./ENS.sol";

/**
 * A simple resolver anyone can use; only allows the owner of a node to set its
 * address.
 * Source: https://etherscan.io/address/0x1da022710df5002339274aadee8d58218e9d6ab5#code
 * Modified: Upgrade Solidity compiler version to 0.5.2
 */
contract HaraResolver {
    bytes4 constant INTERFACE_META_ID = 0x01ffc9a7;
    bytes4 constant ADDR_INTERFACE_ID = 0x3b3b57de;
    bytes4 constant CONTENT_INTERFACE_ID = 0x2dff6941;
    bytes4 constant NAME_INTERFACE_ID = 0x691f3431;
    bytes4 constant ABI_INTERFACE_ID = 0x2203ab56;
    bytes4 constant PUBKEY_INTERFACE_ID = 0xc8690233;
    bytes4 constant TEXT_INTERFACE_ID = 0x59d1d43c;

    event AddrChanged(bytes32 indexed node, address a);
    event ContentChanged(bytes32 indexed node, bytes32 hash);
    event NameChanged(bytes32 indexed node, string name);
    event ABIChanged(bytes32 indexed node, uint256 indexed contentType);
    event PubkeyChanged(bytes32 indexed node, bytes32 x, bytes32 y);
    event TextChanged(bytes32 indexed node, string indexed indexedKey, string key);

    struct PublicKey {
        bytes32 x;
        bytes32 y;
    }

    struct Record {
        address addr;
        bytes32 content;
        string name;
        PublicKey pubkey;
        mapping(string=>string) text;
        mapping(uint256=>bytes) abis;
    }

    ENS ens;
    mapping(bytes32=>Record) records;

    modifier ownerOnly(bytes32 _node) {
        require(ens.owner(_node) == msg.sender);
        _;
    }

    /**
     * Constructor.
     * @param _ensAddr The ENS registrar contract.
     */
    constructor(ENS _ensAddr) public {
        ens = _ensAddr;
    }

    /**
     * Returns true if the resolver implements the interface specified by the provided hash.
     * @param _interfaceID The ID of the interface to check for.
     * @return True if the contract implements the requested interface.
     */
    function supportsInterface(bytes4 _interfaceID) public pure returns (bool) {
        return _interfaceID == ADDR_INTERFACE_ID ||
               _interfaceID == CONTENT_INTERFACE_ID ||
               _interfaceID == NAME_INTERFACE_ID ||
               _interfaceID == ABI_INTERFACE_ID ||
               _interfaceID == PUBKEY_INTERFACE_ID ||
               _interfaceID == TEXT_INTERFACE_ID ||
               _interfaceID == INTERFACE_META_ID;
    }

    /**
     * Returns the address associated with an ENS node.
     * @param _node The ENS node to query.
     * @return The associated address.
     */
    function addr(bytes32 _node) public view returns (address ret) {
        ret = records[_node].addr;
    }

    /**
     * Sets the address associated with an ENS node.
     * May only be called by the owner of that node in the ENS registry.
     * @param _node The node to update.
     * @param _addr The address to set.
     */
    function setAddr(bytes32 _node, address _addr) public ownerOnly(_node) {
        records[_node].addr = _addr;
        emit AddrChanged(_node, _addr);
    }

    /**
     * Returns the content hash associated with an ENS node.
     * Note that this resource type is not standardized, and will likely change
     * in future to a resource type based on multihash.
     * @param _node The ENS node to query.
     * @return The associated content hash.
     */
    function content(bytes32 _node) public view returns (bytes32 ret) {
        ret = records[_node].content;
    }

    /**
     * Sets the content hash associated with an ENS node.
     * May only be called by the owner of that node in the ENS registry.
     * Note that this resource type is not standardized, and will likely change
     * in future to a resource type based on multihash.
     * @param _node The node to update.
     * @param _hash The content hash to set
     */
    function setContent(bytes32 _node, bytes32 _hash) public ownerOnly(_node) {
        records[_node].content = _hash;
        emit ContentChanged(_node, _hash);
    }

    /**
     * Returns the name associated with an ENS node, for reverse records.
     * Defined in EIP181.
     * @param _node The ENS node to query.
     * @return The associated name.
     */
    function name(bytes32 _node) public view returns (string memory ret) {
        ret = records[_node].name;
    }

    /**
     * Sets the name associated with an ENS node, for reverse records.
     * May only be called by the owner of that node in the ENS registry.
     * @param _node The node to update.
     * @param _name The name to set.
     */
    function setName(bytes32 _node, string memory _name) public ownerOnly(_node) {
        records[_node].name = _name;
        emit NameChanged(_node, _name);
    }

    /**
     * Returns the ABI associated with an ENS node.
     * Defined in EIP205.
     * @param _node The ENS node to query
     * @param _contentTypes A bitwise OR of the ABI formats accepted by the caller.
     * @return If no data of the appropriate content type ID was found, 0 is returned for the content type ID, and the ABI data will be the empty string.
     * @return contentType The content type of the return value. 
     * @return data The ABI data
     */
    function ABI(bytes32 _node, uint256 _contentTypes) public view returns (uint256 contentType, bytes memory data) {
        Record storage record = records[_node];
        for(contentType = 1; contentType <= _contentTypes; contentType <<= 1) {
            if ((contentType & _contentTypes) != 0 && record.abis[contentType].length > 0) {
                data = record.abis[contentType];
                // return;
                // contentType = _contentTypes;
                break;
            }
        }
        contentType = 0;
    }

    /**
     * Sets the ABI associated with an ENS node.
     * Nodes may have one ABI of each content type. To remove an ABI, set it to
     * the empty string.
     * @param _node The node to update.
     * @param _contentType The content type of the ABI. https://docs.ens.domains/contract-api-reference/publicresolver#get-contract-abi
     * @param _data The ABI data.
     */
    function setABI(bytes32 _node, uint256 _contentType, bytes memory _data) public ownerOnly(_node) {
        // Content types must be powers of 2
        require(((_contentType - 1) & _contentType) == 0);

        records[_node].abis[_contentType] = _data;
        emit ABIChanged(_node, _contentType);
    }

    /**
     * Returns the SECP256k1 public key associated with an ENS node.
     * Defined in EIP 619.
     * @param _node The ENS node to query
     * @return x, y the X and Y coordinates of the curve point for the public key.
     */
    function pubkey(bytes32 _node) public view returns (bytes32 x, bytes32 y) {
        return (records[_node].pubkey.x, records[_node].pubkey.y);
    }

    /**
     * Sets the SECP256k1 public key associated with an ENS node.
     * @param _node The ENS node to query
     * @param _x the X coordinate of the curve point for the public key.
     * @param _y the Y coordinate of the curve point for the public key.
     */
    function setPubkey(bytes32 _node, bytes32 _x, bytes32 _y) public ownerOnly(_node) {
        records[_node].pubkey = PublicKey(_x, _y);
        emit PubkeyChanged(_node, _x, _y);
    }

    /**
     * Returns the text data associated with an ENS node and key.
     * @param _node The ENS node to query.
     * @param _key The text data key to query.
     * @return The associated text data.
     */
    function text(bytes32 _node, string memory _key) public view returns (string memory ret) {
        ret = records[_node].text[_key];
    }

    /**
     * Sets the text data associated with an ENS node and key.
     * May only be called by the owner of that node in the ENS registry.
     * @param _node The node to update.
     * @param _key The key to set.
     * @param _value The text data value to set.
     */
    function setText(bytes32 _node, string memory _key, string memory _value) public ownerOnly(_node) {
        records[_node].text[_key] = _value;
        emit TextChanged(_node, _key, _key);
    }
}