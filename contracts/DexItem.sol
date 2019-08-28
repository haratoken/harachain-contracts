pragma solidity 0.5.2;

import "./interfaces/IPriceable.sol";
import "./interfaces/IBuyable.sol";
import "./interfaces/IWithdrawable.sol";
import "./interfaces/IPriceable.sol";
import "./interfaces/IBuyMechanism.sol";
import "./../open-zeppelin/ownership/Ownable.sol";
import "./../open-zeppelin/token/ERC20/ERC20.sol";
import "./DataFactoryRegistry.sol";
import "./../open-zeppelin/math/SafeMath.sol";


/**
 * @title Data Interface
 * @dev 
 */
interface IData {
   
    function getLocation() external view returns (address payable);
    function getOwner() external view returns (address payable);
    function setPurchaseStatus(bytes32 _id, address _buyer, bool _status) external;
    function getPurchaseStatus(address _buyer, bytes32 _id) external view returns (bool permission);
}


/**
 * @title BasicMarketItem
 * @dev Basic contract for item on data exchange market.
 */

contract DexItem is IPriceable, IBuyable, IWithdrawable, Ownable {
    using SafeMath for uint256;
    
    ERC20 private hart;
    address public hartAddress;
    IBuyMechanism private buyMechanism;
    DataFactoryRegistry private dataFactory;
    
    address public priceAddress;
    mapping(bytes32=>uint256) internal price; // bytes32 -> gabungan address  + version
    mapping(bytes32=>bool) internal saleStatus;
    mapping(address=>uint) public sales; // owner address sales

    /**
    * @dev Modifier to check if function called by hara token contract address.
    */
    modifier onlyHart() {
        require(msg.sender == hartAddress, "Can only accesed by Hart.");
        _;
    }

    /**
    * @dev Modifier to check if function called by data owner only.
    */
    modifier onlyDataOwner(bytes32 _id) {
        (address _dataAddr,) = parseId(_id);
        IData dataContract = IData(_dataAddr);
        require(msg.sender == dataContract.getOwner(), "Can only accesed by Data Owner.");
        _;
    }

    /**
    * @dev Modifier to check if parameter is msg.sender.
    */
    modifier onlySender(address param) {
        require(msg.sender == param, "Can only accesed by sender on parameter.");
        _;
    }

    event PriceAddressChangedLog(address indexed by, address oldAddress, address newAddress);


   /**
    * @dev Constructor.
    * @param _hartAddress Address of hara token contract.
    * @param _dfAddress Address of data factory contract.
    */
    constructor(address _hartAddress, DataFactoryRegistry _dfAddress) public {
        buyMechanism = IBuyMechanism(_hartAddress);
        hart = ERC20(_hartAddress);
        hartAddress = _hartAddress;
        dataFactory = _dfAddress;
    }
       
    /**
    * @dev Function to set price of specific price Id. Only owner of item can call this function.
    * @param _id Price id of item. Combination of item address and item version.
    * @param _value Value of item.
    */
    function setPrice(bytes32 _id, uint256 _value) external onlyDataOwner(_id) {
    // function setPrice(bytes32 _id, uint256 _value) external {
        (address addr,) = parseId(_id);
        if (priceAddress == address(0)) {
            uint256 _oldValue = price[_id];
            price[_id] = _value;
            emit PriceChangedLog(addr, _id, _oldValue, _value);
        } else {
            IPriceable priceContract = IPriceable(priceAddress);
            priceContract.setPrice(_id, _value);
        }
    }

    /**
    * @dev Function to get price of specific price Id.
    * @param _id Price id of item.
    * @return Uint256 of price.
    */
    function getPrice(bytes32 _id) external view  returns (uint256 idPrice) {
        if (priceAddress == address(0)) {
            idPrice = price[_id];
        } else {
            IPriceable priceContract = IPriceable(priceAddress);
            idPrice = priceContract.getPrice(_id);
        }
    }

    /**
    * @dev Function to get purchase status of buyer for specific item id
    * @param _buyer Buyer to get purchase status
    * @param _id Price id item to get purchase status. Combination of item address and item version.
    */
    function getPurchaseStatus(address _buyer, bytes32 _id) external view returns (bool permission) {
        (address dataAddress, bytes12 dataVersionTemp) = parseId(_id);
        bytes32 dataVersion = bytes32(dataVersionTemp);
        IData purchaseData = IData(dataAddress);
        permission = purchaseData.getPurchaseStatus(_buyer, dataVersion);
    }

    /**
    * @dev Function to get sale status of specific price Id.
    * @param _id Price id of item. Combination of item address and item version.
    * @return Boolean of sale status. True means on sale.
    */
    function isSale(bytes32 _id)  external view returns (bool _saleStatus) {
        _saleStatus = saleStatus[_id];
    }

        /**
    * @dev Function to set price address of item. Can only called by Dex owner.
    * @param _newAddress New price address.
    */
    function setPriceAddress(address _newAddress) public onlyOwner {
        address oldAddress = priceAddress;
        priceAddress = _newAddress;
        emit PriceAddressChangedLog(msg.sender, oldAddress, _newAddress);
    }

    /**
    * @dev Function to set sale status of specific price Id. Only owner of item can call this function.
    * @param _id Price id of item. Combination of item address and item version.
    * @param _saleStatus Sale status of specific item price Id. True means on sale.
    */
    function setSale(bytes32 _id, bool _saleStatus) public onlyDataOwner(_id) {
        saleStatus[_id] = _saleStatus;
        emit SaleLog(address(this), _id, _saleStatus);
    }

    /**
    * @dev Function to withdraw sales token. Only owner can call this function.
    * @param _to Address destination to transfer the sales token.
    * @param _value Value of token to withdraw.
    */
    function withdraw(address _to, uint256 _value) public onlySender(_to) {
        require(sales[_to] >= _value, "Your sales is less than value you want to withdraw");
        require(hart.transfer(_to, _value), "Failed to withdraw sales");
        sales[_to] = sales[_to].sub(_value);
        emit WithdrawnLog(_to, address(this), _value);
    }

    /**
    * @dev Function to buy item from transaction receipt. 
           Only hara token contract address can call this function.
    * @param _txReceipt Transaction receipt of buy proccess.
    * @return Boolean of buy status.
    */
    function buy(uint256 _txReceipt) public onlyHart returns (bool) {
        address buyer;
        address seller;
        bytes32 id;
        uint256 value;
        (buyer, seller, id, value) = buyMechanism.getReceipt(_txReceipt);
        (address dataAddress, bytes12 dataVersionTemp) = parseId(id);
        bytes32 dataVersion = bytes32(dataVersionTemp);
        IData dataContract = IData(dataAddress);
        
        dataContract.setPurchaseStatus(dataVersion, buyer, true);
        emit BoughtLog(buyer, dataAddress, dataVersion, value);

        uint256 forHara = getPercentage(value, dataFactory.getPercentage(0));
        uint256 forDataProvider = getPercentage(value, dataFactory.getPercentage(1));
        uint256 forOwner = value.sub(forDataProvider).sub(forHara);
        
        require(hart.transfer(dataContract.getLocation(), forDataProvider), "Payment to Data Provider failed");
        require(hart.transfer(dataFactory.haraAddress(), forHara), "Payment to Hara failed");
        address dataOwner = dataContract.getOwner();
        sales[dataOwner] = sales[dataOwner].add(forOwner);
        return true;
    }

    /**
    * @dev function get get value percentage of hart.
    * @param _number Hart.
    * @param _percent Percent to calculate.
    * @return Result of calculation.
    */
    function getPercentage(uint256 _number, uint256 _percent) internal pure returns(uint256 result) {
        result = _number.mul(_percent) / 100;
    }

    /**
    * @dev function parse id to address and bytes12.
    * @param _id Bytes32 of Id.
    * @return Address and bytes12 from parse result.
    */
    function parseId(bytes32 _id) internal pure returns (address addr, bytes12 version) {
        bytes32 mask12 = 0xffffffffffffffffffffffff0000000000000000000000000000000000000000;
        bytes32 mask20 = 0xffffffffffffffffffffffffffffffffffffffff000000000000000000000000;

        addr = address(bytes20(_id&mask20));
        version = bytes12((_id<<(20)*8)&mask12);
    }
    
    /**
    * @dev function to destroy contract
    */
    function kill() 
    public
    onlyOwner() {
        selfdestruct(address(uint160(owner())));
    }
}