pragma solidity 0.5.2;

import "./../open-zeppelin/math/SafeMath.sol";
import "./../open-zeppelin/ownership/Ownable.sol";
import "./interfaces/IExchangeRate.sol";

contract ExchangeRate is Ownable {
    using SafeMath for uint256;
    
    // storage
    address public rateAddress;
    IExchangeRate private rate;

    // events
    event ExchangeAddressChangedLog(address indexed by, address indexed oldAddress, address indexed newAddress);

    // constructor
    constructor(address _currentRateAddress) public {
        rateAddress = _currentRateAddress;
        setExchangeAddress(rateAddress);
    }

    function getPrice(uint256 _basePrice) external view returns (uint256 finalPrice) {
        finalPrice = _basePrice.div(getRate());
    }

    function setExchangeAddress(address _newAddress) public onlyOwner {
        address oldAddress = address(rate);
        rate = IExchangeRate(_newAddress);
        emit ExchangeAddressChangedLog(msg.sender, oldAddress, address(rate));
    }

    function getRate() public view returns (uint256 currentRate) {
        currentRate = rate.getRate();
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