const DataStoreContract = artifacts.require('DataStore');
const DataFactory = artifacts.require('DataFactory');
const DataFactoryRegistry = artifacts.require('DataFactoryRegistry');
// const AdvancedPrice= artifacts.require('AdvancedPriceTest');
const HaraToken = artifacts.require('HaraTokenPrivate');
const AdvancedPrice = artifacts.require('AdvancedPrice');
const ExchangeHARTIDR = artifacts.require('ExchangeHARTIDR');
const ExchangeRate = artifacts.require('ExchangeRate');

const expectRevert = require("./helpers/expectRevert")
const expectContractNotExists = require("./helpers/expectContractNotExists")
const encoderDecoder = require("./helpers/encoderDecoder")

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
      var dataSignature = await datastore.getSignature();
      assert.strictEqual(web3.utils.hexToAscii(dataSignature), initSignature);
    });

    it('store data signature function', async function () {
      var dataSignatureFunc = await datastore.getSignatureFunction();
      assert.strictEqual(web3.utils.hexToAscii(dataSignatureFunc), initSignatureFunc);
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

    // it('can\'t init price by not owner', async function () {
    //   await expectRevert(
    //     datastore.setPrice(initPriceId, initPriceValue, {
    //       from: notOwner
    //     })
    //   );
    // });

    // it('set price by owner', async function () {
    //   datastore.setPrice(initPriceId, initPriceValue, {
    //     from: dataOwner
    //   });
    //   var price = await datastore.getPrice(initPriceId);
    //   var isSale = await datastore.isSale(initPriceId);
    //   assert.strictEqual(price.toString(), initPriceValue);
    //   assert.strictEqual(isSale, false);
    // });

    // it('can\'t set sale by not owner', async function () {
    //   await expectRevert(
    //     datastore.setSale(initPriceId, true, {
    //       from: notOwner
    //     })
    //   );
    // });

    // it('set sale status by owner', async function () {
    //   await datastore.setSale(initPriceId, true, {
    //     from: dataOwner
    //   });
    //   var isSale = await datastore.isSale(initPriceId);
    //   assert.strictEqual(isSale, true);
    // });
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

  // describe('buy data', async function () {
  //   before(async function () {
  //     await hart.methods.transfer(buyer, web3.utils.toWei("100")).send({
  //       from: owner
  //     });
  //   });

  //   it('can buy id 0 with hart', async function () {
  //     var haraBefore = await hart.methods.balanceOf(owner).call() / 10000000;
  //     var locationBefore = await hart.methods.balanceOf(initLocation).call() / 10000000;

  //     await hart.methods.buy(datastore.address, initPriceId, web3.utils.toWei("20")).send({
  //       from: buyer,
  //       gas: 3000000
  //     });
  //     var receipt = await hart.methods.getReceipt(1).call();
  //     assert.strictEqual(receipt.buyer, buyer);
  //     assert.strictEqual(receipt.seller, datastore.address);
  //     assert.strictEqual(receipt.id.toString(), web3.utils.padRight(initPriceId, 64));
  //     assert.strictEqual(receipt.value.toString(), web3.utils.toWei("20"));

  //     var permission = await datastore.getPurchaseStatus(buyer, initPriceId);
  //     assert.strictEqual(permission, true);

  //     var haraAfter = await hart.methods.balanceOf(owner).call() / 10000000;
  //     var locationAfter = await hart.methods.balanceOf(initLocation).call() / 10000000;

  //     assert.strictEqual(haraAfter - haraBefore, web3.utils.toWei("20") * 0.15 / 10000000)
  //     assert.strictEqual(locationAfter - locationBefore, web3.utils.toWei("20") * 0.05 / 10000000)
  //   });

  //   it('status is false for id 1', async function () {
  //     var permission = await datastore.getPurchaseStatus(buyer, web3.utils.fromAscii("1"));
  //     assert.strictEqual(permission, false);
  //   });

  //   it('can not buy directly to data store', async function () {
  //     await expectRevert(datastore.buy("1", {
  //       from: buyer
  //     }));
  //   });
  // });

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

  // describe('contract is Withdrawable', async function () {
  //   before(async function () {
  //     await hart.methods.transfer(datastore.address, web3.utils.toWei("10")).send({
  //       from: owner
  //     });
  //   });

  //   it('can withdraw by owner', async function () {
  //     var receipt = await datastore.withdraw(dataOwner, web3.utils.toWei("10"), {
  //       from: dataOwner
  //     });
  //     var BoughtLog = receipt.logs[0];
  //     assert.strictEqual(BoughtLog.event, "WithdrawnLog");
  //     assert.strictEqual(BoughtLog.args.to.toString(), dataOwner);
  //     assert.strictEqual(BoughtLog.args.from.toString(), datastore.address);
  //     assert.strictEqual(BoughtLog.args.value.toString(), web3.utils.toWei("10"));
  //   });

  //   it('can not withdraw by not owner', async function () {
  //     await expectRevert(
  //       datastore.withdraw(dataOwner, web3.utils.toWei("10"), {
  //         from: notOwner
  //       })
  //     );
  //   });
  //   it('can not withdraw if no hart to withdraw', async function () {
  //     await expectRevert(
  //       datastore.withdraw(dataOwner, web3.utils.toWei("1000"), {
  //         from: dataOwner
  //       })
  //     );
  //   });
  // });


  // describe('contract price using external contract', async function () {
  //   it('can set price address by owner non external price contract', async function () {
  //     var receipt = await datastore.setPriceAddress(ap.address, {
  //       from: dataOwner
  //     });
  //     var currentAddress = await datastore.priceAddress();
  //     assert.strictEqual(currentAddress.toLowerCase(), ap.address.toLowerCase());

  //     var PriceAddressChangedLog = receipt.logs[0];
  //     assert.strictEqual(PriceAddressChangedLog.event, "PriceAddressChangedLog");
  //     assert.strictEqual(PriceAddressChangedLog.args.by.toLowerCase(), dataOwner.toLowerCase());
  //     assert.strictEqual(PriceAddressChangedLog.args.oldAddress.toString(), "0x0000000000000000000000000000000000000000");
  //     assert.strictEqual(PriceAddressChangedLog.args.newAddress.toLowerCase(), ap.address.toLowerCase());
  //   });

  //   it('can not set price by not owner', async function () {
  //     await expectRevert(
  //       datastore.setPriceAddress(ap.address, {
  //         from: notOwner
  //       })
  //     );
  //   });

  //   it('can set price using external contract by owner', async function () {
  //     var receipt = await datastore.setPrice(initPriceId, "5000", {
  //       from: dataOwner
  //     });

  //     var logs = receipt.logs;
  //     assert.strictEqual(logs[0].event, "PriceChangedLog");
  //     assert.strictEqual(logs[0].args.id, web3.utils.padRight(initPriceId, 64));
  //     assert.strictEqual(logs[0].args.oldValue.toString(), "0");
  //     assert.strictEqual(logs[0].args.newValue.toString(), "5000");
  //   });

  //   it('can get price using external contract', async function () {
  //     var currentPrice = await datastore.getPrice(initPriceId);
  //     assert.strictEqual(currentPrice.toString(), "50");
  //   });
  // });

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