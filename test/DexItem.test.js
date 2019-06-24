const DataStoreContract = artifacts.require('DataStore');
const DataFactory = artifacts.require('DataFactory');
const DataFactoryRegistry = artifacts.require('DataFactoryRegistry');
const DexItem= artifacts.require('DexItem');
const HaraToken = artifacts.require('HaraTokenPrivate');
const AdvancedPrice = artifacts.require('AdvancedPrice');
const ExchangeHARTIDR = artifacts.require('ExchangeHARTIDR');
const ExchangeRate = artifacts.require('ExchangeRate');

const expectRevert = require("./helpers/expectRevert")
const expectContractNotExists = require("./helpers/expectContractNotExists")
const encoderDecoder = require("./helpers/encoderDecoder")

contract('DexItem', accounts => {
  let datastore;
  let dataFactory;
  let dataFactoryRegistry;
  let hart;
  let ap;
  let dexItem;

  const initLocation = web3.utils.toChecksumAddress("0xca35b7d915458ef540ade6068dfe2f44e8fa733c");
  const initSignature = "0x430dec04b9ebe807ce8fb9b0d025861c13f5e36f226c12469ff6f89fb217fa9f";
  const initSignatureFunc = "keccak";
  const initKeyMetadata = [web3.utils.asciiToHex("size"), web3.utils.asciiToHex("filename")];
  const initValueMetadata = [web3.utils.asciiToHex("2MB"), web3.utils.asciiToHex("ktp.jpg")];
  // const initPriceId = web3.utils.fromAscii("0");
  const initPriceId = web3.utils.padRight(web3.utils.numberToHex('1'), 24); // buat aman harus sesuai length bytes12
  // const initPriceId = web3.utils.numberToHex('1');
  const initPriceValue = web3.utils.toWei("10");
  let id;

  const dataOwner = accounts[0];
  const notOwner = accounts[1];
  const owner = accounts[2]; // hart owner
  const buyer = accounts[3];
  const exchangeOwner = accounts[4];
  const dexOwner = accounts[5];

  before(async function () {
    // deploy hara token contract
    // var haratokenContract = new web3.eth.Contract(HaraToken.abi);
    // hart = await haratokenContract.deploy({
    //   data: HaraToken.bytecode
    // }).send({
    //   from: owner,
    //   gas: 4700000
    // });

    // await hart.methods.mint(owner, web3.utils.toWei("1000")).send({
    //   from: owner
    // });

    // deploy hara token contract
    hart = await HaraToken.new({
        from: owner
      });

    await hart.mint(owner, web3.utils.toWei("1000"), {
      from: owner
    });

    // deploy data factory contract
    dataFactory = await DataFactory.new(
      hart.address, {
        from: owner
      });

    dataFactoryRegistry = await DataFactoryRegistry.new(
      dataFactory.address, {
        from: owner
      });

    datastore = await DataStoreContract.new(
      dataOwner,
      initLocation,
      web3.utils.asciiToHex(initSignature),
      web3.utils.asciiToHex(initSignatureFunc),
      dataFactoryRegistry.address, {
        from: dataOwner
      });

    id = datastore.address + initPriceId.slice(2);

    dexItem = await DexItem.new(
        hart.address, 
        dataFactoryRegistry.address, {
          from: dexOwner
        });

    await dataFactoryRegistry.setDexAddress(dexItem.address, {from:owner});

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

//   describe('store initial data information', async function () {

//     it('owned by owner', async function () {
//       var isOwner = await datastore.isOwner();
//       assert.strictEqual(isOwner, true);
//     });

//     it('store data owner address', async function () {
//       var owner = await datastore.owner();
//       assert.strictEqual(owner, dataOwner);
//     });

//     it('store data location', async function () {
//       var dataLocation = await datastore.getLocation();
//       assert.strictEqual(dataLocation, initLocation);
//     });

//     it('store data signature', async function () {
//       var dataSignature = await datastore.getSignature();
//       assert.strictEqual(web3.utils.hexToAscii(dataSignature), initSignature);
//     });

//     it('store data signature function', async function () {
//       var dataSignatureFunc = await datastore.getSignatureFunction();
//       assert.strictEqual(web3.utils.hexToAscii(dataSignatureFunc), initSignatureFunc);
//     });
//   });

  describe('store price', async function () {
    it('can\'t init price by not owner', async function () {
      await expectRevert(
        dexItem.setPrice(id, initPriceValue, {
          from: notOwner
        })
      );
    });

    it('set price by owner', async function () {
        let reciept = await dexItem.setPrice(id, initPriceValue, {
        from: dataOwner
      });
      var log = reciept.logs[0];
      assert.strictEqual(log.event, "PriceChangedLog");
      assert.strictEqual(log.args.itemAddress, datastore.address);
      assert.strictEqual(log.args.id, id.toLowerCase());
      assert.strictEqual(log.args.oldValue.toString(), "0");
      assert.strictEqual(log.args.newValue.toString(), initPriceValue);
    });

    it('can\'t set sale by not owner', async function () {
      await expectRevert(
        dexItem.setSale(id, true, {
          from: notOwner
        })
      );
    });

    it('set sale status by owner', async function () {
      var isSaleBefore = await dexItem.isSale(id);
      await dexItem.setSale(id, true, {
        from: dataOwner
      });
      var isSaleAfter = await dexItem.isSale(id);
      assert.strictEqual(isSaleBefore, false);
      assert.strictEqual(isSaleAfter, true);
      assert.notEqual(isSaleAfter, isSaleBefore);
    });
  });

  describe('buy data', async function () {
    before(async function () {
      await hart.transfer(buyer, web3.utils.toWei("100"), {
        from: owner
      });
    });

    it('can buy id 0 with hart', async function () {
      var haraBefore = await hart.balanceOf(owner) / 10000000;
      var locationBefore = await hart.balanceOf(initLocation) / 10000000;
      var receipt = await hart.buy(dexItem.address, id, web3.utils.toWei("20"), {
        from: buyer,
        gas: 3000000
      });

      var itemBoughtlog = receipt.logs[5];
      assert.strictEqual(receipt.receipt.rawLogs.length, 7)
      assert.strictEqual(itemBoughtlog.args.receiptId.toString(), "1");
      assert.strictEqual(itemBoughtlog.args.buyer, buyer);
      assert.strictEqual(itemBoughtlog.args.seller, dexItem.address); // seller jadi dex item contract
      assert.strictEqual(itemBoughtlog.args.id.toString(),id.toLowerCase());
      assert.strictEqual(itemBoughtlog.args.value.toString(), web3.utils.toWei("20"));

      var permission = await dexItem.getPurchaseStatus(buyer, id);
      assert.strictEqual(permission, true);

      var haraAfter = await hart.balanceOf(owner) / 10000000;
      var locationAfter = await hart.balanceOf(initLocation) / 10000000;

      assert.strictEqual(haraAfter - haraBefore, web3.utils.toWei("20") * 0.15 / 10000000)
      assert.strictEqual(locationAfter - locationBefore, web3.utils.toWei("20") * 0.05 / 10000000)
    });

    it('keep owner sales', async function () {
      var sales = await dexItem.sales(dataOwner);
      assert.strictEqual(sales.toString(), web3.utils.toWei("16").toString());
    });

    it('status is false for id 2', async function () {
      var permission = await dexItem.getPurchaseStatus(buyer, datastore.address + web3.utils.fromAscii("2").slice(2));
      assert.strictEqual(permission, false);
    });

    it('can not buy directly to data store', async function () {
      await expectRevert(dexItem.buy("1", {
        from: buyer
      }));
    });
  });

  // describe('purchased data permission', async function () {
  //   it('true if owner', async function () {
  //     var isAllowed = await datastore.getPurchaseStatus(dataOwner, initPriceId, {
  //       from: dataOwner
  //     });
  //     assert.strictEqual(isAllowed, true);
  //   });

  //   it('true if buyer already purchased', async function () {});

  //   it('false if buyer not bought yet', async function () {});
  // });

  describe('contract is Withdrawable', async function () {
  //   before(async function () {
  //     await hart.methods.transfer(datastore.address, web3.utils.toWei("10")).send({
  //       from: owner
  //     });
  //   });

    it('can withdraw by owner', async function () {
      var before = await hart.balanceOf(dataOwner)
      var salesBefore = await dexItem.sales(dataOwner);
      
      var receipt = await dexItem.withdraw(dataOwner, web3.utils.toWei("10"), {
        from: dataOwner
      });
      
      var after = await hart.balanceOf(dataOwner)
      var salesAfter = await dexItem.sales(dataOwner);

      assert.strictEqual(after.toString(), web3.utils.toWei("10"));
      assert.notEqual(before, after);
      assert.strictEqual(salesBefore.toString(), web3.utils.toWei("16").toString());
      assert.strictEqual(salesAfter.toString(), web3.utils.toWei("6").toString());      
      assert.notEqual(salesBefore, salesAfter);

      var BoughtLog = receipt.logs[0];
      assert.strictEqual(BoughtLog.event, "WithdrawnLog");
      assert.strictEqual(BoughtLog.args.to.toString(), dataOwner);
      assert.strictEqual(BoughtLog.args.from.toString(), dexItem.address);
      assert.strictEqual(BoughtLog.args.value.toString(), web3.utils.toWei("10"));
    });

    it('can not withdraw by not owner', async function () {
      await expectRevert(
        dexItem.withdraw(dataOwner, web3.utils.toWei("1"), {
          from: notOwner
        })
      );
    });
    it('can not withdraw if no hart to withdraw', async function () {
      await expectRevert(
        dexItem.withdraw(dataOwner, web3.utils.toWei("1000"), {
          from: dataOwner
        })
      );
    });
  });


  describe('contract price using external contract', async function () {
    it('can set price address by owner non external price contract', async function () {
      var receipt = await dexItem.setPriceAddress(ap.address, {
        from: dexOwner
      });
      var currentAddress = await dexItem.priceAddress();
      assert.strictEqual(currentAddress.toLowerCase(), ap.address.toLowerCase());

      var PriceAddressChangedLog = receipt.logs[0];
      assert.strictEqual(PriceAddressChangedLog.event, "PriceAddressChangedLog");
      assert.strictEqual(PriceAddressChangedLog.args.by.toLowerCase(), dexOwner.toLowerCase());
      assert.strictEqual(PriceAddressChangedLog.args.oldAddress.toString(), "0x0000000000000000000000000000000000000000");
      assert.strictEqual(PriceAddressChangedLog.args.newAddress.toLowerCase(), ap.address.toLowerCase());
    });

    it('can not set price by not owner', async function () {
      await expectRevert(
        dexItem.setPriceAddress(ap.address, {
          from: notOwner
        })
      );
    });

    it('can set price using external contract by owner', async function () {
      var receipt = await dexItem.setPrice(id, "5000", {
        from: dataOwner
      });

      var logs = receipt.logs;
      assert.strictEqual(logs[0].event, "PriceChangedLog");
      assert.strictEqual(logs[0].args.id, id.toLowerCase());
      assert.strictEqual(logs[0].args.oldValue.toString(), "0");
      assert.strictEqual(logs[0].args.newValue.toString(), "5000");
    });

    it('can get price using external contract', async function () {
      var currentPrice = await dexItem.getPrice(id);
      assert.strictEqual(currentPrice.toString(), "50");
    });
  });

  describe('killed the contract', async function () {
    it('can not killed by not owner', async function () {
      await expectRevert(dexItem.kill({
        from: notOwner
      }));
    });

    it('killed by owner and can\'t access contract', async function () {
      await dexItem.kill({
        from: dexOwner
      });
      await expectContractNotExists(dexItem.owner());
        });
  });
});