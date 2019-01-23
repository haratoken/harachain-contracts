const DataFactoryRegistryContract = artifacts.require('DataFactoryRegistry');
const DataFactoryContract = artifacts.require('DataFactory');
const DataStoreContract = artifacts.require('DataStore');
const HaraToken = artifacts.require('HaraTokenPrivate');

const expectRevert = require("./helpers/expectRevert");
const encoderDecoder = require("./helpers/encoderDecoder");
const logsDetail = require("./helpers/LogsHelper");

contract('DataFactoryRegistry', accounts => {
  let datafactoryregistry;
  let datafactory;
  let datastore1;
  let datastore2;
  let hart;
  let initHartAddress;

  const initLocation = web3.utils.toChecksumAddress("0xca35b7d915458ef540ade6068dfe2f44e8fa733c");
  const initSignature = "0x430dec04b9ebe807ce8fb9b0d025861c13f5e36f226c12469ff6f89fb217fa9f";
  const initSignatureFunc = "keccak";

  const factoryRegistryOwner = accounts[0];
  const factoryOwner = accounts[0];
  const dataOwner = accounts[1];
  const notOwner = accounts[2];
  const owner = accounts[3]; // hart owner
  const otherDataOwner1 = accounts[4];

  const DataCreationLogTopic = logsDetail.DataFactory.DataCreationLogTopic;
  const DataCreationLogAbi = logsDetail.DataFactory.DataCreationLogAbi;

  const DataFactoryAddressChangedLogTopic = logsDetail.DataFactoryRegistry.DataFactoryAddressChangedLogTopic;
  const DataFactoryAddressChangedLogAbi = logsDetail.DataFactoryRegistry.DataFactoryAddressChangedLogAbi;

  before(async function () {
    // deploy hara token contract
    var haratokenContract = new web3.eth.Contract(HaraToken.abi);
    hart = await haratokenContract.deploy({
      data: HaraToken.bytecode
    }).send({
      from: owner,
      gas: 4700000
    });
    initHartAddress = hart.options.address;

    await hart.methods.mint(owner, web3.utils.toWei("1000")).send({
      from: owner
    });

    datafactory = await DataFactoryContract.new(
      initHartAddress, {
        from: factoryOwner
      });

    datafactoryregistry = await DataFactoryRegistryContract.new(
      datafactory.address, {
        from: factoryRegistryOwner
      });
  });

  it('have owner', async function () {
    var owner = await datafactoryregistry.owner();
    assert.strictEqual(owner, factoryRegistryOwner);
  });

  it('have hara percentage', async function () {
    var percent = await datafactoryregistry.getPercentage(0);
    assert.strictEqual(percent.toString(), "15");
  });

  it('have data provider percentage', async function () {
    var percent = await datafactoryregistry.getPercentage(1);
    assert.strictEqual(percent.toString(), "5");
  });

  it('store current data factory', async function () {
    var percent = await datafactoryregistry.dataFactory();
    assert.strictEqual(percent.toString(), datafactory.address);
  });

  describe('create data store contract with signature function', async function () {
    before(async function () {
      var receipt = await datafactoryregistry.storeData(
        dataOwner,
        initLocation,
        web3.utils.asciiToHex(initSignature),
        web3.utils.asciiToHex(initSignatureFunc), {
          from: dataOwner
        }
      );
      const logs = receipt.receipt.rawLogs
      const DataCreationLog = encoderDecoder.decodeLogsByTopic(DataCreationLogTopic, DataCreationLogAbi, logs)[0];
      datastore1 = await DataStoreContract.at(DataCreationLog.contractDataAddress);
    });

    it('owned by owner', async function () {
      var isOwner = await datastore1.isOwner({
        from: dataOwner
      });
      assert.strictEqual(isOwner, true);
    });

    it('store data owner address', async function () {
      var owner = await datastore1.owner();
      assert.strictEqual(owner, dataOwner);
    });

    it('store data location', async function () {
      var dataLocation = await datastore1.location();
      assert.strictEqual(dataLocation, initLocation);
    });

    it('store data signature', async function () {
      var dataSignature = await datastore1.signature();
      assert.strictEqual(web3.utils.hexToAscii(dataSignature), initSignature);
    });

    it('store data signature function', async function () {
      var dataSignatureFunc = await datastore1.signatureFunc();
      assert.strictEqual(web3.utils.hexToAscii(dataSignatureFunc), initSignatureFunc);
    });
  });

  describe('create data store contract without signature function', async function () {
    before(async function () {
      var receipt = await datafactoryregistry.storeData2(
        otherDataOwner1,
        initLocation,
        web3.utils.asciiToHex(initSignature), {
          from: otherDataOwner1
        }
      );
      const logs = receipt.receipt.rawLogs
      const DataCreationLog = encoderDecoder.decodeLogsByTopic(DataCreationLogTopic, DataCreationLogAbi, logs)[0];
      datastore2 = await DataStoreContract.at(DataCreationLog.contractDataAddress);
    });

    it('owned by owner', async function () {
      var isOwner = await datastore2.isOwner({
        from: otherDataOwner1
      });
      assert.strictEqual(isOwner, true);
    });

    it('store data owner address', async function () {
      var owner = await datastore2.owner();
      assert.strictEqual(owner, otherDataOwner1);
    });

    it('store data location', async function () {
      var dataLocation = await datastore2.location();
      assert.strictEqual(dataLocation, initLocation);
    });

    it('store data signature', async function () {
      var dataSignature = await datastore2.signature();
      assert.strictEqual(web3.utils.hexToAscii(dataSignature), initSignature);
    });

    it('store data signature function', async function () {
      var dataSignatureFunc = await datastore2.signatureFunc();
      assert.strictEqual(web3.utils.hexToAscii(dataSignatureFunc), initSignatureFunc);
    });
  });

  describe('data creation storage', async function () {
    it('store specific owner data id', async function () {
      var dataTotal1 = await datafactoryregistry.getDataTotalByOwner(dataOwner, {
        from: factoryOwner
      });
      assert.strictEqual(dataTotal1.toNumber(), 1);
      var dataTotal2 = await datafactoryregistry.getDataTotalByOwner(otherDataOwner1, {
        from: factoryOwner
      });
      assert.strictEqual(dataTotal2.toNumber(), 1);
    });

    it('store specific data contract address of owner', async function () {
      assert.strictEqual(
        await datafactoryregistry.getDataAddressByOwner(dataOwner, 0),
        datastore1.address
      );
      assert.strictEqual(
        await datafactoryregistry.getDataAddressByOwner(otherDataOwner1, 0),
        datastore2.address
      );
    })
  });

  describe('stored percentage fee', async function () {
    it('store data factory owner as haraAddress', async function () {
      var haraAddress = await datafactoryregistry.haraAddress();
      assert.strictEqual(haraAddress, factoryOwner);
    });

    it('store hara percentage', async function () {
      var haraPercentage = await datafactoryregistry.haraPercentage();
      assert.strictEqual(haraPercentage.toString(), "15");
    });

    it('store data provider percentage', async function () {
      var dataProviderPercentage = await datafactoryregistry.dataProviderPercentage();
      assert.strictEqual(dataProviderPercentage.toString(), "5");
    });

    it('set hara percentage', async function () {
      var changedReciept = await datafactoryregistry.setPercentage(0, 10, {
        from: factoryOwner
      });
      var haraPercentage = await datafactoryregistry.haraPercentage();
      assert.strictEqual(haraPercentage.toString(), "10");

      var log = changedReciept.logs[0];
      assert.strictEqual(log.event, "PercentageChanged");
      assert.strictEqual(log.args.who.toString(), "0");
      assert.strictEqual(log.args.oldPercentage.toString(), "15");
      assert.strictEqual(log.args.newPercentage.toString(), "10");
    });

    it('set data provider percentage', async function () {
      var changedReciept = await datafactoryregistry.setPercentage(1, 10, {
        from: factoryOwner
      });
      var dataProviderPercentage = await datafactoryregistry.dataProviderPercentage();
      assert.strictEqual(dataProviderPercentage.toString(), "10");

      var log = changedReciept.logs[0];
      assert.strictEqual(log.event, "PercentageChanged");
      assert.strictEqual(log.args.who.toString(), "1");
      assert.strictEqual(log.args.oldPercentage.toString(), "5");
      assert.strictEqual(log.args.newPercentage.toString(), "10");
    });

    it('revert when not owner owo call set percentage function', async function () {
      await expectRevert(
        datafactoryregistry.setPercentage(1, 10, {
          from: notOwner
        })
      );
    });

    it('revert when set percentage type is not 0 or 1', async function () {
      await expectRevert(
        datafactoryregistry.setPercentage(3, 10, {
          from: factoryOwner
        })
      );
    });
    it('revert when get percentage type is not 0 or 1', async function () {
      await expectRevert(
        datafactoryregistry.getPercentage(3, 10, {
          from: factoryOwner
        })
      );
    });
  });

  describe('data creation storage', async function () {
    it('store specific owner data id', async function () {
      var dataTotal1 = await datafactoryregistry.getDataTotalByOwner(dataOwner, {
        from: factoryOwner
      });
      assert.strictEqual(dataTotal1.toNumber(), 1);
      var dataTotal2 = await datafactoryregistry.getDataTotalByOwner(otherDataOwner1, {
        from: factoryOwner
      });
      assert.strictEqual(dataTotal2.toNumber(), 1);
    });

    it('store specific data contract address of owner', async function () {
      assert.strictEqual(
        await datafactoryregistry.getDataAddressByOwner(dataOwner, 0),
        datastore1.address
      );
      assert.strictEqual(
        await datafactoryregistry.getDataAddressByOwner(otherDataOwner1, 0),
        datastore2.address
      );
    });
  });
  describe('change data factory address on registry contract', async function () {
    let dataFactoryNew;

    before(async function () {
      dataFactoryNew = await DataFactoryContract.new(
        initHartAddress, {
          from: factoryOwner
        });
    });
    it('change address', async function () {
      var receipt = await datafactoryregistry.setDataFactoryAddress(dataFactoryNew.address, {
        from: factoryOwner
      });
      const logs = receipt.receipt.rawLogs;
      const log = encoderDecoder.decodeLogsByTopic(DataFactoryAddressChangedLogTopic, DataFactoryAddressChangedLogAbi, logs)[0];
      assert.strictEqual(logs.length, 1)
      assert.strictEqual(log.who, factoryOwner);
      assert.strictEqual(log.oldAddress, datafactory.address);
      assert.strictEqual(log.newAddress, dataFactoryNew.address);
    });
  });
});