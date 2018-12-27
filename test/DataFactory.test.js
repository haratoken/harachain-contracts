const DataFactoryContract = artifacts.require('DataFactory');
const DataStoreContract = artifacts.require('DataStore');
const HaraToken = artifacts.require('HaraTokenPrivate');
const encoderDecoder = require("./helpers/encoderDecoder")
const expectRevert = require("./helpers/expectRevert")
const expectContractNotExists = require("./helpers/expectContractNotExists")


contract('DataFactory', accounts => {
let datafactory;
let datastore1;
let datastore2;
let hart;
let initHartAddress;

const initLocation = web3.utils.toChecksumAddress("0xca35b7d915458ef540ade6068dfe2f44e8fa733c");
const initSignature = "0x430dec04b9ebe807ce8fb9b0d025861c13f5e36f226c12469ff6f89fb217fa9f";
const initSignatureFunc = "keccak";

const factoryOwner = accounts[0];
const dataOwner = accounts[1];
const notOwner = accounts[2];
const owner = accounts[3]; // hart owner
const otherDataOwner1 = accounts[4];

const DataCreationLogTopic = "0xba4eef7a56e3b8bee912b9f8f83435cf9021729f21d02a5abc46aa90e0940305";
const DataCreationLogAbi = [{
  "indexed": false,
  "name": "contractDataAddress",
  "type": "address"
}, {
  "indexed": false,
  "name": "owner",
  "type": "address"
}, {
  "indexed": false,
  "name": "location",
  "type": "address"
}, {
  "indexed": false,
  "name": "signature",
  "type": "bytes"
}, {
  "indexed": false,
  "name": "signatureFunc",
  "type": "bytes"
}];

before(async function () {
  // deploy hara token contract
  var haratokenContract = new web3.eth.Contract(HaraToken.abi);
  hart = await haratokenContract.deploy({
    data: HaraToken.bytecode
  }).send({
    from: owner,
    gas: 4700000
  });
  initHartAddress = hart.addrress;

  await hart.methods.mint(owner, web3.utils.toWei("1000")).send({
    from: owner
  });
  datafactory = await DataFactoryContract.new(
    initHartAddress, {
      from: factoryOwner
    });
});

describe('create data store contract with signature function', async function () {
  before(async function () {
    var receipt = await datafactory.storeData(
      dataOwner,
      initLocation,
      web3.utils.asciiToHex(initSignature),
      web3.utils.asciiToHex(initSignatureFunc), {
        from: dataOwner
      }
    );
    const logs = receipt.receipt.logs
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
    var receipt = await datafactory.storeData(
      otherDataOwner1,
      initLocation,
      web3.utils.asciiToHex(initSignature), {
        from: otherDataOwner1
      }
    );
    const logs = receipt.receipt.logs
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
});