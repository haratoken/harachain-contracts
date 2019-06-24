const HaraTokenPrivate = artifacts.require("HaraTokenPrivate");
const DataStore = artifacts.require("DataStore");
const DataFactory = artifacts.require("DataFactory");
const DataFactoryRegistry = artifacts.require("DataFactoryRegistry");
const DexItem = artifacts.require('DexItem');

const expectRevert = require("./helpers/expectRevert");
const expectThrow = require("./helpers/expectThrow");

contract("HaraTokenPrivate", accounts => {
  let token;
  let ds;
  let df;
  let dfr;
  let dexItem;
  let id;

  const creator = accounts[0];
  const minter = accounts[1];
  const burner = accounts[2];
  const itemOwner = accounts[3];
  const buyer = accounts[4];
  const notOwner = accounts[6];
  const mintPause = accounts[7];
  const notMintPause = accounts[8];
  const buyer2 = accounts[9];
  const dexOwner = accounts[5];

  before(async function() {
    // deploy hart contract
    token = await HaraTokenPrivate.new({ from: creator, gas: 4700000 });

    // deploy data factory contract
    df = await DataFactory.new(token.address, { from: creator, gas: 4700000 });

    // deploy data factory registry
    dfr = await DataFactoryRegistry.new(df.address, {
      from: creator,
      gas: 4700000
    });

    // deploy data store contract
    ds = await DataStore.new(
      itemOwner,
      "0xB8EB1CD45DDe2BB69aE087f566629Fa82FA8fa54",
      "0x430dec04b9ebe807ce8fb9b0d025861c13f5e36f226c12469ff6f89fb217fa9f",
      web3.utils.asciiToHex("markle"),
      dfr.address,
      { from: itemOwner, gas: 4700000 }
    );

    // await ds.setPrice(web3.utils.fromAscii("1"), 5, { from: itemOwner });
    // await ds.setSale(web3.utils.fromAscii("1"), true, { from: itemOwner });
    id = ds.address + web3.utils.fromAscii("1").slice(2);

    dexItem = await DexItem.new(
        token.address, 
        dfr.address, {from: dexOwner});

    await dfr.setDexAddress(dexItem.address, {from:creator});
  });

  it("has a name", async function() {
    const name = await token.name();
    assert.equal(name, "HaraToken");
  });

  it("has a symbol", async function() {
    const symbol = await token.symbol();
    assert.equal(symbol, "HART");
  });

  it("has 18 decimals", async function() {
    const decimals = await token.decimals();
    assert.strictEqual(decimals.toNumber(), 18);
  });

  it("has HART Network ID", async function() {
    const networkId = await token.HART_NETWORK_ID();
    assert.strictEqual(networkId.toNumber(), 2);
  });

  it("assure initial supply is 0", async function() {
    const totalSupply = await token.totalSupply();
    const creatorBalance = await token.balanceOf(creator);

    assert.strictEqual(creatorBalance.toString(), totalSupply.toString());
    assert.strictEqual(totalSupply.toNumber(), 0);
  });

  describe("contract is mintable and burnable", async function() {
    before(async function() {
      // initial transfer token
      await token.mint(creator, web3.utils.toWei("500"), { from: creator });
    });

    it("transfer 10 token to burner", async function() {
      // creator balance = 10000
      // burner balance = 50
      var transferTx = await token.transfer(burner, web3.utils.toWei("50"), {
        from: creator
      });
      const userToken = await token.balanceOf(burner);
      assert.strictEqual(
        userToken.toString(),
        (50 * Math.pow(10, 18)).toString()
      );

      var transferLog = transferTx.logs[0];
      assert.strictEqual(transferLog.event, "Transfer");
      assert.strictEqual(transferLog.args.from, creator);
      assert.strictEqual(transferLog.args.to, burner);
      assert.strictEqual(
        transferLog.args.value.toString(),
        (50 * Math.pow(10, 18)).toString()
      );
    });

    it("burn 20 token and mint the same amount for account[0]", async function() {
      await token.transfer(burner, web3.utils.toWei("50"), { from: creator });

      // burn 20 token
      var receipt = await token.burnToken(
        web3.utils.toWei("20"),
        "1this is tes",
        { from: burner }
      );
      const logs = receipt.logs;
      const afterBurn = await token.balanceOf(burner);
      assert.strictEqual(
        afterBurn.toString(),
        web3.utils.toWei("80").toString()
      );
      assert.strictEqual(logs.length, 3);
      assert.strictEqual(logs[2].event, "BurnLog");
      assert.strictEqual(logs[2].args.__length__, 5);
      assert.strictEqual(
        logs[2].args.burner.toLowerCase(),
        burner.toLowerCase()
      );
      assert.strictEqual(
        logs[2].args.value.toString(),
        web3.utils.toWei("20").toString()
      );
      assert.strictEqual(logs[2].args.data, "1this is tes");

      var mintTx = await token.mintToken(
        logs[2].args.id.valueOf(),
        logs[2].args.burner,
        logs[2].args.value.valueOf(),
        logs[2].args.hashDetails,
        2,
        { from: creator }
      );
      const afterMint = await token.balanceOf(burner);
      var mintLogs = mintTx.logs;

      assert.strictEqual(Object.keys(mintLogs).length, 2);
      assert.strictEqual(mintLogs[1].event, "MintLog");
      assert.strictEqual(
        mintLogs[1].args.id.toString(),
        logs[2].args.id.valueOf().toString()
      );
      assert.strictEqual(
        logs[2].args.burner.toLowerCase(),
        burner.toLowerCase()
      );
      assert.strictEqual(
        logs[2].args.value.toString(),
        web3.utils.toWei("20").toString()
      );
      assert.strictEqual(logs[2].args.hashDetails, logs[2].args.hashDetails);
      assert.strictEqual(logs[2].args.data, "1this is tes");

      assert.strictEqual(
        afterMint.toString(),
        web3.utils.toWei("100").toString()
      );
    });

    it("minted by minter instead of creator", async function() {
      await token.addMinter(minter, { from: creator });
      const allowedMinter = await token.isMinter(minter);
      assert.strictEqual(allowedMinter, true);

      await token.transfer(burner, web3.utils.toWei("50"), { from: creator });
      var receiptBurn = await token.burnToken(
        web3.utils.toWei("20"),
        "1this is tes",
        { from: burner }
      );
      const logsBurn = receiptBurn.logs;
      const receiptMint = await token.mintToken(
        logsBurn[2].args.id.valueOf(),
        logsBurn[2].args.burner,
        logsBurn[2].args.value.valueOf(),
        logsBurn[2].args.hashDetails,
        2,
        { from: minter }
      );
      const logsMint = receiptMint.logs;
      assert.strictEqual(logsMint[1].args.status, true);
    });
  });
  describe("contract have buy mechanism", async function() {
    before(async function() {
      await token.transfer(buyer, web3.utils.toWei("100"), { from: creator });
      await dexItem.setPrice(id, web3.utils.toWei("10"), {
        from: itemOwner
      });
      await dexItem.setSale(id, true, {
        from: itemOwner
      });
    });

    it("can buy item", async function() {
      var before = await dexItem.sales(itemOwner);
      var receipt = await token.buy(
        dexItem.address,
        id,
        web3.utils.toWei("10"),
        { from: buyer }
      );
      var after = await dexItem.sales(itemOwner);

      assert.strictEqual(before.toString(), web3.utils.toWei("0"));
      assert.strictEqual(
        after.toString(),
        (web3.utils.toWei("10") * 0.8).toString()
      );
      assert.notEqual(before, after);

      var logs = receipt.receipt.rawLogs; 
      assert.strictEqual(logs.length, 7);
    });

    it("can not buy item if already buy", async function() {
      var before = await token.balanceOf(itemOwner);
      await expectRevert(
        token.buy(
          dexItem.address,
          id,
          web3.utils.toWei("10"),
          { from: buyer }
        )
      );
      var after = await token.balanceOf(itemOwner);
      assert.strictEqual(before.toString(), after.toString());
    });

    it("can not buy item if price underpriced", async function() {
      var before = await token.balanceOf(buyer);
      await expectRevert(
        token.buy(dexItem.address, id, 2, { from: buyer })
      );
      var after = await token.balanceOf(buyer);
      assert.strictEqual(before.toString(), after.toString());
    });

    it("can not buy item if buyer don't have enough token", async function() {
      var before = await token.balanceOf(buyer);
      await expectRevert(
        token.buy(
          dexItem.address,
          id,
          web3.utils.toWei("100"),
          { from: buyer }
        )
      );
      var after = await token.balanceOf(buyer);
      assert.strictEqual(before.toString(), after.toString());
    });

    it("can not buy item if seller address is not address", async function() {
      var before = await token.balanceOf(buyer);
      await expectThrow(
        token.buy(web3.utils.fromAscii("1"), web3.utils.fromAscii("1"), 100, {
          from: buyer
        })
      );
      var after = await token.balanceOf(buyer);
      assert.strictEqual(before.toString(), after.toString());
    });

    it("not change storage if transfer failed", async function() {
      // initial hart with transfer require value == 1 to make buy failed
      const TestToken = require("./helpers/testToken.js");
      var haratokenTestContract = new web3.eth.Contract(TestToken.abi);
      var hartTest = await haratokenTestContract
        .deploy({
          data: TestToken.bytecode
        })
        .send({
          from: creator,
          gas: 4700000
        });
      await hartTest.methods.mint(buyer2, web3.utils.toWei("500")).send({
        from: creator
      });

      var before = await hartTest.methods.balanceOf(buyer).call();
      var beforeNonce = await hartTest.methods.receiptNonce().call();
      var beforeReceipt = await hartTest.methods.getReceipt(beforeNonce).call();

      await expectRevert(
        hartTest.methods
          .buy(ds.address, web3.utils.fromAscii("1"), web3.utils.toWei("100"))
          .send({ from: buyer2, gas: 4700000 })
      );

      var after = await hartTest.methods.balanceOf(buyer).call();
      var afterNonce = await hartTest.methods.receiptNonce().call();
      var afterReceipt = await hartTest.methods.getReceipt(afterNonce).call();

      assert.strictEqual(before.toString(), after.toString());
      assert.strictEqual(beforeNonce.toString(), afterNonce.toString());
      assert.strictEqual(beforeReceipt.toString(), afterReceipt.toString());
    });
  });

  describe("mint can be pause", async function() {
    it("set mint pause address by hart owner", async function() {
      var receipt = await token.setMintPauseAddress(mintPause, {
        from: creator
      });
      var newMintPauseAddress = await token.mintPauseAddress();
      var log = receipt.logs[0];
      assert.strictEqual(newMintPauseAddress, mintPause);
      assert.strictEqual(log.event, "MintPauseChangedLog");
      assert.strictEqual(log.args.mintPauseAddress, mintPause);
      assert.strictEqual(log.args.by, creator);
    });

    it("can not set mint pause address by not hart owner", async function() {
      await expectRevert(
        token.setMintPauseAddress(notMintPause, { from: notOwner })
      );
      var newMintPauseAddress = await token.mintPauseAddress();
      assert.strictEqual(newMintPauseAddress, mintPause);
      assert.notEqual(newMintPauseAddress, notMintPause);
    });

    it("set mint pause status by mint pause address", async function() {
      var receipt = await token.setIsMintPause(true, { from: mintPause });
      var newMintPauseStatus = await token.isMintPause();
      var log = receipt.logs[0];
      assert.strictEqual(newMintPauseStatus, true);
      assert.strictEqual(log.event, "MintPauseChangedLog");
      assert.strictEqual(log.args.status, true);
      assert.strictEqual(log.args.by, mintPause);
    });

    it("can not set mint pause status by not mint pause address", async function() {
      await expectRevert(token.setIsMintPause(false, { from: creator }));
      var newMintPauseStatus = await token.isMintPause();
      assert.strictEqual(newMintPauseStatus, true);
      assert.notEqual(newMintPauseStatus, false);
    });

    it("can not mint when mint pause status is true", async function() {
      var receiptBurn = await token.burnToken(
        web3.utils.toWei("25"),
        "1this is tes",
        { from: burner }
      );
      const logsBurn = receiptBurn.logs;

      var before = await token.balanceOf(burner);
      await expectRevert(
        token.mintToken(
          logsBurn[2].args.id.valueOf(),
          logsBurn[2].args.burner,
          logsBurn[2].args.value.valueOf(),
          logsBurn[2].args.hashDetails,
          2,
          { from: minter }
        )
      );
      var after = await token.balanceOf(burner);
      assert.strictEqual(before.toString(), after.toString());
    });
  });
});
