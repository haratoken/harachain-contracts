pragma solidity 0.4.25;
// pragma experimental ABIEncoderV2;

import "./../open-zeppelin/ownership/Ownable.sol";
import "./../open-zeppelin/math/SafeMath.sol";
import "./interfaces/IPriceable.sol";

contract Order is Ownable {
    using SafeMath for uint256;

    // struct
    struct OrderDetail {
        address sellerAddress;
        bytes32 id;
      }
    // storage
    // buyable hart
    mapping(address=>mapping(uint256=>OrderDetail[])) internal orderTransaction;
    mapping(address=>uint256) public isActive; 
    uint256 public orderId;
    mapping(uint256=>mapping(address=>mapping(bytes32=>bool))) public addedSellerOrder;
    mapping(bytes32=>bool) public sellerAddressBloom;
    
    //event
    event OrderCreated(address buyer, uint256 orderId);
    event OrderAdded(uint256 orderId, address sellerAddress, bytes32 version);
    event OrderAlreadyExists(uint256 orderId, address sellerAddress, bytes32 version);
    event OrderCancelled(uint256 orderId, address by);
    
    //modifier
    modifier notActiveOrder() {
        require(isActive[msg.sender] == 0, "Address still have active Order");
        _;
    }

    modifier onlyOrderOwner(uint256 _orderId) {
        require(isActive[msg.sender] == _orderId, "Only order owner can modify order");
        _;
    }
    
    /**
    * @dev Modifier to check order details length.
    * @param _sellers Sellers of data to order.
    * @param _versions Version of data to order.
    */
    modifier checkOrderDetailsLength(address[] _sellers, bytes32[] _versions) {
        require(_sellers.length == _versions.length, "Sellers length is not same with versions length");
        _;
    }

    //constructor
    constructor()
    public {
        
    }
    
    function createOrder() public notActiveOrder {
        orderId = orderId.add(1);
        orderTransaction[msg.sender][orderId];
        isActive[msg.sender] = orderId;
        emit OrderCreated(msg.sender, orderId);
    }
    
    function createOrder(address[] _sellers, bytes32[] _versions) public notActiveOrder checkOrderDetailsLength(_sellers, _versions) {
        createOrder();
        for (uint i = 0; i < _sellers.length; i++) {
            _addOrder(msg.sender, orderId, _sellers[i], _versions[i]);
        }
    }
    
    function addOrder(uint256 _orderId, address[] _sellers, bytes32[] _versions) public onlyOrderOwner(_orderId) checkOrderDetailsLength(_sellers, _versions){
        for (uint i = 0; i < _sellers.length; i++) {
            _addOrder(msg.sender, _orderId, _sellers[i], _versions[i]);
        }
    }    
    // function getOrderList(address _buyer, uint256 _orderId) public view returns (address[] list) {
        // sini
        // list = orderTransaction[_buyer][_orderId];
        // list = [msg.sender];
    // }

    function cancelOrder(uint256 _orderId) public onlyOrderOwner(_orderId) {
        isActive[msg.sender] = 0;
        emit OrderCancelled(_orderId, msg.sender);
    }
    
    function _addOrder(address _buyer, uint256 _orderId, address _seller, bytes32 _version) private {
        // sini
        if (addedSellerOrder[_orderId][_seller][_version] == false) {
            OrderDetail memory detail = OrderDetail(_seller, _version);
            orderTransaction[_buyer][_orderId].push(detail);
            addedSellerOrder[_orderId][_seller][_version] = true;
            sellerAddressBloom[keccak256(abi.encodePacked(_orderId, _seller, _version))] = true;
            emit OrderAdded(_orderId, _seller, _version);
        } else {
            emit OrderAlreadyExists(_orderId, _seller, _version);
        }
    }

    function getTotalInvoce(uint256 _orderId) public view returns (uint256 total) {
        for (uint _id = 0; _id < orderTransaction[msg.sender][_orderId].length; _id++) {
            IPriceable data = IPriceable(orderTransaction[msg.sender][_orderId][_id].sellerAddress);
            total.add(data.getPrice(orderTransaction[msg.sender][_orderId][_id].id));
        }
    }
    
    function buy(uint256 _orderId) public {
        for (uint _id = 0; _id < orderTransaction[msg.sender][_orderId].length; _id++) {
            // IPriceable data = IPriceable(orderTransaction[msg.sender][_orderId][_id].sellerAddress);
            // total.add(data.getPrice(orderTransaction[msg.sender][_orderId][_id].id));
            // beli data
            // set yg ini udah kebeli
            // emit
        }
    }
    //buy function
    // function buy
    // function get total invoice
}