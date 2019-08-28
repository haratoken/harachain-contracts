const DataStoreContract = artifacts.require('DataStore');
const DataFactory = artifacts.require('DataFactory');
const DataFactoryRegistry = artifacts.require('DataFactoryRegistry');
const AdvancedPrice= artifacts.require('AdvancedPrice');
const HaraToken = artifacts.require('HaraTokenPrivate');
const AttestContract = artifacts.require('AttestContract');

const expectRevert = require("./helpers/expectRevert")
const expectContractNotExists = require("./helpers/expectContractNotExists")
const encoderDecoder = require("./helpers/encoderDecoder")

contract('AttestContract', accounts => {
  let datastore;
  let dataFactory;
  let dataFactoryRegistry;
  let hart;

  const initLocation = web3.utils.toChecksumAddress("0xca35b7d915458ef540ade6068dfe2f44e8fa733c") ;
  const initSignature = "0x430dec04b9ebe807ce8fb9b0d025861c13f5e36f226c12469ff6f89fb217fa9f";
  const initSignatureFunc = "keccak";
  
  const initExpiredTime = new Date("Wed, 8 May 2019 13:30:00").getTime();
  const newExpiredTime = new Date("Wed, 12 July 2025 13:30:00").getTime();

  const initVersion = web3.utils.toHex(12).padEnd(66,'0');
  const initTopic = web3.utils.fromAscii('ktp').padEnd(66, '0');    //bytes32("lahan")
  const initTopic2 = web3.utils.fromAscii('lahan').padEnd(66, '0'); //bytes32("ktp")
  const initValue = web3.utils.fromAscii('ok').padEnd(66, '0');//bytes32("ok")
  const newValue = web3.utils.fromAscii('foto ktp kurang jelas').padEnd(66, '0'); //bytes32("foto ktp kurang jelas")

  const dataOwner = accounts[0];
  const notOwner = accounts[1];
  const owner = accounts[2]; // hart owner
  const attestOwner = accounts[3]; //attest owner
  var dataStoreContractAddress;

  before(async function () {
    // deploy hara token contract
    var haratokenContract = new web3.eth.Contract(HaraToken.abi);
    hart = await haratokenContract.deploy({
        data: HaraToken.bytecode
    }).send({
        from: owner,
        gas: 4700000
    });

    await hart.methods.mint(owner, web3.utils.toWei("1000")).send({from:owner});

    // deploy data factory contract
    dataFactory = await DataFactory.new( 
      hart.options.address,
      { from: owner } ); 
    
    dataFactoryRegistry = await DataFactoryRegistry.new( 
      dataFactory.address,
      { from: owner } ); 
    
    attestcontract = await AttestContract.new({from: attestOwner});

    datastore = await DataStoreContract.new( 
      dataOwner, 
      initLocation, 
      web3.utils.asciiToHex(initSignature),
      web3.utils.asciiToHex(initSignatureFunc),
      dataFactoryRegistry.address,
      { from: dataOwner } ); 

  });

  describe('test ownable contract', async function(){
    it('has one owner', async function(){
      var tempOwner = await attestcontract.owner();
      assert.strictEqual(tempOwner, attestOwner);
    });
    it('can change owner', async function(){
      await attestcontract.transferOwnership(notOwner,{from:attestOwner});
      var newOwner = await attestcontract.owner();
      assert.strictEqual(newOwner, notOwner);
    });
  });

  describe('add additional data and details', async function(){
    it('can add date data by owner', async function(){
      var receipt = await datastore.setMetadata(web3.utils.asciiToHex("date"), web3.utils.asciiToHex("2018-08-15T10:48:56.485Z"), {from:dataOwner})
      var dataDate = await datastore.getMetadata(web3.utils.asciiToHex("date"));
      assert.strictEqual(web3.utils.hexToAscii(dataDate).replace(/\u0000/g, ''), "2018-08-15T10:48:56.485Z");

      var log = receipt.logs[0];
      assert.strictEqual(log.event, "MetadataLog");
      assert.strictEqual(web3.utils.hexToAscii(log.args.keyMetadata).replace(/\u0000/g, ''), "date");
      assert.strictEqual(web3.utils.hexToAscii(log.args.valueMetadata).replace(/\u0000/g, ''), "2018-08-15T10:48:56.485Z");
    });
  });

  describe('Attestation Test', async function(){
    let receipt;
    let AttestActionLog;
    let AttestLog;
    let WhoAttestLog;
    let concatedBytes;
    let encryptedBytes;

    before(async function(){
      dataStoreContractAddress = datastore.address;
      receipt = await attestcontract.attest(initVersion, dataStoreContractAddress, initTopic, initValue, initExpiredTime, {from:owner});
      AttestResultLog = receipt.receipt.logs[0].args;
      AttestActionLog = receipt.receipt.logs[1].args;
      WhoAttestLog = receipt.receipt.logs[2].args;
      AttestLog = receipt.receipt.logs[3].args;
      concatedBytes = "0x" + web3.utils.numberToHex(initVersion).slice(2).padStart(16, '0') + dataStoreContractAddress.slice(2).toLowerCase() + initTopic.slice(2) + owner.slice(2).toLowerCase();
      encryptedBytes = web3.utils.keccak256(concatedBytes);
    });

    it('AttestActionLog is working', async function(){
      assert.strictEqual(AttestActionLog.encryptedBytes , encryptedBytes );
      assert.strictEqual(AttestActionLog.version, initVersion );
      assert.strictEqual(AttestActionLog.itemAddress , dataStoreContractAddress );
      assert.strictEqual(AttestActionLog.topic , initTopic );
      assert.strictEqual(AttestActionLog.attestor , owner );
      assert.strictEqual(AttestActionLog.value , initValue );
      assert.strictEqual(parseInt(AttestActionLog.expiredTime) , initExpiredTime );
    });

    it('WhoAttestLog is working', async function(){
      assert.strictEqual(WhoAttestLog.encryptedBytes , encryptedBytes );
      assert.strictEqual(WhoAttestLog.version, initVersion );
      assert.strictEqual(WhoAttestLog.itemAddress , dataStoreContractAddress );
      assert.strictEqual(WhoAttestLog.topic , initTopic );
      assert.strictEqual(WhoAttestLog.attestor , owner );
    });

    it('AttestLog is working', async function(){
      assert.strictEqual(AttestLog.encryptedBytes , encryptedBytes );
      assert.strictEqual(AttestLog.version, initVersion );
      assert.strictEqual(AttestLog.itemAddress , dataStoreContractAddress );
      assert.strictEqual(AttestLog.topic , initTopic );
      assert.strictEqual(AttestLog.attestor , owner );
    });

    it('getters are working', async function(){
        var resultValue = await attestcontract.getValue(initVersion, dataStoreContractAddress, initTopic, owner);
        var resultExpiredTime = await attestcontract.getExpiredTime(initVersion, dataStoreContractAddress, initTopic, owner);
        assert.strictEqual(resultValue,initValue);
        assert.strictEqual(parseInt(resultExpiredTime), initExpiredTime);
      });
  });

  describe('Overwrite Attestment', async function(){
    let receipt;
    let encryptedBytes;
    let AttestResultLog;
    before(async function(){
      dataStoreContractAddress = datastore.address;
      receipt = await attestcontract.attest(initVersion, dataStoreContractAddress, initTopic2, initValue, initExpiredTime, {from:owner});
      AttestResultLog = receipt.receipt.logs[0].args;
    });

    it('can overwrite value', async function(){
      receipt = await attestcontract.attest(initVersion, dataStoreContractAddress, initTopic2, newValue, initExpiredTime, {from:owner});
      var resultValue = await attestcontract.getValue(initVersion, dataStoreContractAddress, initTopic2, owner);
      var resultExpiredTime = await attestcontract.getExpiredTime(initVersion, dataStoreContractAddress, initTopic2, owner);
      assert.strictEqual(resultValue, newValue);
      assert.strictEqual(parseInt(resultExpiredTime), initExpiredTime);
    });

    it('AttestResultLog is working', async function(){
      var concatedBytes = "0x" + web3.utils.numberToHex(initVersion).slice(2).padStart(16, '0') + dataStoreContractAddress.slice(2).toLowerCase() + initTopic2.slice(2) + owner.slice(2).toLowerCase();
      encryptedBytes = web3.utils.keccak256(concatedBytes);
      AttestResultLog = receipt.receipt.logs[0].args;
      assert.strictEqual(AttestResultLog.encryptedBytes , encryptedBytes );
      assert.strictEqual(AttestResultLog.prevValue , initValue );
      assert.strictEqual(AttestResultLog.newValue , newValue );
      assert.strictEqual(parseInt(AttestResultLog.prevExpiredTime) , initExpiredTime );
      assert.strictEqual(parseInt(AttestResultLog.newExpiredTime) , initExpiredTime );
    });
    
    it('can overwrite expired time', async function(){
      receipt = await attestcontract.attest(initVersion, dataStoreContractAddress, initTopic2, newValue, newExpiredTime, {from:owner});
      var resultValue = await attestcontract.getValue(initVersion, dataStoreContractAddress, initTopic2, owner);
      var resultExpiredTime = await attestcontract.getExpiredTime(initVersion, dataStoreContractAddress, initTopic2, owner);
      assert.strictEqual(resultValue, newValue);
      assert.strictEqual(parseInt(resultExpiredTime), newExpiredTime);
    });

    it('AttestResultLog is working(2)', async function(){
      var concatedBytes = "0x" + web3.utils.numberToHex(initVersion).slice(2).padStart(16, '0') + dataStoreContractAddress.slice(2).toLowerCase() + initTopic2.slice(2) + owner.slice(2).toLowerCase();
      encryptedBytes = web3.utils.keccak256(concatedBytes);
      AttestResultLog = receipt.receipt.logs[0].args;
      assert.strictEqual(AttestResultLog.encryptedBytes , encryptedBytes );
      assert.strictEqual(AttestResultLog.prevValue , newValue );
      assert.strictEqual(AttestResultLog.newValue , newValue );
      assert.strictEqual(parseInt(AttestResultLog.prevExpiredTime) , initExpiredTime );
      assert.strictEqual(parseInt(AttestResultLog.newExpiredTime) , newExpiredTime );
    });
  });  

  describe('EIP 780 Implementation' , async()=>{
    let newValue2, newTopic;
    before(async ()=>{
      newValue2 = web3.utils.fromAscii('Data is valid').padEnd(66, '0'); 
      newTopic = web3.utils.fromAscii('validation').padEnd(66, '0');
      receipt = await attestcontract.setClaim(dataStoreContractAddress, newTopic, newValue2, {from:owner});
    });

    it('can getClaim', async ()=>{
      const value = await attestcontract.getClaim(owner, dataStoreContractAddress, newTopic, {from:owner});
      assert.strictEqual(value, newValue2);
    });

    it('revert removeClaim', async()=>{
      await expectRevert( attestcontract.removeClaim(owner, dataStoreContractAddress, newTopic, {from: notOwner})  );
      // expectRevert(await attestcontract.removeClaim(owner, dataStoreContractAddress, newTopic,{from: owner})  );
    });

    it('removeClaim', async ()=>{
      await attestcontract.removeClaim( owner, dataStoreContractAddress, newTopic, {from:owner});
      const value = await attestcontract.getClaim(owner, dataStoreContractAddress, newTopic, {from:owner});
      assert.strictEqual(value, web3.utils.asciiToHex('').padEnd(66,'0'));
    });

  });

});