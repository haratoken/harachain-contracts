const AdvancedPrice= artifacts.require('AdvancedPrice');
const expectRevert = require("./helpers/expectRevert")
const expectContractNotExists = require("./helpers/expectContractNotExists")

contract('AdvancedPrice', accounts => {
  let ap;
  const dataOwner = accounts[0];
  const notOwner = accounts[1];

  var datastoreaddress = "0xca35b7d915458ef540ade6068dfe2f44e8fa733c";

  before(async function () {

      ap = await AdvancedPrice.new( 
        datastoreaddress,
        { from: dataOwner } ); 
  });
  
  describe('killed the contract', async function(){
    it('can not killed by not owner', async function(){
      await expectRevert(ap.kill({from:notOwner}));
    });
    
    it('killed by owner and can\'t access contract', async function(){
      await ap.kill({from:dataOwner});
      await expectContractNotExists(ap.owner());
    });
  });
});