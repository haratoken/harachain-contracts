const expectRevert = require("./helpers/expectRevert");
const encoderDecoder = require("./helpers/encoderDecoder")
const logs = require("./helpers/LogsHelper")

const DataProviderRegistry = artifacts.require('DataProviderRegistry');
const DataProvider = artifacts.require("DataProviderHara");
const HaraTokenPrivate = artifacts.require("HaraTokenPrivate");

contract('DataProviderRegistry', accounts => {
  let dataProviderRegistry;
  let dataProvider;
  let hart;

  const owner = accounts[0];
  const notOwner = accounts[1];
  const auditor1 = accounts[2];
  const auditor2 = accounts[3];
  const dataProvider1 = accounts[4];
  const dataProvider2 = accounts[5];

  before(async function () {
    hart = await HaraTokenPrivate.new({
      from: owner
    });
    await hart.mint(owner, web3.utils.toWei("1000"), {
      from: owner
    });

    dataProviderRegistry = await DataProviderRegistry.new(hart.address, {
      from: owner
    });

    dataProvider = await DataProvider.new({
      from: dataProvider1
    });
  });

  it('have owner', async function () {
    const contractOwner = await dataProviderRegistry.owner();
    assert.strictEqual(contractOwner, owner);
  });

  it('can not add editor by not owner', async function () {
    await expectRevert(
      dataProviderRegistry.addAuditor(auditor1, {
        from: notOwner
      })
    );
  });

  it('can add editor by owner', async function () {
    await dataProviderRegistry.addAuditor(auditor1, {
      from: owner
    });
    const totalAuditor1 = await dataProviderRegistry.totalAuditors();
    const currentAuditor1 = await dataProviderRegistry.auditors(auditor1);
    assert.strictEqual(totalAuditor1.toString(), "1");
    assert.strictEqual(currentAuditor1, true);

    await dataProviderRegistry.addAuditor(auditor2, {
      from: owner
    });
    const totalAuditor2 = await dataProviderRegistry.totalAuditors();
    const currentAuditor2 = await dataProviderRegistry.auditors(auditor2);
    assert.strictEqual(totalAuditor2.toString(), "2");
    assert.strictEqual(currentAuditor2, true);
  });

  it('can give score to data provider by auditor', async function () {
    await dataProviderRegistry.scoreDataProvider(dataProvider1, 10, {
      from: auditor1
    });
    const testScore = await dataProviderRegistry.scores(dataProvider1, auditor1, {
      from: owner
    });
    assert.strictEqual(testScore.toString(), "10");
  });

  it('can remove editor by owner', async function () {
    await dataProviderRegistry.removeAuditor(auditor2, {
      from: owner
    });
    const totalAuditor = await dataProviderRegistry.totalAuditors();
    const currentAuditor = await dataProviderRegistry.auditors(auditor2);
    assert.strictEqual(totalAuditor.toString(), "1");
    assert.strictEqual(currentAuditor, false);
    assert.notEqual(currentAuditor, true);
  });

  describe('register new data provider', async function () {
    let registerId;

    before(async function () {
      await hart.transfer(dataProvider1, web3.utils.toWei("10"), {
        from: owner
      });
    });

    it('can set sale by owner', async function () {
      var reciept = await dataProviderRegistry.setSale(true, {
        from: owner
      });
      var log = reciept.logs[0];

      var saleStatus = await dataProviderRegistry.isSale(web3.utils.fromAscii(""));
      assert.strictEqual(saleStatus, true)
    });

    it('can not set sale by not owner', async function () {
      await expectRevert(
        dataProviderRegistry.setSale(true, {
          from: notOwner
        })
      );
    });

    it('can set price without data provider by owner', async function () {
      var reciept = await dataProviderRegistry.setPrice(web3.utils.toWei("1"), {
        from: owner
      });
      var log = reciept.logs[0];

      var regisFee = await dataProviderRegistry.getPrice(web3.utils.fromAscii(""));
      assert.strictEqual(regisFee.toString(), web3.utils.toWei("1").toString());
    });

    it('can set price without data provider by owner', async function () {
      var reciept = await dataProviderRegistry.setPrice(web3.utils.padLeft(dataProvider2, 64), web3.utils.toWei("1"), {
        from: owner
      });
      var log = reciept.logs[0];

      var regisFee = await dataProviderRegistry.getPrice(web3.utils.padLeft(dataProvider2, 64));
      assert.strictEqual(regisFee.toString(), web3.utils.toWei("1").toString());
    });

    it('can not set price by not owner', async function () {
      await expectRevert(
        dataProviderRegistry.setPrice(web3.utils.fromAscii(""), web3.utils.toWei("1"), {
          from: notOwner
        })
      );
    });

    it('can register new data provider by owner', async function () {
      var reciept = await dataProviderRegistry.register(dataProvider.address, {
        from: dataProvider1
      });
      var log = reciept.logs[0];
      assert.strictEqual(log.event, "RegisterDataProviderLog");
      assert.strictEqual(log.args.__length__, 3);
      assert.strictEqual(log.args.registerId, web3.utils.padLeft(dataProvider.address.toLowerCase(), 64));
      assert.strictEqual(log.args.by, dataProvider1);
      assert.strictEqual(log.args.dataProvider, dataProvider.address);

      registerId = log.args.registerId;
    });

    it('can buy to register data provider', async function () {
      var receipt = await hart.buy(dataProviderRegistry.address, registerId, web3.utils.toWei("1"), {
        from: dataProvider1
      });

      const RegisterCompletedLog = encoderDecoder.decodeLogsByTopic(logs.DataProviderRegistry.RegisterCompletedLogTopic,
        logs.DataProviderRegistry.RegisterCompletedLogAbi, receipt.receipt.logs)[0];
      assert.strictEqual(receipt.receipt.logs.length, 5);
      assert.strictEqual(RegisterCompletedLog.__length__, 3);
      assert.strictEqual(RegisterCompletedLog.registerId, web3.utils.padLeft(dataProvider.address, 64).toLowerCase());
      assert.strictEqual(RegisterCompletedLog.by, dataProvider1);
      assert.strictEqual(RegisterCompletedLog.feeValue.toString(), web3.utils.toWei("1").toString());

      var dataProviderStatus = await dataProviderRegistry.isRegister(dataProvider.address);
      assert.strictEqual(dataProviderStatus, true);

      var dataProviderBalance = await dataProviderRegistry.providerBalances(dataProvider.address);
      var dataProviderRegistryBalance = await hart.balanceOf(dataProviderRegistry.address);
      assert.strictEqual(dataProviderRegistryBalance.toString(), web3.utils.toWei("1").toString());
      assert.strictEqual(dataProviderBalance.toString(), web3.utils.toWei("1").toString());
      
      var totalProvider = await dataProviderRegistry.totalProvider();
      assert.strictEqual(totalProvider.toString(), "1");
    });
  });
  describe('remove data provider', async function () {

    it('can not remove data provider by not owner', async function () {
      await expectRevert(
        dataProviderRegistry.removeDataProvider(dataProvider.address, {
          from: notOwner
        })
      );
      var dataProviderStatus = await dataProviderRegistry.isRegister(dataProvider.address);
      assert.strictEqual(dataProviderStatus, true);

      var dataProviderBalance = await dataProviderRegistry.providerBalances(dataProvider.address);
      var dataProviderRegistryBalance = await hart.balanceOf(dataProviderRegistry.address);
      assert.strictEqual(dataProviderRegistryBalance.toString(), web3.utils.toWei("1").toString());
      assert.strictEqual(dataProviderBalance.toString(), web3.utils.toWei("1").toString());
      
      var totalProvider = await dataProviderRegistry.totalProvider();
      assert.strictEqual(totalProvider.toString(), "1");
    });

    it('can remove data provider by owner', async function () {
      var balanceBefore = await hart.balanceOf(dataProvider1) / 1000000000;
      var reciept = await dataProviderRegistry.removeDataProvider(dataProvider.address, {
        from: owner
      });
      console.log(reciept);
      var log = reciept.logs[0];

      var dataProviderStatus = await dataProviderRegistry.isRegister(dataProvider.address);
      assert.strictEqual(dataProviderStatus, false);

      var dataProviderBalance = await dataProviderRegistry.providerBalances(dataProvider.address);
      var dataProviderRegistryBalance = await hart.balanceOf(dataProviderRegistry.address);
      assert.strictEqual(dataProviderRegistryBalance.toString(), web3.utils.toWei("0").toString());
      assert.strictEqual(dataProviderBalance.toString(), web3.utils.toWei("0").toString());
      
      var totalProvider = await dataProviderRegistry.totalProvider();
      assert.strictEqual(totalProvider.toString(), "0");

      var balanceAfter = await hart.balanceOf(dataProvider1) / 1000000000;
      assert.strictEqual((balanceAfter - balanceBefore).toString(), (web3.utils.toWei("1")  / 1000000000).toString());
    });
  });
});