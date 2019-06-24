pragma solidity 0.5.2;


interface IExchangeRate {
    function getRate() external view returns (uint256 rate);

}