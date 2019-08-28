pragma solidity 0.5.2;


/**
 * @title ContractMadeAbstract
 * @dev Interface for every contract with getClass function
 */
contract ContractMadeAbstract {
    string internal class;

    // events
    event HasGetClass();
    
    constructor(string memory hns) public {
        class = hns;
        emit HasGetClass();
    }

        /**
    * @dev Function to get class HNS.
    * @return String of class HNS.
    * 
    */
    function getClass() 
    external
    view 
    returns(string memory hns) {
        hns = class;
    }
}