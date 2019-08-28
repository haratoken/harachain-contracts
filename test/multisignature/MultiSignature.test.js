const expectRevert = require("./../helpers/expectRevert");

const MultiSigHNS = artifacts.require("./MultiSigHNS");
const HNS = artifacts.require("./HNSRegistry");

contract("MultiSigHNS", accounts => {
  let multisig;
  let hns;
  let executedTx;

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
  });

  it("has 1 owner and the owner is the deployer", async function() {
    const owners = await multisig.getOwners();
    assert.strictEqual(owners[0], owner1);
    assert.strictEqual(owners.length, 1);
  });

  it("has 1 required", async function() {
    const req = await multisig.required();
    assert.strictEqual(req.valueOf().toString(), "1");
  });

  // add another owner -> requirement -> 2
  describe("check owner and requirement functions", async function() {
    // add 2 more owners
    before(async function() {
      await multisig.submitAddOwnerTransaction(owner2, { from: owner1 });
      var addOwner = await multisig.submitAddOwnerTransaction(owner3, {
        from: owner1
      });
      await multisig.confirmTransaction(
        addOwner.logs[0].args.transactionId.toNumber(),
        { from: owner2 }
      );
    });

    // check owner is 3 after add 2 owners
    it("has 3 owner ", async function() {
      const allOwner = await multisig.getOwners();
      assert.strictEqual(allOwner[0], owner1);
      assert.strictEqual(allOwner[1], owner2);
      assert.strictEqual(allOwner[2], owner3);
      assert.strictEqual(allOwner.length, 3);
    });

    // remove 1 owner, requirement must be still 2
    it("remove owner3", async function() {
      var removeOwner = await multisig.submitRemoveOwnerTransaction(owner3, {
        from: owner1
      });
      await multisig.confirmTransaction(
        removeOwner.logs[0].args.transactionId.toNumber(),
        { from: owner2 }
      );
      const allOwner = await multisig.getOwners();
      assert.strictEqual(allOwner[0], owner1);
      assert.strictEqual(allOwner[1], owner2);
      assert.notEqual(allOwner[2], owner3);
      assert.strictEqual(allOwner.length, 2);

      const reqEnd1 = await multisig.required();
      assert.strictEqual(reqEnd1.valueOf().toString(), "2");
    });

    it("replace owner", async function() {
      var removeOwner2 = await multisig.replaceOwner(owner2, owner3, {
        from: owner1
      });
      const allOwner = await multisig.getOwners();
      assert.strictEqual(allOwner[0], owner1);
      assert.strictEqual(allOwner[1], owner3);
      assert.notEqual(allOwner[2], owner2);
      assert.strictEqual(allOwner.length, 2);
    });


    // make requirement to 1 by remove 1 owner
    it("change requirement to 1", async function() {
      var removeOwner2 = await multisig.submitRemoveOwnerTransaction(owner3, {
        from: owner1
      });

      await multisig.confirmTransaction(
        removeOwner2.logs[0].args.transactionId.toNumber(),
        { from: owner3 }
      );
      executedTx = removeOwner2.logs[0].args.transactionId.toNumber();
      const reqEnd2 = await multisig.required();
      assert.strictEqual(reqEnd2.valueOf().toString(), "1");
    });
  });

  describe(" can check confirmations", async function() {
      var txid;
    before(async function(){
        await hns.setRegistrar(multisig.address, {from: owner1});
        await multisig.submitAddOwnerTransaction(owner2, { from: owner1 });    
        txid = await multisig.submitSetSubnodeOwner(
            "0x00",
            "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
            multisig.address,
            { from: owner1 }
          );
    });

    it("check who confirms transaction", async function() {
        var whoConfirmed = await multisig.getConfirmations(txid.logs[0].args.transactionId.toNumber());
        assert.strictEqual(whoConfirmed.length, 1);
    });    
    it("check total confirmation of transaction", async function() {
        var totalConfirmations = await multisig.getConfirmationCount(txid.logs[0].args.transactionId.toNumber());
        assert.strictEqual(totalConfirmations.toString(), "1")
    });    

  });

  describe("modify transaction", async function() {
      var txid;
    before(async function(){
        txid = await multisig.submitSetSubnodeOwner(
            "0x00",
            "0xadcfd56a06bafd82aac6043a83ba0191c0253d55c60a6a8ee15f1d5e7441d421",
            multisig.address,
            { from: owner1 }
          );
    });

    it("can revoke confirmation", async function() {
        var totalBefore = await multisig.getConfirmationCount(txid.logs[0].args.transactionId.toNumber());
        var revoke = await multisig.revokeConfirmation(txid.logs[0].args.transactionId.toNumber(), {from:owner1});
        var totalAfter = await multisig.getConfirmationCount(txid.logs[0].args.transactionId.toNumber());
        assert.strictEqual(totalAfter.toString(), "0");
        assert.notEqual(totalBefore.toString(), totalAfter.toString());
    });        
  });

  describe("error test", async function() {
    var txid;
  before(async function(){
      txid = await multisig.submitSetSubnodeOwner(
          "0x00",
          "0xadcfd56a06bafd82aac6043a83ba0191c0253d55c60a6a8ee15f1d5e7441d421",
          multisig.address,
          { from: owner1 }
        );
  });

  it("can not confirm if transaction not exists", async function() {
      await expectRevert(
        multisig.confirmTransaction("2019", { from: owner2 })
      );
  }); 
  it("can not revoke if transaction executed", async function() {
    await expectRevert(
      multisig.revokeConfirmation(executedTx, { from: owner2 })
    );
});       
});

//   describe(" can transact hns funciton", async function() {
//     // let hart;
//     before(async function(){
//     await multisig.submitAddOwnerTransaction(owner2, { from: owner1 });    
//     });

//     it("add subnodeowner", async function() {
//       var ownerBefore = await hns.owner(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
//       );
//       var receipt = await multisig.submitSetSubnodeOwner(
//         "0x00",
//         "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658",
//         multisig.address,
//         { from: owner1 }
//       );
//       var beforeconfirmed = await hns.owner(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
//       );
//       assert.strictEqual(ownerBefore, beforeconfirmed);

//       // getting transaction id
//       var txidx = await receipt.logs[0].args.transactionId.valueOf();
//       // confirm transaction [tdxidx] by owner2
//       await multisig.confirmTransaction(txidx, { from: owner2 });
//       var ownerAfter = await hns.owner(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
//       );
//       assert.strictEqual(ownerAfter, multisig.address);
//       assert.notEqual(ownerBefore, ownerAfter);
//     });    

//     it("set resolver", async function() {
//       var resolverBefore = await hns.resolver("0x00");
//       var receipt = await multisig.submitSetResolver("0x00", dummyResolver, {
//         from: owner1
//       });
//       var beforeconfirmed = await hns.resolver("0x00");
//       assert.strictEqual(resolverBefore, beforeconfirmed);

//       // getting transaction id
//       var txidx = await receipt.logs[0].args.transactionId.valueOf();
//       // confirm transaction [tdxidx] by owner1
//       await multisig.confirmTransaction(txidx, { from: owner2 });
//       var resolverAfter = await hns.resolver("0x00");
//       assert.strictEqual(resolverAfter, dummyResolver);
//       assert.notEqual(resolverBefore, resolverAfter)
//     });

//     it("setTTL", async function() {
//       var ttlBefore = await hns.ttl(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
//       );
//       var receipt = await multisig.submitSetTTL(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6",
//         1,
//         { from: owner1 }
//       );
//       var beforeconfirmed = await hns.ttl(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
//       );
//       assert.strictEqual(ttlBefore.toString(), beforeconfirmed.toString());

//       // getting transaction id
//       var txidx = await receipt.logs[0].args.transactionId.valueOf();
//       // confirm transaction [tdxidx] by owner2
//       await multisig.confirmTransaction(txidx, { from: owner2 });
//       var ttlAfter = await hns.ttl(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
//       );
//       assert.strictEqual(ttlAfter.toString(), "1");
//       assert.notEqual(ttlBefore, ttlAfter);
//     });

//     it("set registrar", async function() {
//       var registrarBefore = await hns.activeRegistrar();
//       var receipt = await multisig.submitSetRegistrar(dummyRegistrar, {
//         from: owner2
//       });
//       var beforeconfirmed = await hns.activeRegistrar();
//       assert.strictEqual(registrarBefore, beforeconfirmed);

//       // getting transaction id
//       var txidx = await receipt.logs[0].args.transactionId.valueOf();
//       // confirm transaction [tdxidx] by owner1
//       await multisig.confirmTransaction(txidx, { from: owner1 });
//       var registrarAfter = await hns.activeRegistrar();
//       assert.strictEqual(registrarAfter, dummyRegistrar);
//       assert.notEqual(registrarBefore, registrarAfter)
//     });

//     it("setowner", async function() {
//       var ownerBefore = await hns.owner(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
//       );
//       var receipt = await multisig.submitSetOwner(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6",
//         testOwner,
//         { from: owner1 }
//       );
//       var beforeconfirmed = await hns.owner(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
//       );
//       assert.strictEqual(ownerBefore, beforeconfirmed);

//       // getting transaction id
//       var txidx = await receipt.logs[0].args.transactionId.valueOf();
//       // confirm transaction [tdxidx] by owner2
//       await multisig.confirmTransaction(txidx, { from: owner2 });
//       var ownerAfter = await hns.owner(
//         "0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6"
//       );
//       assert.strictEqual(ownerAfter, testOwner);
//       assert.notEqual(ownerBefore, ownerAfter);
//     });

//   });
});
