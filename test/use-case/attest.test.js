const DataFactoryRegistryContract = artifacts.require("DataFactoryRegistry");
const DataFactoryContract = artifacts.require("DataFactory");
const DataStoreContract = artifacts.require("DataStore");
const HaraToken = artifacts.require("HaraTokenPrivate");
const DataProviderNull = artifacts.require("DataProviderNull");
const DataFactoryProvider = artifacts.require("DataFactoryProvider"); // the wina
const DataProviderRelation = artifacts.require("DataProviderRelation");
const Attest = artifacts.require("AttestContract");

const expectRevert = require("./../helpers/expectRevert");
const encoderDecoder = require("./../helpers/encoderDecoder");
const logsDetail = require("./../helpers/LogsHelper");

contract("Use case for attestation", accounts => {
  let datafactoryregistry;
  let datafactory;
  let datastoreA;
  let datastoreB;
  let datastoreC;
  let datastoreD;
  let datastoreE;
  let datastoreRelation;
  let hart;
  let dataprovidernull;
  let dataproviderrelation;
  let initHartAddress;
  let attestContract;
  let datafactoryprovider;

  const initSignature =
    "0x430dec04b9ebe807ce8fb9b0d025861c13f5e36f226c12469ff6f89fb217fa9f";
  const initSignatureFunc = "keccak";

  const initVersion = web3.utils.toHex(12).padEnd(66, "0");
  const initTopic1 = web3.utils.fromAscii("ktp").padEnd(66, "0"); //bytes32("lahan")
  const initTopic2 = web3.utils.fromAscii("lahan").padEnd(66, "0"); //bytes32("ktp")
  const initValue = web3.utils.fromAscii("ok").padEnd(66, "0"); //bytes32("ok")
  const initExpiredTime = new Date("Wed, 8 May 2019 13:30:00").getTime();

  const contractOwner = accounts[0];
  const dataOwner1 = accounts[1];
  const dataOwner2 = accounts[2];
  const notOwner = accounts[3];
  const hara = accounts[4];

  const DataCreationLogTopic = logsDetail.DataFactory.DataCreationLogTopic;
  const DataCreationLogAbi = logsDetail.DataFactory.DataCreationLogAbi;

  const SignatureLogTopic =
    logsDetail.DataStore.SignatureLogTopic;
  const SignatureLogAbi =
    logsDetail.DataStore.SignatureLogAbi;

  const EndpointChangedLogTopic =
    logsDetail.DataProviderRelation.EndpointChangedLogTopic;
  const EndpointChangedLogAbi =
    logsDetail.DataProviderRelation.EndpointChangedLogAbi;

    const RelationCreatedLogTopic =
    logsDetail.DataFactoryProvider.RelationCreatedLogTopic;
  const RelationCreatedLogAbi =
    logsDetail.DataFactoryProvider.RelationCreatedLogAbi;

  before(async () => {
    // deploy hara token contract
    var haratokenContract = new web3.eth.Contract(HaraToken.abi);
    hart = await haratokenContract
      .deploy({
        data: HaraToken.bytecode
      })
      .send({
        from: contractOwner,
        gas: 4700000
      });
    initHartAddress = hart.options.address;

    await hart.methods.mint(contractOwner, web3.utils.toWei("1000")).send({
      from: contractOwner
    });

    // deploy data factory
    datafactory = await DataFactoryContract.new(initHartAddress, {
      from: contractOwner
    });

    // deploy contract factory registry
    datafactoryregistry = await DataFactoryRegistryContract.new(
      datafactory.address,
      {
        from: contractOwner
      }
    );

    // set allowed address to store data at data factory registry contract
    await datafactoryregistry.addAllowedAddress(hara, { from: contractOwner });

    // deploy data provider null
    dataprovidernull = await DataProviderNull.new({
      from: contractOwner
    });

    // deploy data provider relation
    dataproviderrelation = await DataProviderRelation.new({
      from: contractOwner
    });

    // deploy attest contract
    attestContract = await Attest.new({
      from: contractOwner
    });
  });

  describe("Upload: data A, B, C, owned by owner1", async () => {
    it("create data A with owner 1", async () => {
      var receipt = await datafactoryregistry.storeData(
        dataOwner1,
        dataprovidernull.address,
        web3.utils.asciiToHex(initSignature),
        web3.utils.asciiToHex(initSignatureFunc),
        {
          from: hara
        }
      );
      const logs = receipt.receipt.rawLogs;
      const DataCreationLog = encoderDecoder.decodeLogsByTopic(
        DataCreationLogTopic,
        DataCreationLogAbi,
        logs
      )[0];
      datastoreA = await DataStoreContract.at(
        DataCreationLog.contractDataAddress
      );
      const ownerData = await datastoreA.owner();
      assert.strictEqual(ownerData, dataOwner1);
      const sig = await datastoreA.getSignature(web3.utils.keccak256("0"));
      assert.strictEqual(sig, web3.utils.asciiToHex(initSignature));
      const sigFunc = await datastoreA.getSignatureFunction();
      assert.strictEqual(sigFunc, web3.utils.asciiToHex(initSignatureFunc));
    });

    it("create data B with owner 1", async () => {
      var receipt = await datafactoryregistry.storeData(
        dataOwner1,
        dataprovidernull.address,
        web3.utils.asciiToHex(initSignature),
        web3.utils.asciiToHex(initSignatureFunc),
        {
          from: hara
        }
      );
      const logs = receipt.receipt.rawLogs;
      const DataCreationLog = encoderDecoder.decodeLogsByTopic(
        DataCreationLogTopic,
        DataCreationLogAbi,
        logs
      )[0];
      datastoreB = await DataStoreContract.at(
        DataCreationLog.contractDataAddress
      );
      const ownerData = await datastoreB.owner();
      assert.strictEqual(ownerData, dataOwner1);
      const sig = await datastoreB.getSignature(web3.utils.keccak256("0"));
      assert.strictEqual(sig, web3.utils.asciiToHex(initSignature));
      const sigFunc = await datastoreB.getSignatureFunction();
      assert.strictEqual(sigFunc, web3.utils.asciiToHex(initSignatureFunc));
    });

    it("create data C with owner 1", async () => {
      var receipt = await datafactoryregistry.storeData(
        dataOwner1,
        dataprovidernull.address,
        web3.utils.asciiToHex(initSignature),
        web3.utils.asciiToHex(initSignatureFunc),
        {
          from: hara
        }
      );
      const logs = receipt.receipt.rawLogs;
      const DataCreationLog = encoderDecoder.decodeLogsByTopic(
        DataCreationLogTopic,
        DataCreationLogAbi,
        logs
      )[0];
      datastoreC = await DataStoreContract.at(
        DataCreationLog.contractDataAddress
      );
      const ownerData = await datastoreC.owner();
      assert.strictEqual(ownerData, dataOwner1);
      const sig = await datastoreC.getSignature(web3.utils.keccak256("0"));
      assert.strictEqual(sig, web3.utils.asciiToHex(initSignature));
      const sigFunc = await datastoreC.getSignatureFunction();
      assert.strictEqual(sigFunc, web3.utils.asciiToHex(initSignatureFunc));
    });
  });
  describe("Upload: data D, E owned by owner2", async () => {
    it("create data D with owner 2", async () => {
      var receipt = await datafactoryregistry.storeData(
        dataOwner2,
        dataprovidernull.address,
        web3.utils.asciiToHex(initSignature),
        web3.utils.asciiToHex(initSignatureFunc),
        {
          from: hara
        }
      );
      const logs = receipt.receipt.rawLogs;
      const DataCreationLog = encoderDecoder.decodeLogsByTopic(
        DataCreationLogTopic,
        DataCreationLogAbi,
        logs
      )[0];
      datastoreD = await DataStoreContract.at(
        DataCreationLog.contractDataAddress
      );
      const ownerData = await datastoreD.owner();
      assert.strictEqual(ownerData, dataOwner2);
      const sig = await datastoreD.getSignature(web3.utils.keccak256("0"));
      assert.strictEqual(sig, web3.utils.asciiToHex(initSignature));
      const sigFunc = await datastoreD.getSignatureFunction();
      assert.strictEqual(sigFunc, web3.utils.asciiToHex(initSignatureFunc));
    });

    it("create data E with owner 2", async () => {
      var receipt = await datafactoryregistry.storeData(
        dataOwner2,
        dataprovidernull.address,
        web3.utils.asciiToHex(initSignature),
        web3.utils.asciiToHex(initSignatureFunc),
        {
          from: hara
        }
      );
      const logs = receipt.receipt.rawLogs;
      const DataCreationLog = encoderDecoder.decodeLogsByTopic(
        DataCreationLogTopic,
        DataCreationLogAbi,
        logs
      )[0];
      datastoreE = await DataStoreContract.at(
        DataCreationLog.contractDataAddress
      );
      const ownerData = await datastoreE.owner();
      assert.strictEqual(ownerData, dataOwner2);
      const sig = await datastoreE.getSignature(web3.utils.keccak256("0"));
      assert.strictEqual(sig, web3.utils.asciiToHex(initSignature));
      const sigFunc = await datastoreE.getSignatureFunction();
      assert.strictEqual(sigFunc, web3.utils.asciiToHex(initSignatureFunc));
    });
  });
  describe("Upload: data A, B, C, D, E have owner", async () => {
    it("data A, C owned by dataOwner1", async () => {
      const ownerDataA = await datastoreA.owner();
      const ownerDataC = await datastoreC.owner();
      assert.strictEqual(ownerDataA, ownerDataC);
      assert.strictEqual(ownerDataA, dataOwner1);
      assert.strictEqual(ownerDataC, dataOwner1);
      assert.notStrictEqual(ownerDataA, dataOwner2);
      assert.notStrictEqual(ownerDataC, dataOwner2);
    });

    it("data A, C not owned by dataOwner1", async () => {
      const ownerDataA = await datastoreA.owner();
      const ownerDataC = await datastoreC.owner();
      assert.strictEqual(ownerDataA, ownerDataC);
      assert.strictEqual(ownerDataA, dataOwner1);
      assert.strictEqual(ownerDataC, dataOwner1);
      assert.notStrictEqual(ownerDataA, dataOwner2);
      assert.notStrictEqual(ownerDataC, dataOwner2);
    });
  });
  describe("Attest: can attest data A by data owner 1", async () => {
    let AttestActionLog;
    let WhoAttestLog;
    let AttestLog;
    let concatedBytes;
    let encryptedBytes;
    before(async () => {
      var receipt = await attestContract.attest(
        initVersion,
        datastoreA.address,
        initTopic1,
        initValue,
        initExpiredTime,
        { from: dataOwner1 }
      );
      AttestActionLog = receipt.receipt.logs[1].args;
      WhoAttestLog = receipt.receipt.logs[2].args;
      AttestLog = receipt.receipt.logs[3].args;
      concatedBytes =
        "0x" +
        web3.utils
          .numberToHex(initVersion)
          .slice(2)
          .padStart(16, "0") +
        datastoreA.address.slice(2).toLowerCase() +
        initTopic1.slice(2) +
        dataOwner1.slice(2).toLowerCase();
      encryptedBytes = web3.utils.keccak256(concatedBytes);
    });

    it("AttestActionLog is working", async () => {
      assert.strictEqual(AttestActionLog.encryptedBytes, encryptedBytes);
      assert.strictEqual(AttestActionLog.version, initVersion);
      assert.strictEqual(AttestActionLog.itemAddress, datastoreA.address);
      assert.strictEqual(AttestActionLog.topic, initTopic1);
      assert.strictEqual(AttestActionLog.attestor, dataOwner1);
      assert.strictEqual(AttestActionLog.value, initValue);
      assert.strictEqual(
        parseInt(AttestActionLog.expiredTime),
        initExpiredTime
      );
    });

    it("WhoAttestLog is working", async function() {
      assert.strictEqual(WhoAttestLog.encryptedBytes, encryptedBytes);
      assert.strictEqual(WhoAttestLog.version, initVersion);
      assert.strictEqual(WhoAttestLog.itemAddress, datastoreA.address);
      assert.strictEqual(WhoAttestLog.topic, initTopic1);
      assert.strictEqual(WhoAttestLog.attestor, dataOwner1);
    });

    it("AttestLog is working", async function() {
      assert.strictEqual(AttestLog.encryptedBytes, encryptedBytes);
      assert.strictEqual(AttestLog.version, initVersion);
      assert.strictEqual(AttestLog.itemAddress, datastoreA.address);
      assert.strictEqual(AttestLog.topic, initTopic1);
      assert.strictEqual(AttestLog.attestor, dataOwner1);
    });
  });
  describe("Attest: can attest data A by data owner 2", async () => {
    let AttestActionLog;
    let WhoAttestLog;
    let AttestLog;
    let concatedBytes;
    let encryptedBytes;
    before(async () => {
      var receipt = await attestContract.attest(
        initVersion,
        datastoreA.address,
        initTopic2,
        initValue,
        initExpiredTime,
        { from: dataOwner2 }
      );

      AttestActionLog = receipt.receipt.logs[1].args;
      WhoAttestLog = receipt.receipt.logs[2].args;
      AttestLog = receipt.receipt.logs[3].args;
      concatedBytes =
        "0x" +
        web3.utils
          .numberToHex(initVersion)
          .slice(2)
          .padStart(16, "0") +
        datastoreA.address.slice(2).toLowerCase() +
        initTopic2.slice(2) +
        dataOwner2.slice(2).toLowerCase();
      encryptedBytes = web3.utils.keccak256(concatedBytes);
    });

    it("AttestActionLog is working", async function() {
      assert.strictEqual(AttestActionLog.encryptedBytes, encryptedBytes);
      assert.strictEqual(AttestActionLog.version, initVersion);
      assert.strictEqual(AttestActionLog.itemAddress, datastoreA.address);
      assert.strictEqual(AttestActionLog.topic, initTopic2);
      assert.strictEqual(AttestActionLog.attestor, dataOwner2);
      assert.strictEqual(AttestActionLog.value, initValue);
      assert.strictEqual(
        parseInt(AttestActionLog.expiredTime),
        initExpiredTime
      );
    });

    it("WhoAttestLog is working", async function() {
      assert.strictEqual(WhoAttestLog.encryptedBytes, encryptedBytes);
      assert.strictEqual(WhoAttestLog.version, initVersion);
      assert.strictEqual(WhoAttestLog.itemAddress, datastoreA.address);
      assert.strictEqual(WhoAttestLog.topic, initTopic2);
      assert.strictEqual(WhoAttestLog.attestor, dataOwner2);
    });

    it("AttestLog is working", async function() {
      assert.strictEqual(AttestLog.encryptedBytes, encryptedBytes);
      assert.strictEqual(AttestLog.version, initVersion);
      assert.strictEqual(AttestLog.itemAddress, datastoreA.address);
      assert.strictEqual(AttestLog.topic, initTopic2);
      assert.strictEqual(AttestLog.attestor, dataOwner2);
    });
  });

  describe("Attest: get attestation details", async () => {
    it("can get details of data A attestation by data owner 1", async () => {
      var value = await attestContract.getValue(
        initVersion,
        datastoreA.address,
        initTopic1,
        dataOwner1
      );
      var expiredTime = await attestContract.getExpiredTime(
        initVersion,
        datastoreA.address,
        initTopic1,
        dataOwner1
      );
      assert.strictEqual(value, initValue);
      assert.strictEqual(parseInt(expiredTime), initExpiredTime);
    });

    it("can get details of data A attestation by data owner 2", async () => {
      var value = await attestContract.getValue(
        initVersion,
        datastoreA.address,
        initTopic2,
        dataOwner2
      );
      var expiredTime = await attestContract.getExpiredTime(
        initVersion,
        datastoreA.address,
        initTopic2,
        dataOwner2
      );
      assert.strictEqual(value, initValue);
      assert.strictEqual(parseInt(expiredTime), initExpiredTime);
    });
  });

  describe("Relation: create relation for two data", async () => {
    before(async () => {
      // create data store relation
      var receipt = await datafactoryregistry.storeData(
        hara,
        dataproviderrelation.address,
        web3.utils.asciiToHex("relation"),
        web3.utils.asciiToHex(initSignatureFunc),
        {
          from: hara
        }
      );
      const logs = receipt.receipt.rawLogs;
      const DataCreationLog = encoderDecoder.decodeLogsByTopic(
        DataCreationLogTopic,
        DataCreationLogAbi,
        logs
      )[0];
      datastoreRelation = await DataStoreContract.at(
        DataCreationLog.contractDataAddress
      );

      // deploy data factory privider (the wina)
      datafactoryprovider = await DataFactoryProvider.new(
        datastoreRelation.address,
        dataproviderrelation.address, {
        from: hara
      });
    // set datafactoryprovider as editor
    await datastoreRelation.setEditor(datafactoryprovider.address, {from: hara});

    // set provider proxy
    await dataproviderrelation.setProxyAddress(datafactoryprovider.address, {from: contractOwner});

    });
    it("connect data A to B", async () => {
      var receipt = await datafactoryprovider.addNewVersion(
        web3.utils.soliditySha3({t:'address',v:datastoreA.address}, 
          {t:'bytes32',v:web3.utils.keccak256("0")}, {t:'address',v:datastoreB.address}, {t:'bytes32',v:web3.utils.keccak256("0")}), // version
        web3.utils.keccak256(datastoreA + "*0*" + datastoreB + "*0"), // signature
        // web3.utils.soliditySha3({t:'string', v:datastoreA.address}, {t:'string',v:web3.utils.keccak256("0")}), // bytes256(from addr + version)
        // datastoreB.address + "2", // to
        datastoreA.address, // fromAddr
        "0", // fromVersion
        datastoreB.address.toString(), //toAddr
        "2", //toVersion
        {from: hara }
      );
      const logs = receipt.receipt.rawLogs;
      const EndpointChangedLog = encoderDecoder.decodeLogsByTopic(
        EndpointChangedLogTopic,
        EndpointChangedLogAbi,
        logs
      )[0];
      const SignatureLog = encoderDecoder.decodeLogsByTopic(
        SignatureLogTopic,
        SignatureLogAbi,
        logs
      )[0];
      const RelationCreatedLog = encoderDecoder.decodeLogsByTopic(
        RelationCreatedLogTopic,
        RelationCreatedLogAbi,
        logs
      )[0];
      assert.strictEqual(EndpointChangedLog.newEndpoint, datastoreB.address + "2");
      assert.strictEqual(EndpointChangedLog.by, datafactoryprovider.address);
      assert.strictEqual(SignatureLog.version,  web3.utils.soliditySha3({t:'address',v:datastoreA.address},{t:'bytes32',v:web3.utils.keccak256("0")}, {t:'address',v:datastoreB.address}, {t:'bytes32',v:web3.utils.keccak256("0")}));
      assert.strictEqual(SignatureLog.signature, web3.utils.keccak256(datastoreA + "*0*" + datastoreB + "*0"));
      assert.strictEqual(RelationCreatedLog.fromAddr, web3.utils.soliditySha3({t:'string',v:datastoreA.address}));
      assert.strictEqual(RelationCreatedLog.fromVersion, "0");
      assert.strictEqual(RelationCreatedLog.toAddr, web3.utils.soliditySha3({t:'string',v:datastoreB.address}));
      assert.strictEqual(RelationCreatedLog.toVersion, "2");
    });
    it("connect data A to C", async () => {
      var receipt = await datafactoryprovider.addNewVersion(
        web3.utils.soliditySha3({t:'address',v:datastoreA.address}, 
          {t:'bytes32',v:web3.utils.keccak256("0")}, {t:'address',v:datastoreC.address}, {t:'bytes32',v:web3.utils.keccak256("0")}), // version
        web3.utils.keccak256(datastoreA + "*0*" + datastoreC + "*0"), // signature
        // web3.utils.soliditySha3({t:'string', v:datastoreA.address}, {t:'string',v:web3.utils.keccak256("0")}), // bytes256(from addr + version)
        // datastoreC.address + "2", // to
        datastoreA.address,
        "0",
        datastoreC.address,
        "2",
        {from: hara }
      );
      const logs = receipt.receipt.rawLogs;
      const EndpointChangedLog = encoderDecoder.decodeLogsByTopic(
        EndpointChangedLogTopic,
        EndpointChangedLogAbi,
        logs
      )[0];
      const SignatureLog = encoderDecoder.decodeLogsByTopic(
        SignatureLogTopic,
        SignatureLogAbi,
        logs
      )[0];
      const RelationCreatedLog = encoderDecoder.decodeLogsByTopic(
        RelationCreatedLogTopic,
        RelationCreatedLogAbi,
        logs
      )[0];
      assert.strictEqual(EndpointChangedLog.newEndpoint, datastoreC.address + "2");
      assert.strictEqual(EndpointChangedLog.by,  datafactoryprovider.address);
      assert.strictEqual(SignatureLog.version,  web3.utils.soliditySha3({t:'address',v:datastoreA.address}, 
      {t:'bytes32',v:web3.utils.keccak256("0")}, {t:'address',v:datastoreC.address}, {t:'bytes32',v:web3.utils.keccak256("0")}));
      assert.strictEqual(SignatureLog.signature, web3.utils.keccak256(datastoreA + "*0*" + datastoreB + "*0"));
      assert.strictEqual(RelationCreatedLog.fromAddr, web3.utils.soliditySha3({t:'string',v:datastoreA.address}));
      assert.strictEqual(RelationCreatedLog.fromVersion, "0");
      assert.strictEqual(RelationCreatedLog.toAddr, web3.utils.soliditySha3({t:'string',v:datastoreC.address}));
      assert.strictEqual(RelationCreatedLog.toVersion, "2");
    });
    it("connect data B to C", async () => {
      var receipt = await datafactoryprovider.addNewVersion(
        web3.utils.soliditySha3({t:'address',v:datastoreB.address}, 
          {t:'bytes32',v:web3.utils.keccak256("0")}, {t:'address',v:datastoreC.address}, {t:'bytes32',v:web3.utils.keccak256("0")}), // version
        web3.utils.keccak256(datastoreB + "*0*" + datastoreC + "*0"), // signature
        // web3.utils.soliditySha3({t:'string', v:datastoreB.address}, {t:'string',v:web3.utils.keccak256("0")}), // bytes256(from addr + version)
        // datastoreC.address + "2", // to
        datastoreB.address,
        "0",
        datastoreC.address,
        "2",
        {from: hara }
      );
      const logs = receipt.receipt.rawLogs;
      const EndpointChangedLog = encoderDecoder.decodeLogsByTopic(
        EndpointChangedLogTopic,
        EndpointChangedLogAbi,
        logs
      )[0];
      const SignatureLog = encoderDecoder.decodeLogsByTopic(
        SignatureLogTopic,
        SignatureLogAbi,
        logs
      )[0];
      const RelationCreatedLog = encoderDecoder.decodeLogsByTopic(
        RelationCreatedLogTopic,
        RelationCreatedLogAbi,
        logs
      )[0];
      assert.strictEqual(EndpointChangedLog.newEndpoint, datastoreC.address + "2");
      assert.strictEqual(EndpointChangedLog.by,  datafactoryprovider.address);
      assert.strictEqual(SignatureLog.version,  web3.utils.soliditySha3({t:'address',v:datastoreB.address}, 
      {t:'bytes32',v:web3.utils.keccak256("0")}, {t:'address',v:datastoreC.address}, {t:'bytes32',v:web3.utils.keccak256("0")}));
      assert.strictEqual(SignatureLog.signature, web3.utils.keccak256(datastoreB + "*0*" + datastoreC + "*0"));
      assert.strictEqual(RelationCreatedLog.fromAddr, web3.utils.soliditySha3({t:'string',v:datastoreB.address}));
      assert.strictEqual(RelationCreatedLog.fromVersion, "0");
      assert.strictEqual(RelationCreatedLog.toAddr, web3.utils.soliditySha3({t:'string',v:datastoreC.address}));
      assert.strictEqual(RelationCreatedLog.toVersion, "2");
      
    });
    it("connect data C to A", async () => {
      var receipt = await datafactoryprovider.addNewVersion(
        web3.utils.soliditySha3({t:'address',v:datastoreC.address}, 
          {t:'bytes32',v:web3.utils.keccak256("0")}, {t:'address',v:datastoreA.address}, {t:'bytes32',v:web3.utils.keccak256("0")}), // version
        web3.utils.keccak256(datastoreC + "*0*" + datastoreA + "*0"), // signature
        // web3.utils.soliditySha3({t:'string', v:datastoreC.address}, {t:'string',v:web3.utils.keccak256("0")}), // bytes256(from addr + version)
        // datastoreA.address + "2", // to
        datastoreC.address,
        "0",
        datastoreA.address,
        "2",
        {from: hara }
      );
      const logs = receipt.receipt.rawLogs;
      const EndpointChangedLog = encoderDecoder.decodeLogsByTopic(
        EndpointChangedLogTopic,
        EndpointChangedLogAbi,
        logs
      )[0];
      const SignatureLog = encoderDecoder.decodeLogsByTopic(
        SignatureLogTopic,
        SignatureLogAbi,
        logs
      )[0];
      const RelationCreatedLog = encoderDecoder.decodeLogsByTopic(
        RelationCreatedLogTopic,
        RelationCreatedLogAbi,
        logs
      )[0];
      assert.strictEqual(EndpointChangedLog.newEndpoint, datastoreA.address + "2");
      assert.strictEqual(EndpointChangedLog.by,  datafactoryprovider.address);
      assert.strictEqual(SignatureLog.version,  web3.utils.soliditySha3({t:'address',v:datastoreC.address}, 
      {t:'bytes32',v:web3.utils.keccak256("0")}, {t:'address',v:datastoreA.address}, {t:'bytes32',v:web3.utils.keccak256("0")}));
      assert.strictEqual(SignatureLog.signature, web3.utils.keccak256(datastoreC + "*0*" + datastoreA + "*0"));
      assert.strictEqual(RelationCreatedLog.fromAddr, web3.utils.soliditySha3({t:'string',v:datastoreC.address}));
      assert.strictEqual(RelationCreatedLog.fromVersion, "0");
      assert.strictEqual(RelationCreatedLog.toAddr, web3.utils.soliditySha3({t:'string',v:datastoreA.address}));
      assert.strictEqual(RelationCreatedLog.toVersion, "2");
    });
  });

  describe("Relation: get relations", async () => {
    it("get all from connection of A", async () => {
      let filterLogs = await datafactoryprovider.getPastEvents('RelationCreatedLog', {
        topics: [RelationCreatedLogTopic, web3.utils.soliditySha3({t:'string',v:datastoreA.address}), null],
        fromBlock: 0,
        toBlock: 'latest'
    })
    assert.strictEqual(filterLogs.length, 2)
    });
    it("get all to connection of A", async () => {
      let filterLogs = await datafactoryprovider.getPastEvents('RelationCreatedLog', {
        topics: [RelationCreatedLogTopic, null, web3.utils.soliditySha3({t:'string',v:datastoreA.address})],
        fromBlock: 0,
        toBlock: 'latest',
    })
    assert.strictEqual(filterLogs.length, 1)
    });
    it("get all from connection of B", async () => {
      let filterLogs = await datafactoryprovider.getPastEvents('RelationCreatedLog', {
        topics: [RelationCreatedLogTopic, web3.utils.soliditySha3({t:'string',v:datastoreB.address}), null],
        fromBlock: 0,
        toBlock: 'latest'
    })
    assert.strictEqual(filterLogs.length, 1)
    });
    it("get all to connection of B", async () => {
      let filterLogs = await datafactoryprovider.getPastEvents('RelationCreatedLog', {
        topics: [RelationCreatedLogTopic, null, web3.utils.soliditySha3({t:'string',v:datastoreB.address})],
        fromBlock: 0,
        toBlock: 'latest',
    })
    assert.strictEqual(filterLogs.length, 1)
    });
    it("get all from connection of C", async () => {
      let filterLogs = await datafactoryprovider.getPastEvents('RelationCreatedLog', {
        // filter: {fromAddr: datastoreC.address}, 
        fromBlock: 0,
        toBlock: 'latest',
        topics: [RelationCreatedLogTopic, web3.utils.soliditySha3({t:'string',v:datastoreC.address}), null],
    })
    assert.strictEqual(filterLogs.length, 1)
    });
    it("get all to connection of C", async () => {
      let filterLogs = await datafactoryprovider.getPastEvents('RelationCreatedLog', {
        fromBlock: 0,
        toBlock: 'latest',
        topics: [RelationCreatedLogTopic, null, web3.utils.soliditySha3({t:'string',v:datastoreC.address})]
    })
    assert.strictEqual(filterLogs.length, 2)
    });
  });

  describe("Attest Relation: Attest relation A to B", async () => {
    let AttestActionLog;
    let WhoAttestLog;
    let AttestLog;
    let concatedBytes;
    let encryptedBytes;
    let version;
    before(async () => {
      version = web3.utils.soliditySha3({t:'address',v:datastoreA.address}, 
          {t:'bytes32',v:web3.utils.keccak256("0")}, {t:'address',v:datastoreB.address}, {t:'bytes32',v:web3.utils.keccak256("0")});
      var receipt = await attestContract.attest(
        version,
        datastoreRelation.address,
        initTopic2,
        initValue,
        initExpiredTime,
        { from: hara }
      );

      AttestActionLog = receipt.receipt.logs[1].args;
      WhoAttestLog = receipt.receipt.logs[2].args;
      AttestLog = receipt.receipt.logs[3].args;
      concatedBytes =
        "0x" +
        web3.utils
          .numberToHex(version)
          .slice(2)
          .padStart(16, "0") +
        datastoreRelation.address.slice(2).toLowerCase() +
        initTopic2.slice(2) +
        hara.slice(2).toLowerCase();
      encryptedBytes = web3.utils.keccak256(concatedBytes);
    });

    it("AttestActionLog is working", async function() {
      assert.strictEqual(AttestActionLog.encryptedBytes, encryptedBytes);
      assert.strictEqual(AttestActionLog.version, version);
      assert.strictEqual(AttestActionLog.itemAddress, datastoreRelation.address);
      assert.strictEqual(AttestActionLog.topic, initTopic2);
      assert.strictEqual(AttestActionLog.attestor, hara);
      assert.strictEqual(AttestActionLog.value, initValue);
      assert.strictEqual(
        parseInt(AttestActionLog.expiredTime),
        initExpiredTime
      );
    });

    it("WhoAttestLog is working", async function() {
      assert.strictEqual(WhoAttestLog.encryptedBytes, encryptedBytes);
      assert.strictEqual(WhoAttestLog.version, version);
      assert.strictEqual(WhoAttestLog.itemAddress, datastoreRelation.address);
      assert.strictEqual(WhoAttestLog.topic, initTopic2);
      assert.strictEqual(WhoAttestLog.attestor, hara);
    });

    it("AttestLog is working", async function() {
      assert.strictEqual(AttestLog.encryptedBytes, encryptedBytes);
      assert.strictEqual(AttestLog.version, version);
      assert.strictEqual(AttestLog.itemAddress, datastoreRelation.address);
      assert.strictEqual(AttestLog.topic, initTopic2);
      assert.strictEqual(AttestLog.attestor, hara);
    });
  });
});
