pragma solidity ^0.4.25;

import "./interfaces/IPriceable.sol";
import "./interfaces/IBuyable.sol";
import "./interfaces/IWithdrawable.sol";
import "./interfaces/IPriceable.sol";
import "./../open-zeppelin/ownership/Ownable.sol";

/**
 * @title BasicMarketItem
 * @dev Basic contract for item on data exchange market.
 */

contract BasicMarketItem is IPriceable, IBuyable, IWithdrawable, Ownable {
   
   /**
    * @dev Constructor.
    * @param _owner Owner of item.
    */
    constructor(address _owner) public {
        transferOwnership(_owner);
    }

    function isSale(string _id) external view returns (bool _saleStatus);

    function setSale(string _id, bool _saleStatus) public;

}