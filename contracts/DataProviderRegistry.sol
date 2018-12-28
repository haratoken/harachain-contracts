pragma solidity ^0.4.25;

import "./interfaces/IDataProvider.sol";
import "./../open-zeppelin/ownership/Ownable.sol";
import "./../open-zeppelin/math/SafeMath.sol";


/**
 * @title DataProviderHara
 * @dev Data provider contract by hara.
 */
contract DataProviderRegistry is Ownable {
    using SafeMath for uint256;
    
    // storage
    mapping(address => bool) public auditors;
    uint256 public totalAuditors;
    // mapping(address => address) public providerOwnerList;
    mapping(uint256=>mapping(address=>address)) public providersList;
    mapping(uint256=>bool) isRegister;
    uint256 public totalProvider;
    // address[] public providerList;
    mapping(address => mapping(address=>uint256)) public scores;

    //events
    event AuditorAddedLog(address by, address addedAuditor);
    event AuditorRemovedLog(address by, address removedAuditor);
    event ScoreDataProviderLog(address by, address dataProviderAddress, uint256 score);
    event RegisterDataProviderLog(uint256 registerId, address by, address dataProvider);

    // modifier
    /**
    * @dev Modifier to check if function called by auditor.
    */
    modifier onlyAuditor() {
        require(auditors[msg.sender] == true, "Can only called by auditor");
        _;
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

    function register(address _dataProviderAddress) public {
        totalProvider.add(1);
        providersList[totalProvider][msg.sender] = _dataProviderAddress;
        emit RegisterDataProviderLog(totalProvider, msg.sender, _dataProviderAddress);
    }

    function buy(address seller, string id, uint256 value, address buyer) {
        
    }


}