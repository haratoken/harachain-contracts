pragma solidity 0.5.2;

import "./ENS.sol";
import "./../interfaces/IBuyMechanism.sol";
import "./../interfaces/IPriceable.sol";
import "./../../open-zeppelin/ownership/Ownable.sol";
import "./../../open-zeppelin/math/SafeMath.sol";

/**
 * A Registrar to register subdomain on HNS.
 */
contract HaraRegistrar is Ownable, IPriceable {
    using SafeMath for uint256;

    ENS public ens;
    IBuyMechanism hart;
    uint256 price;

    struct Request {
        bytes32 node;
        bytes32 label;
        address owner;
        bool payment;
    }

    mapping (uint256=>Request) requests;
    uint256 requestNonce;

    modifier ownerOnly(bytes32 _node) {
        require(ens.owner(_node) == msg.sender);
        _;
    }

    /**
    * @dev Modifier to check if function called by hara token contract address.
    */
    modifier hartOnly() {
        require(msg.sender == address(hart), "Can only accesed by Hart.");
        _;
    }


    // Events
    event SubnodeRequested(bytes32 indexed node, bytes32 indexed label, address owner, bytes32 indexed requestId);
    event SubnodeRegistered(bytes32 indexed node, bytes32 indexed label, address owner, uint256 price);

    /**
     * Constructor.
     * @param _ensAddr The ENS registrar contract address.
     * @param _hartAddress The Hara Token contract address.
     */
    constructor(ENS _ensAddr, IBuyMechanism _hartAddress) public {
        ens = _ensAddr;
        hart = _hartAddress;
    }

    /**
    * @dev Function to request subnode registration.
    * @param _node Parent node namehash.
    * @param _label Label of subnode.
    * @param _owner Owner adddres of subdnode.
    * @return Boolean of buy status.
    */
    function request(bytes32 _node, bytes32 _label, address _owner) public ownerOnly(_node) {
        requestNonce = requestNonce.add(1);
        requests[requestNonce].node = _node;
        requests[requestNonce].label = _label;
        requests[requestNonce].owner = _owner;
        emit SubnodeRequested(_node, _label, _owner, bytes32(requestNonce));
    }

    /**
    * @dev Function to buy item from transaction receipt. 
           Only hara token contract address can call this function.
    * @param _txReceipt Transaction receipt of buy proccess.
    * @return Boolean of buy status.
    */
    function buy(uint256 _txReceipt) public hartOnly returns (bool) {
        address buyer;
        address seller;
        bytes32 id;
        uint256 value;
        (buyer, seller, id, value) = hart.getReceipt(_txReceipt);
        uint256 _id = uint256(id);
        doSetSubnodeOwner(requests[_id].node, requests[_id].label, requests[_id].owner);
        requests[_id].payment = true;
        emit SubnodeRegistered(requests[_id].node, requests[_id].label, requests[_id].owner, value);
        return true;
    }

    
    /**
    * @dev Function to check if the requestId is really exists
    * @param _id Id of registration request.
    * @return Boolean of requestId existance.
    */
    function isSale(bytes32 _id) external view returns (bool){
        if(requests[uint256(_id)].node[0] != 0x0000000000000000000000000000000000000000000000000000000000000000) {
            return true;
        } else {
            return false;
        }
    }

    /**
    * @dev Function to set price. Only owner of item can call this function.
    * @param _id Not in use.
    * @param _value New value of price.
    */
    function setPrice(bytes32 _id, uint256 _value) external onlyOwner {
        uint256 _oldValue = price;
        price = _value;
        emit PriceChangedLog(address(this), _id, _oldValue, _value);
    }

    /**
    * @dev Function to get price.
    * @param _id Not in use.
    * @return Uint256 of price.
    */
    function getPrice(bytes32 _id) external view  returns (uint256 idPrice) {
        idPrice = price;
    }

    /**
    * @dev Function to check if request id already paid or not.
    * @param _buyer Not in use.
    * @param _id Id of registration request.
    * @return Boolean of buy status.
    */
    function getPurchaseStatus(address _buyer, bytes32 _id) external view returns (bool) {
        return requests[uint256(_id)].payment;
    }

    /**
    * @dev Function to set subnode owner at ens contract.
    * @param _node Parent node namehash.
    * @param _label Label of subnode.
    * @param _owner Owner adddres of subdnode.
    */
    function doSetSubnodeOwner(bytes32 _node, bytes32 _label, address _owner) private {
        ens.setSubnodeOwner(_node, _label, _owner);
    }
}