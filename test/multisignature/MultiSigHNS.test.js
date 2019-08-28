const MultiSigHNS = artifacts.require("./MultiSigHNS");
const HNS = artifacts.require("./HNSRegistry");

contract("MultiSigHNS", accounts => {
  let multisig;
  let hns;

  const owner1 = accounts[0];
  const owner2 = accounts[1];
  const owner3 = accounts[2];
  const dummyResolver = accounts[3];
  const testOwner = accounts[4];
  const dummyRegistrar = accounts[5];

  before(async function() {
    hns = await HNS.new({
      from: owner1
    });
    multisig = await MultiSigHNS.new(hns.address, { from: owner1 });
    await hns.setRegistrar(multisig.address, {from: owner1});
    await hns.setOwner("0x00", multisig.address, { from: owner1 });
  });

  describe(" can transact hns funciton", async function() {
    before(async function(){
    await multisig.submitAddOwnerTransaction(owner2, { from: owner1 });    
    });

    it("add subnodeowner", async function() {
      var ownerBefore = await hns.owner(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
      );
      var receipt = await multisig.submitSetSubnodeOwner(
        "0x00",
        "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
        multisig.address,
        { from: owner1 }
      );
      var beforeconfirmed = await hns.owner(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
      );
      assert.strictEqual(ownerBefore, beforeconfirmed);

      // getting transaction id
      var txidx = await receipt.logs[0].args.transactionId.valueOf();
      // confirm transaction [tdxidx] by owner2
      await multisig.confirmTransaction(txidx, { from: owner2 });
      var ownerAfter = await hns.owner(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
      );
      assert.strictEqual(ownerAfter, multisig.address);
      assert.notEqual(ownerBefore, ownerAfter);
    });    

    it("set resolver", async function() {
      var resolverBefore = await hns.resolver("0x00");
      var receipt = await multisig.submitSetResolver("0x00", dummyResolver, {
        from: owner1
      });
      var beforeconfirmed = await hns.resolver("0x00");
      assert.strictEqual(resolverBefore, beforeconfirmed);

      // getting transaction id
      var txidx = await receipt.logs[0].args.transactionId.valueOf();
      // confirm transaction [tdxidx] by owner1
      await multisig.confirmTransaction(txidx, { from: owner2 });
      var resolverAfter = await hns.resolver("0x00");
      assert.strictEqual(resolverAfter, dummyResolver);
      assert.notEqual(resolverBefore, resolverAfter)
    });

    it("setTTL", async function() {
      var ttlBefore = await hns.ttl(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
      );
      var receipt = await multisig.submitSetTTL(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6",
        1,
        { from: owner1 }
      );
      var beforeconfirmed = await hns.ttl(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
      );
      assert.strictEqual(ttlBefore.toString(), beforeconfirmed.toString());

      // getting transaction id
      var txidx = await receipt.logs[0].args.transactionId.valueOf();
      // confirm transaction [tdxidx] by owner2
      await multisig.confirmTransaction(txidx, { from: owner2 });
      var ttlAfter = await hns.ttl(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
      );
      assert.strictEqual(ttlAfter.toString(), "1");
      assert.notEqual(ttlBefore, ttlAfter);
    });

    it("set registrar", async function() {
      var registrarBefore = await hns.activeRegistrar();
      var receipt = await multisig.submitSetRegistrar(dummyRegistrar, {
        from: owner2
      });
      var beforeconfirmed = await hns.activeRegistrar();
      assert.strictEqual(registrarBefore, beforeconfirmed);

      // getting transaction id
      var txidx = await receipt.logs[0].args.transactionId.valueOf();
      // confirm transaction [tdxidx] by owner1
      await multisig.confirmTransaction(txidx, { from: owner1 });
      var registrarAfter = await hns.activeRegistrar();
      assert.strictEqual(registrarAfter, dummyRegistrar);
      assert.notEqual(registrarBefore, registrarAfter)
    });

    it("setowner", async function() {
      var ownerBefore = await hns.owner(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
      );
      var receipt = await multisig.submitSetOwner(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6",
        testOwner,
        { from: owner1 }
      );
      var beforeconfirmed = await hns.owner(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
      );
      assert.strictEqual(ownerBefore, beforeconfirmed);

      // getting transaction id
      var txidx = await receipt.logs[0].args.transactionId.valueOf();
      // confirm transaction [tdxidx] by owner2
      await multisig.confirmTransaction(txidx, { from: owner2 });
      var ownerAfter = await hns.owner(
        "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
      );
      assert.strictEqual(ownerAfter, testOwner);
      assert.notEqual(ownerBefore, ownerAfter);
    });

  });
});
