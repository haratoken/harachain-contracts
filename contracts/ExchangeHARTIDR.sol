pragma solidity ^0.5.2;

import "./../open-zeppelin/ownership/Ownable.sol";
import "./../open-zeppelin/math/SafeMath.sol";
import "./interfaces/IExchangeRate.sol";


contract ExchangeHARTIDR is Ownable, IExchangeRate {
    using SafeMath for uint256;    

    // storage
    uint public latestUpdate;
    uint256 public exchangeRate;

    address public exchangeChanger;
    
    // events
    event ExchangeChangerChangedLog(address indexed by, address indexed oldAddress, address indexed newAddress);
    event ExchangeRateChangedLog(address indexed by, uint256 indexed oldRate, uint256 indexed newRate);

    //modifier
    modifier onlyExchangeChanger() {
        require(msg.sender == exchangeChanger, "Can only be acessed by exchange changer address");
        _;
    }

    /**
    * @dev Function to set exchange rate rupiah and hart. Only exchange changer can call this function.
    * @param _newRate new rate for rupiah and hart.
    */
    function setExchangeRate(uint256 _newRate) external onlyExchangeChanger {
        uint oldRate = exchangeRate;
        latestUpdate = now;
        exchangeRate = _newRate;
        emit ExchangeRateChangedLog(msg.sender, oldRate, exchangeRate);
    }

    /**
    * @dev Function to change exchange changer. Only owner can call this function.
    * @param _newAddress New address for exchange changer.
    */
    function setExchangeChanger(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "new address must be address");
        address oldAddress = exchangeChanger;
        exchangeChanger = _newAddress;
        emit ExchangeChangerChangedLog(msg.sender, oldAddress, exchangeChanger);
    }

    /**
    * @dev Function to get latest exchange rate.
    * @return Uint256 of price.
    */
    function getRate() external view returns (uint256 rate) {
        require(latestUpdate > 0, "Rate is not set.");
        rate = exchangeRate;
    }

    /**
    * @dev function to destroy contract
    */
    function kill() 
    public
    onlyOwner {
        selfdestruct(address(uint160(owner())));
    }
}
