pragma solidity ^0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";
import "./../open-zeppelin/math/SafeMath.sol";
import "./interfaces/IPriceable.sol";
import "./interfaces/IBuyMechanism.sol";

contract Order is Ownable {
    using SafeMath for uint256;

    // struct
    struct OrderDetail {
        address sellerAddress;
        bytes32 id;
    }
    // storage
    // buyable hart
    mapping(address=>mapping(uint256=>OrderDetail[])) public orderTransaction;
    mapping(address=>uint256) public isActive; 
    uint256 public orderId;
    mapping(uint256=>mapping(address=>mapping(bytes32=>bool))) public addedSellerOrder;
    mapping(bytes32=>bool) public sellerAddressBloom;
    IBuyMechanism buyMechanism;

    //event
    event OrderCreated(address indexed buyer, uint256 indexed orderId, bytes32 paymentId);
    event OrderAdded(uint256 indexed orderId, address indexed sellerAddress, bytes32 version);
    event OrderAlreadyExists(uint256 indexed orderId, address indexed sellerAddress, bytes32 version);
    event OrderCancelled(uint256 indexed orderId, address by);
    
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
    modifier checkOrderDetailsLength(address[] memory _sellers, bytes32[] memory _versions) {
        require(_sellers.length == _versions.length, "Sellers length is not same with versions length");
        _;
    }

    //constructor
    constructor(address _hartAddress)
    public {
        buyMechanism = IBuyMechanism(_hartAddress);
    }
    
    function createOrder() public notActiveOrder {
        orderId = orderId.add(1);
        orderTransaction[msg.sender][orderId];
        isActive[msg.sender] = orderId;
        emit OrderCreated(msg.sender, orderId, bytes32(orderId));
    }
    
    function createandAddOrder(address[] memory _sellers, bytes32[] memory _versions) public notActiveOrder checkOrderDetailsLength(_sellers, _versions) {
        createOrder();
        for (uint i = 0; i < _sellers.length; i++) {
            _addOrder(msg.sender, orderId, _sellers[i], _versions[i]);
        }
    }
    
    function addOrder(uint256 _orderId, address[] memory _sellers, bytes32[] memory _versions) public onlyOrderOwner(_orderId) checkOrderDetailsLength(_sellers, _versions){
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
            orderTransaction[_buyer][_orderId].length = orderTransaction[_buyer][_orderId].length.add(1);
            addedSellerOrder[_orderId][_seller][_version] = true;
            sellerAddressBloom[keccak256(abi.encodePacked(_orderId, _seller, _version))] = true;
            emit OrderAdded(_orderId, _seller, _version);
        } else {
            emit OrderAlreadyExists(_orderId, _seller, _version);
        }
    }

    function getTotalInvoice(uint256 _orderId) public view returns (uint total) {
        // for (uint _id = 0; _id < orderTransaction[msg.sender][_orderId].length; _id++) {
        // address dataAddress = orderTransaction[msg.sender][_orderId][0].sellerAddress;
        //     // IPriceable data = IPriceable(orderTransaction[msg.sender][_orderId][_id].sellerAddress);
        //     // total = total.add(data.getPrice(orderTransaction[msg.sender][_orderId][_id].id));
            // total = total.add(1);
        // a = dataAddress;
        // }
        // OrderDetail memory z = orderTransaction[msg.sender][_orderId][0];
        total = orderTransaction[msg.sender][_orderId].length;
        // total = 12;
        // total = orderTransaction[msg.sender][_orderId].length;
        // total = addedSellerOrder[_orderId].length;
        // total = orderTransaction[msg.sender][_orderId][0];
        // total = z.sellerAddress;
    }
    
    // function buy(uint256 _orderId) public {
    //     for (uint _id = 0; _id < orderTransaction[msg.sender][_orderId].length; _id++) {
    //         // IPriceable data = IPriceable(orderTransaction[msg.sender][_orderId][_id].sellerAddress);
    //         // total.add(data.getPrice(orderTransaction[msg.sender][_orderId][_id].id));
    //         // beli data
    //         // set yg ini udah kebeli
    //         // emit
    //     }
    // }
    //buy function
    // function buy
    // function get total invoice

    function buy(uint256 _txReceipt) external returns (bool) {
        address buyer;
        address seller;
        bytes32 id;
        uint256 value;
        (buyer, seller, id, value) = buyMechanism.getReceipt(_txReceipt);
        uint256 _id = uint256(id);


        // for (uint _id = 0; _id < orderTransaction[msg.sender][_orderId].length; _id++) {
            // IPriceable data = IPriceable(orderTransaction[msg.sender][_orderId][_id].sellerAddress);
            // total.add(data.getPrice(orderTransaction[msg.sender][_orderId][_id].id));
            // beli data
            // set yg ini udah kebeli
            // emit
        // }
        // purchaseStatus[buyer][id] = true;
        // emit BoughtLog(buyer, seller, id, value);

        // uint256 forHara = getPercentage(value, dataFactory.getPercentage(0));
        // uint256 forDataProvider = getPercentage(value, dataFactory.getPercentage(1));
        // require(hart.transfer(location, forDataProvider), "Payment to Data Provider failed");
        // require(hart.transfer(dataFactory.haraAddress(), forHara), "Payment to Hara failed");
        return true;
    }

    function getPrice(bytes32 _id) external view  returns (uint256 _idPrice) {
        // _idPrice = getTotalInvoice(uint256(_id));
        _idPrice = 12;
    }

    function isSale(bytes32 _id) external view returns (bool _saleStatus) {
        if (isActive[msg.sender] == uint256(_id)) {
            _saleStatus = true;
        } else {
            _saleStatus = false;
        }
    }
}
