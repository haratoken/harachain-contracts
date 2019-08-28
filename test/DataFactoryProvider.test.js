const DataFactoryProvider = artifacts.require("DataFactoryProvider");
const DataFactoryContract = artifacts.require("DataFactory");
const DataProvider = artifacts.require("DataProviderRelation");
const DataStoreContract = artifacts.require("DataStore");

const expectRevert = require("./helpers/expectRevert");
const encoderDecoder = require("./helpers/encoderDecoder");
const logsDetail = require("./helpers/LogsHelper");

contract("DataFactoryProvider", accounts => {
  let datafactoryprovider;
  let dataprovider;
  let datafactory;
  let datastore1;
  let datastore2;
  let hart;

  const initSignature = web3.utils.keccak256("this is test");
  const initSignatureFunc = "keccak";

  const factoryRegistryOwner = accounts[0];
  const factoryOwner = accounts[0];
  const dataOwner = accounts[1];
  const notOwner = accounts[2];
  const providerOwner = accounts[3];
  const dummyHart = accounts[4];
  const dummyDFRegistry = accounts[5];
  const allowedAddress1 = accounts[6];

  const DataCreationLogTopic = logsDetail.DataFactory.DataCreationLogTopic;
  const DataCreationLogAbi = logsDetail.DataFactory.DataCreationLogAbi;

  //   const DataFactoryAddressChangedLogTopic = logsDetail.datafactoryprovider.DataFactoryAddressChangedLogTopic;
  //   const DataFactoryAddressChangedLogAbi = logsDetail.datafactoryprovider.DataFactoryAddressChangedLogAbi;

  //   const AllowedAddressLogTopic = logsDetail.datafactoryprovider.AllowedAddressLogTopic;
  //   const AllowedAddressLogAbi = logsDetail.datafactoryprovider.AllowedAddressLogAbi;

  before(async function() {
    // deploy hara token contract
    // var haratokenContract = new web3.eth.Contract(HaraToken.abi);
    // hart = await haratokenContract.deploy({
    //   data: HaraToken.bytecode
    // }).send({
    //   from: owner,
    //   gas: 4700000
    // });
    // initHartAddress = hart.options.address;

    // await hart.methods.mint(owner, web3.utils.toWei("1000")).send({
    //   from: owner
    // });
    // deploy datafactory
    datafactory = await DataFactoryContract.new(dummyHart, {
      from: factoryOwner
    });

    // deploy dataprovider
    dataprovider = await DataProvider.new({
      from: providerOwner
    });

    // create data contract for relation
    const receipt = await datafactory.storeData(
      dataOwner,
      dataprovider.address,
      initSignature,
      web3.utils.asciiToHex(initSignatureFunc),
      dummyDFRegistry,
      {
        from: allowedAddress1
      }
    );
    const logs = receipt.receipt.rawLogs;
    const DataCreationLog = encoderDecoder.decodeLogsByTopic(
      DataCreationLogTopic,
      DataCreationLogAbi,
      logs
    )[0];
    datastore1 = await DataStoreContract.at(
      DataCreationLog.contractDataAddress
    );

    // deplot datafactory provider
    datafactoryprovider = await DataFactoryProvider.new(
      datastore1.address,
      dataprovider.address,
      {
        from: factoryRegistryOwner
      }
    );

    // set datafactoryprovider as editor
    await datastore1.setEditor(datafactoryprovider.address, {from: dataOwner});
    
    // set provider proxy
    await dataprovider.setProxyAddress(datafactoryprovider.address, {from: providerOwner});
  });

  it("have owner", async function() {
    var owner = await datafactoryprovider.owner();
    assert.strictEqual(owner, factoryRegistryOwner);
  });

  it("store current data store", async function() {
    var ds = await datafactoryprovider.dataStore();
    assert.strictEqual(ds.toString(), datastore1.address);
  });

  it("store current data provider", async function() {
    var dp = await datafactoryprovider.dataProvider();
    assert.strictEqual(dp.toString(), dataprovider.address);
  });
    describe('new version', async function () {
      it('store new version signature and value', async function () {
        var receipt = await datafactoryprovider.addNewVersion(
          web3.utils.soliditySha3({t:'string',v:"1"}),
          web3.utils.keccak256("this is signature 1"),
          datastore1.address,
          "1",
          datastore1.address,
          "2",
          {from: factoryRegistryOwner }
        );
        
        const newSignature = await datastore1.getSignature(web3.utils.soliditySha3({t:'string',v:"1"}));
        assert.strictEqual(newSignature, web3.utils.keccak256("this is signature 1"));

        const newValue = await dataprovider.getUri(datastore1.address, "1");
        assert.strictEqual(newValue, datastore1.address + "2");
      });

      it('cannot set new version by not owner', async function () {
        await expectRevert(datafactoryprovider.addNewVersion(
          web3.utils.soliditySha3({t:'string',v:"2"}),
          web3.utils.keccak256("this is signature 2"),
          datastore1.address,
          web3.utils.soliditySha3({t:'string',v:"2"}),
          datastore1.address,
          "3",
          {from: notOwner }
        ));
        const newSignature = await datastore1.getSignature(web3.utils.soliditySha3({t:'string',v:"2"}));
        assert.notStrictEqual(newSignature, web3.utils.keccak256("this is signature 2"));

        const newValue = await dataprovider.getUri(datastore1.address, "2");
        assert.notStrictEqual(newValue, datastore1.address + "3");
      });
    });
});
