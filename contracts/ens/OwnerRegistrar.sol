pragma solidity 0.5.2;

import "./ENS.sol";
import "./../../open-zeppelin/ownership/Ownable.sol";

/**
 * A Registrar to register subdomain on HNS.
 */
contract OwnerRegistrar is Ownable {
    ENS public ens;
    
    // Events
    event SubnodeRegistered(bytes32 indexed node, bytes32 indexed label, address owner, uint256 price);

    /**
     * Constructor.
     * @param _ensAddr The ENS registrar contract address.
     */
    constructor(ENS _ensAddr) public {
        ens = _ensAddr;
    }

    /**
    * @dev Function to request subnode registration.
    * @param _node Parent node namehash.
    * @param _label Label of subnode.
    * @param _owner Owner adddres of subdnode.
    * @return Boolean of buy status.
    */
    function register(bytes32 _node, bytes32 _label, address _owner) public onlyOwner {
        ens.setSubnodeOwner(_node, _label, _owner);
        emit SubnodeRegistered(_node, _label, _owner, 0);
    }
}