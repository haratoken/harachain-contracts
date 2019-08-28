const DataStoreContract = artifacts.require('DataStore');
const DataFactory = artifacts.require('DataFactory');
const DataFactoryRegistry = artifacts.require('DataFactoryRegistry');
const HaraToken = artifacts.require('HaraTokenPrivate');
const AdvancedPrice = artifacts.require('AdvancedPrice');
const ExchangeHARTIDR = artifacts.require('ExchangeHARTIDR');
const ExchangeRate = artifacts.require('ExchangeRate');

const expectRevert = require("./helpers/expectRevert")
const expectContractNotExists = require("./helpers/expectContractNotExists")
const encoderDecoder = require("./helpers/encoderDecoder")
const logHelper = require("./helpers/LogsHelper")

contract('DataStore', accounts => {
  let datastore;
  let dataFactory;
  let dataFactoryRegistry;
  let hart;
  let ap;

  const initLocation = web3.utils.toChecksumAddress("0xca35b7d915458ef540ade6068dfe2f44e8fa733c");
  const initSignature = "0x430dec04b9ebe807ce8fb9b0d025861c13f5e36f226c12469ff6f89fb217fa9f";
  const initSignatureFunc = "keccak";
  const initKeyMetadata = [web3.utils.asciiToHex("size"), web3.utils.asciiToHex("filename")];
  const initValueMetadata = [web3.utils.asciiToHex("2MB"), web3.utils.asciiToHex("ktp.jpg")];
  const initPriceId = web3.utils.fromAscii("0");
  const initPriceValue = web3.utils.toWei("10");

  const dataOwner = accounts[0];
  const notOwner = accounts[1];
  const owner = accounts[2]; // hart owner
  const buyer = accounts[3];
  const exchangeOwner = accounts[4];
  const dummyDexAddress = accounts[5];
  const editor = accounts[6];

  before(async function () {
    // deploy hara token contract
    var haratokenContract = new web3.eth.Contract(HaraToken.abi);
    hart = await haratokenContract.deploy({
      data: HaraToken.bytecode
    }).send({
      from: owner,
      gas: 4700000
    });

    await hart.methods.mint(owner, web3.utils.toWei("1000")).send({
      from: owner
    });

    // deploy data factory contract
    dataFactory = await DataFactory.new(
      hart.options.address, {
        from: owner
      });

    dataFactoryRegistry = await DataFactoryRegistry.new(
      dataFactory.address, {
        from: owner
      });

    await dataFactoryRegistry.setDexAddress(dummyDexAddress, {from:owner});
    await dataFactoryRegistry.addAllowedAddress(editor, {from: owner});

    datastore = await DataStoreContract.new(
      dataOwner,
      initLocation,
      web3.utils.asciiToHex(initSignature),
      web3.utils.asciiToHex(initSignatureFunc),
      dataFactoryRegistry.address, {
        from: dataOwner
      });

    let exchangeHartIdr = await ExchangeHARTIDR.new({
      from: exchangeOwner
    });

    // set exchange owner as exchange changer
    await exchangeHartIdr.setExchangeChanger(exchangeOwner, {
      from: exchangeOwner
    });

    // deploy contract ExchangeRate
    let exchange = await ExchangeRate.new(exchangeHartIdr.address, {
      from: exchangeOwner
    })

    // deploy contract exchange rate
    ap = await AdvancedPrice.new(
      exchange.address, {
        from: owner
      });

    // set hart rate
    await exchangeHartIdr.setExchangeRate(100, {
      from: exchangeOwner
    });
  });

  describe('store initial data information', async function () {

    it('owned by owner', async function () {
      var isOwner = await datastore.isOwner();
      assert.strictEqual(isOwner, true);
    });

    it('owner is owner', async function () {
      var owner = await datastore.getOwner();
      assert.strictEqual(owner, dataOwner);
    });

    it('store data owner address', async function () {
      var owner = await datastore.owner();
      assert.strictEqual(owner, dataOwner);
    });

    it('store data location', async function () {
      var dataLocation = await datastore.getLocation();
      assert.strictEqual(dataLocation, initLocation);
    });

    it('store data signature', async function () {
      var dataSignature = await datastore.getSignature(web3.utils.keccak256("0"));
      assert.strictEqual(web3.utils.hexToAscii(dataSignature), initSignature);
    });

    it('store data signature function', async function () {
      var dataSignatureFunc = await datastore.getSignatureFunction();
      assert.strictEqual(web3.utils.hexToAscii(dataSignatureFunc), initSignatureFunc);
    });

    it('store data signature with other version', async function () {
      await datastore.setSignature(initPriceId, web3.utils.keccak256("this is test"));
      var dataSignature = await datastore.getSignature(initPriceId);
      assert.strictEqual(dataSignature, web3.utils.keccak256("this is test"));
    });
  });

  describe('store other initial data', async function () {
    it('can\'t store init metadata by not owner', async function () {
      await expectRevert(
        datastore.setMetadatas(initKeyMetadata, initValueMetadata, {
          from: notOwner
        })
      );
    });

    it('store init metadata by owner', async function () {
      await datastore.setMetadatas(initKeyMetadata, initValueMetadata, {
        from: dataOwner
      });
      var sizeMetadata = await datastore.getMetadata(encoderDecoder.stringToBytes32("size"));
      var filenameMetadata = await datastore.getMetadata(encoderDecoder.stringToBytes32("filename"));
      assert.strictEqual(web3.utils.padRight(sizeMetadata, 64), web3.utils.padRight(initValueMetadata[0], 64));
      assert.strictEqual(web3.utils.padRight(filenameMetadata, 64), web3.utils.padRight(initValueMetadata[1], 64));
    });
  });

  describe('add additional data and details', async function () {
    it('can add date data by owner', async function () {
      var receipt = await datastore.setMetadata(web3.utils.asciiToHex("date"), web3.utils.asciiToHex("2018-08-15T10:48:56.485Z"), {
        from: dataOwner
      })
      var dataDate = await datastore.getMetadata(web3.utils.asciiToHex("date"));
      assert.strictEqual(web3.utils.hexToAscii(dataDate).replace(/\u0000/g, ''), "2018-08-15T10:48:56.485Z");

      var log = receipt.logs[0];
      assert.strictEqual(log.event, "MetadataLog");
      assert.strictEqual(web3.utils.hexToAscii(log.args.keyMetadata).replace(/\u0000/g, ''), "date");
      assert.strictEqual(web3.utils.hexToAscii(log.args.valueMetadata).replace(/\u0000/g, ''), "2018-08-15T10:48:56.485Z");
    });

    it('can not add date data by not owner', async function () {
      await expectRevert(
        datastore.setMetadata(web3.utils.asciiToHex("date"),
          web3.utils.asciiToHex("2018-08-15T10:48:56.485Z"), {
            from: notOwner
          }));
    });
  });

  describe('purchase status', async function () {
    it('can set purchase status by Dex address', async function () {
      var purchaseStatusBefore = await datastore.getPurchaseStatus(buyer, initPriceId);
      await datastore.setPurchaseStatus(initPriceId, buyer, true, {
        from: dummyDexAddress
      })

      var purchaseStatusAfter = await datastore.getPurchaseStatus(buyer, initPriceId);
      assert.strictEqual(purchaseStatusBefore, false);
      assert.strictEqual(purchaseStatusAfter, true);
      assert.notStrictEqual(purchaseStatusBefore, purchaseStatusAfter);
    });

    it('true if call by owner', async function () {
      var purchaseStatus = await datastore.getPurchaseStatus(dataOwner, initPriceId);    
      assert.strictEqual(purchaseStatus, true);
    });

    it('can set purchase status by not owner', async function () {
      await expectRevert(
        datastore.setPurchaseStatus(initPriceId, notOwner, true, {
          from: notOwner
        }));
    });
  });

  describe('have editor', async function () {
    it('set editor by owner', async function () {
      var editorBefore = await datastore.editor();
      await datastore.setEditor(editor, {
        from: dataOwner
      })

      var editorAfter = await datastore.editor();
      assert.strictEqual(editorBefore, "0x0000000000000000000000000000000000000000");
      assert.strictEqual(editorAfter, editor);
      assert.notStrictEqual(editorBefore, editorAfter);
    });

    it('can not set editor by not owner', async function () {
      var editorBefore = await datastore.editor();
      await expectRevert(
        datastore.setEditor(dummyDexAddress, {from: notOwner})
      )

      var editorAfter = await datastore.editor();
      assert.strictEqual(editorBefore, editor);
      assert.strictEqual(editorAfter, editor);
      assert.strictEqual(editorBefore, editorAfter);
    });

    it('set signature by editor', async function () {
      var signatureBefore = await datastore.getSignature(web3.utils.keccak256("1"));
      await datastore.setSignature(web3.utils.keccak256("1"), web3.utils.asciiToHex("this is signature test 1"), {
        from: editor
      })

      var signatureAfter = await datastore.getSignature(web3.utils.keccak256("1"));
      assert.strictEqual(signatureBefore, null);
      assert.strictEqual(signatureAfter, web3.utils.asciiToHex("this is signature test 1"));
      assert.notStrictEqual(signatureBefore, signatureAfter);
    });

    it('set signature by owner', async function () {
      var signatureBefore = await datastore.getSignature(web3.utils.keccak256("2"));
      await datastore.setSignature(web3.utils.keccak256("2"), web3.utils.asciiToHex("this is signature test 2"), {
        from: editor
      })

      var signatureAfter = await datastore.getSignature(web3.utils.keccak256("2"));
      assert.strictEqual(signatureBefore, null);
      assert.strictEqual(signatureAfter, web3.utils.asciiToHex("this is signature test 2"));
      assert.notStrictEqual(signatureBefore, signatureAfter);
    });

    it('not set signature by notOwner', async function () {
      var signatureBefore = await datastore.getSignature(web3.utils.keccak256("3"));
      await expectRevert(datastore.setSignature(web3.utils.keccak256("3"), web3.utils.asciiToHex("this is signature test 3"), {
        from: notOwner
      })
      )

      var signatureAfter = await datastore.getSignature(web3.utils.keccak256("3"));
      assert.strictEqual(signatureBefore, null);
      assert.strictEqual(signatureAfter, null);
      assert.strictEqual(signatureBefore, signatureAfter);
    });
  });

  describe('have getClass()', async function () {
    it('emit hasGetClass event', async function () {
      const receipt = await dataFactoryRegistry.storeData2(
        dataOwner,
        initLocation,
        web3.utils.asciiToHex(initSignature), {
          from: editor
        }
      );
      const HasGetLog = encoderDecoder.decodeLogsByTopic(logHelper.ContractMadeAbstract.HasGetClassTopic,
        logHelper.ContractMadeAbstract.HasGetClassAbi, receipt.receipt.rawLogs);
        assert.strictEqual(HasGetLog.length, 1);
        assert.strictEqual(HasGetLog[0].__length__, 0)
    });

    it('can get class with getClass() function', async function () {
      const hns = await datastore.getClass()
      assert.strictEqual(hns, "datastore.class");
    });
  });

  describe('error test', async function () {
    it('when key metadata length not equals value metadata length', async function () {
      var errorKeyMetadata = [web3.utils.asciiToHex("size"), web3.utils.asciiToHex("filename"), web3.utils.asciiToHex("extension")];
      var datastoreerror = await DataStoreContract.new(
        dataOwner,
        initLocation,
        web3.utils.asciiToHex(initSignature),
        web3.utils.asciiToHex(initSignatureFunc),
        dataFactory.address, {
          from: dataOwner
        });
      await expectRevert(
        datastoreerror.setMetadatas(errorKeyMetadata, initValueMetadata, {
          from: dataOwner
        })
      )
    });
  });

  describe('killed the contract', async function () {
    it('can not killed by not owner', async function () {
      await expectRevert(datastore.kill({
        from: notOwner
      }));
    });

    it('killed by owner and can\'t access contract', async function () {
      await datastore.kill({
        from: dataOwner
      });
      await expectContractNotExists(datastore.owner());
      await expectContractNotExists(datastore.getMetadata(web3.utils.asciiToHex("id")));
    });
  });
});