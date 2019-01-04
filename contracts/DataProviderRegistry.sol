pragma solidity ^0.4.25;

import "./interfaces/IDataProvider.sol";
import "./interfaces/IPriceable.sol";
import "./interfaces/IBuyMechanism.sol";
import "./../open-zeppelin/ownership/Ownable.sol";
import "./../open-zeppelin/math/SafeMath.sol";
import "./../open-zeppelin/token/ERC20/ERC20.sol";


/**
 * @title DataProviderHara
 * @dev Data provider contract by hara.
 */
contract DataProviderRegistry is Ownable, IPriceable {
    using SafeMath for uint256;
    
    // storage
    mapping(address => bool) public auditors;
    uint256 public totalAuditors;

    mapping(address=>address) public providersList;
    mapping(address=>bool) public isRegister;
    mapping(address=>uint256) public providerBalances;
    uint256 public totalProvider;

    mapping(address => mapping(address=>uint256)) public scores;
    uint256 private registrationPrice;
    mapping(address=>uint256) private registrationPrices;
    bool private registrationSale;
    IBuyMechanism public buyMechanism;
    ERC20 public hart;

    //events
    event AuditorAddedLog(address by, address addedAuditor);
    event AuditorRemovedLog(address by, address removedAuditor);
    event ScoreDataProviderLog(address by, address dataProviderAddress, uint256 score);
    event RegisterDataProviderLog(bytes32 registerId, address by, address dataProvider);
    event RegisterCompletedLog(bytes32 registerId, address by, uint256 feeValue);
    event RemoveDataProviderLog(address dataProvider, uint256 refundValue);
    
    // modifier
    /**
    * @dev Modifier to check if function called by auditor.
    */
    modifier onlyAuditor() {
        require(auditors[msg.sender] == true, "Can only called by auditor");
        _;
    }

    /**
    * @dev Modifier to check if function called by hart contract.
    */
    modifier onlyHart() {
        require(msg.sender == address(buyMechanism), "Can only called by hart contract");
        _;
    }

    /**
    * @dev Modifier to check if data provider address is not registered.
    */
    modifier isNotRegistered(address _dataProviderAddress) {
        require(isRegister[_dataProviderAddress] == false, "Data Provider address is already registered.");
        _;
    }

    /**
    * @dev Constructor function.
    * @param _hartAddress Address of hara token contract.
    */
    constructor (address _hartAddress) public {
        buyMechanism = IBuyMechanism(_hartAddress);
        hart = ERC20(_hartAddress);
    }

    /**
    * @dev Function to set registration status (sale). Can be called only by owner.
    * @param _saleStatus Registration status (sale).
    */
    function setSale(bool _saleStatus) external onlyOwner {
        registrationSale = _saleStatus;
        emit SaleLog(address(this), "DataProviderRegistry", registrationSale);
    }

    /**
    * @dev Function to set registration fee (proce). Can be called only by owner.
    * @param _id Data provider address on bytes32.
    * @param _value Registration fee (price).
    */
    function setPrice(bytes32 _id, uint256 _value) external onlyOwner {
        address dataProvider = address(_id);
        uint256 _oldValue;
        _oldValue = registrationPrices[dataProvider];
        registrationPrices[dataProvider] = _value;
        emit PriceChangedLog(_id, _oldValue, _value);
    }

    /**
    * @dev Function to set registration fee (proce). Can be called only by owner.
    * @param _value Registration fee (price).
    */
    function setPrice(uint256 _value) external onlyOwner {
        uint256 _oldValue;
        _oldValue = registrationPrice;
        registrationPrice = _value;
        emit PriceChangedLog("Price", _oldValue, _value);
    }
    
    /**
    * @dev Function to get registration status (sale).
    * @param _id Not needed.
    */
    function isSale(bytes32 _id) external view returns (bool _saleStatus) {
        _saleStatus = registrationSale;
    }

    /**
    * @dev Function to get registration fee (price).
    * @param _id Not needed.
    */
    function getPrice(bytes32 _id) external view  returns (uint256 _idPrice) {
        address dataProvider = address(_id);
        if (registrationPrices[dataProvider] > 0) {
            _idPrice = registrationPrices[dataProvider];
        } else {
            _idPrice = registrationPrice;
        }
    }
    
    /**
    * @dev Function to add new auditor. Only called by owner.
    * @param _auditor Address of auditor to add.
    */
    function addAuditor(address _auditor) public onlyOwner {
        auditors[_auditor] = true;
        totalAuditors = totalAuditors.add(1);
        emit AuditorAddedLog(msg.sender, _auditor);
    }
    
    /**
    * @dev Function to add new auditor. Only called by owner.
    * @param _auditor Address of auditor to remove.
    */
    function removeAuditor(address _auditor) public onlyOwner {
        auditors[_auditor] = false;
        totalAuditors = totalAuditors.sub(1);
        emit AuditorRemovedLog(msg.sender, _auditor);
    }

    /**
    * @dev Function to score data provider. Only called by auditor.
    * @param _dataProviderAddress Address of data provider.
    * @param _score Score to assign to data provider.
    */
    function scoreDataProvider(address _dataProviderAddress, uint256 _score) public onlyAuditor {
        scores[_dataProviderAddress][msg.sender] = scores[_dataProviderAddress][msg.sender].add(_score);
        emit ScoreDataProviderLog(msg.sender, _dataProviderAddress, _score);
    }

    /**
    * @dev Function to register data provider address. Only not registered data provider can access.
    * @param _dataProviderAddress Address of data provider.
    */
    function register(address _dataProviderAddress) public isNotRegistered(_dataProviderAddress) 
    returns (bytes32 registerId) {
        totalProvider = totalProvider.add(1);
        providersList[_dataProviderAddress] = msg.sender;
        registerId = bytes32(_dataProviderAddress);
        emit RegisterDataProviderLog(registerId, msg.sender, _dataProviderAddress);
    }

    /**
    * @dev Function to pay registration. Can only call by Hara TOken Contract.
    * @param _txReceipt Transaction Receipt.
    */
    function buy(uint256 _txReceipt) onlyHart returns (bool success) {
        address dataProviderOwner;
        address seller;
        bytes32 id;
        uint256 value;
        (dataProviderOwner, seller, id, value) = buyMechanism.getReceipt(_txReceipt);
        address dataProvider = address(id);
        isRegister[dataProvider] = true;
        providerBalances[dataProvider] = providerBalances[dataProvider].add(value);
        
        emit RegisterCompletedLog(id, dataProviderOwner, value);
        success = true;
    }

    /**
    * @dev Function to remove registered data provider. Can be called only by owner.
    * @param _dataProviderAddress Data provider address to remove.
    */
    function removeDataProvider(address _dataProviderAddress) public onlyOwner {
        isRegister[_dataProviderAddress] = false;
        totalProvider = totalProvider.sub(1);
        address dataProviderOwner = providersList[_dataProviderAddress];
        require(hart.transfer(dataProviderOwner, providerBalances[_dataProviderAddress]), "Refund failed");
        providerBalances[_dataProviderAddress] = providerBalances[_dataProviderAddress].sub(providerBalances[_dataProviderAddress]);
        emit RemoveDataProviderLog(_dataProviderAddress, providerBalances[_dataProviderAddress]);
    }
}