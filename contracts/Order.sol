pragma solidity 0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";
import "./../open-zeppelin/math/SafeMath.sol";
import "./interfaces/IPriceable.sol";
import "./interfaces/IBuyMechanism.sol";
import "./interfaces/IBuyable.sol";
import "./interfaces/IWithdrawable.sol";
import "./DexItem.sol";


/**
 * @title HartBuyable
 * @dev Hara Token buy function Interface
 */
contract HartBuyable {
  /**
    * @dev Function to buy from hara token contract.
    * @param seller Address of seller to buy.
    * @param  id Id or version of item.
    * @param value Amount of price to pay.
    * @param buyer Buyer who purchased item.
    * @return A boolean that indicates if the operation was successful.
   */
    function buy(address seller, bytes32 id, uint256 value, address buyer) public;

    /**
    * @dev Function transfer from hara token contract.
    * @param to Destination address to send token.
    * @param  value Value of token to transfer.
    * @return A boolean that indicates if the operation was successful.
   */
    function transfer(address to, uint256 value) public returns (bool);
}


/**
 * @title Order
 * @dev Contract to automate bulk buy item.
 */
contract Order is Ownable, IBuyable, IWithdrawable {
    using SafeMath for uint256;

    // struct
    struct OrderDetail {
        address sellerAddress;
        bytes32 version;
    }

    // storage
    mapping(address=>mapping(uint256=>bytes32[])) public orderTransaction; // buyer => orderId => list of seller and version
    mapping(address=>uint256) public isActive;
    mapping(uint256=>bool) public isOrderActive;
    uint256 public orderId; // nonce
    mapping(uint256=>mapping(bytes32=>bool)) public addedSellerOrder;
    mapping(bytes32=>bool) public sellerAddressBloom;
    IBuyMechanism private buyMechanism;
    HartBuyable private hart;
    mapping(uint256=>bool) public purchaseStatus;
    DexItem public dexItem;

    //event
    event OrderCreated(address indexed buyer, uint256 indexed orderId, bytes32 paymentId);
    event OrderAdded(uint256 indexed orderId, bytes32 itemId);
    event OrderAlreadyExists(uint256 indexed orderId, bytes32 itemId);
    event OrderCancelled(uint256 indexed orderId, address by);
    event OrderBought(uint256 indexed orderId, address indexed buyerAddress, bytes32 itemId, uint256 price);
    event DexAddressChanged(address newAddress);
    
    //modifier
    /**
    * @dev Modifier to check if an address still have active order.
    */
    modifier notActiveOrder() {
        require(isActive[msg.sender] == 0, "Address still have active Order");
        _;
    }

    /**
    * @dev Modifier to check if the owner who called the functon.
    * @param _orderId Id of Orders.
    */
    modifier onlyOrderOwner(uint256 _orderId) {
        require(isActive[msg.sender] == _orderId, "Only order owner can modify order");
        _;
    }

    /**
    * @dev Constructor.
    * @param _hartAddress Address of Hara Token Smart Contract.
    */
    constructor(address _hartAddress)
    public {
        buyMechanism = IBuyMechanism(_hartAddress);
        hart = HartBuyable(_hartAddress);
    }

    /**
    * @dev Function to set Dex address to use.
    * @param _dexAddress The address to set.
    */
    function setDexAddress(DexItem _dexAddress) 
    public 
    onlyOwner
    {
        dexItem = _dexAddress;
        emit DexAddressChanged(address(dexItem));
    }


    /**
    * @dev Function to buy specific order id.
    * @param _txReceipt Transactio reciept from hara token contract.
    */
    function buy(uint256 _txReceipt) external returns (bool) {
        address buyer;
        address seller;
        bytes32 id;
        uint256 value;
        (buyer, seller, id, value) = buyMechanism.getReceipt(_txReceipt);
        uint256 _id = uint256(id);

        for (uint index = 0; index < orderTransaction[buyer][_id].length; index++) {
            bytes32 detail = orderTransaction[buyer][_id][index];
            if (sellerAddressBloom[keccak256(abi.encodePacked(_id, detail))] == false) {
                uint256 price = dexItem.getPrice(detail);
                hart.buy(address(dexItem), detail, price, buyer);
                sellerAddressBloom[keccak256(abi.encodePacked(_id, detail))] = true; 
                emit OrderBought(_id, buyer, detail, price);
            }
        }
        purchaseStatus[_id] = true;
        isActive[buyer] = 0;
        isOrderActive[_id] = false;
        emit BoughtLog(buyer, seller, id, value);
        return true;
    }

    /**
    * @dev Function to withdraw haraToken.
    * @param _to Destination to withdraw hart.
    * @param _value Amount of hart to withdraw.
    */
    function withdraw(address _to, uint256 _value) external onlyOwner {
        require(hart.transfer(_to, _value));
        emit WithdrawnLog(_to, address(this), _value);
    }

    /**
    * @dev Function to get price on specific order id. It will called from hara token contract.
    * @param _id Id of order.
    */
    function getPrice(bytes32 _id) external view  returns (uint256 _idPrice) {
        _idPrice = _getTotalInvoice(uint256(_id));
    }

    /**
    * @dev Function to get purchase status from specific order id.
    * @param _buyer Not used.
    * @param _id Id of order.
    */
    function getPurchaseStatus(address _buyer, bytes32 _id) external view returns (bool status) {
        status = purchaseStatus[uint256(_id)];
    }

    /**
    * @dev Function to know if specific orderId is still active or not.
    * @param _id Id of order.
    */
    function isSale(bytes32 _id) external view returns (bool _saleStatus) {
        _saleStatus = isOrderActive[uint256(_id)];
    }
    
    /**
    * @dev Function to create new order. Address who don't still have order can't create new order.    
    */
    function createOrder() public notActiveOrder {
        orderId = orderId.add(1);
        orderTransaction[msg.sender][orderId];
        isActive[msg.sender] = orderId;
        isOrderActive[orderId] = true;
        emit OrderCreated(msg.sender, orderId, bytes32(orderId));
    }
    
    /**
    * @dev Function to create and add item to order.
    * @param _ids Array of items id (combination address+version) to buy.
    */
    function createandAddOrder(bytes32[] memory _ids) public 
    notActiveOrder {
        createOrder();
        addOrder(orderId,_ids);
    }

    /**
    * @dev Function to add item to buy at sspecific order id.
    * @param _orderId Id of order.
    * @param _ids Array of items id (combination address+version) to buy.
    */
    function addOrder(uint256 _orderId, bytes32[] memory _ids) public 
    onlyOrderOwner(_orderId) {
        for (uint i = 0; i < _ids.length; i++) {
            _addOrder(msg.sender, _orderId, _ids[i]);
        }
    }    

    /**
    * @dev Function to get how much item that already on specific order id.
    * @param _buyer Address of buyer.
    * @param _orderId Id of order.
    */
    function getOrderLength(address _buyer, uint256 _orderId) public view returns (uint256 list) {
        list = orderTransaction[_buyer][_orderId].length;
    }

    /**
    * @dev Function to cancel specific order id.
    * @param _orderId Id of order.
    */
    function cancelOrder(uint256 _orderId) public onlyOrderOwner(_orderId) {
        isActive[msg.sender] = 0;
        emit OrderCancelled(_orderId, msg.sender);
    }

    /**
    * @dev Detail function to add item to specific order id.
    * @param _buyer Address of buyer.
    * @param _orderId Id of order.
    * @param _id Id combination of seller address + version.
    */
    function _addOrder(address _buyer, uint256 _orderId, bytes32 _id) private {
        if (addedSellerOrder[_orderId][_id] == false) {
            uint256 length = orderTransaction[_buyer][_orderId].length;
            orderTransaction[_buyer][_orderId].push(_id);
            addedSellerOrder[_orderId][_id] = true;
            emit OrderAdded(_orderId, orderTransaction[_buyer][_orderId][length]);
        } else {
            emit OrderAlreadyExists(_orderId, _id);
        }
    }

        /**
    * @dev Function to calculate total price of specific orer id.
    * @param _orderId Id of order.
    */
    function _getTotalInvoice(uint256 _orderId) private view returns (uint256 total) {
        for (uint256 _id = 0; _id < orderTransaction[msg.sender][_orderId].length; _id++) {
            total = total.add(dexItem.getPrice(orderTransaction[msg.sender][_orderId][_id]));
        }
    }
}
