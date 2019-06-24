const AdvancedPrice = artifacts.require('AdvancedPrice');
const ExchangeHARTIDR = artifacts.require('ExchangeHARTIDR');
const ExchangeRate = artifacts.require('ExchangeRate');

const expectRevert = require("./helpers/expectRevert");
const expectContractNotExists = require("./helpers/expectContractNotExists");
const encodeDecode = require("./helpers/encoderDecoder");
const logHelper = require("./helpers/LogsHelper");

contract('AdvancedPriceTest', accounts => {
  let ap;
  let exchange;
  let exchangeHartIdr;
  const owner = accounts[0];
  const notOwner = accounts[1];
  const exchangeOwner = accounts[2];
  const datastore = accounts[3];

  before(async function () {
    // deploy contract ExchangeHARTIDR
    exchangeHartIdr = await ExchangeHARTIDR.new({
      from: exchangeOwner
    });

    // set exchange owner as exchange changer
    await exchangeHartIdr.setExchangeChanger(exchangeOwner, {
      from: exchangeOwner
    });

    // deploy contract ExchangeRate
    exchange = await ExchangeRate.new(exchangeHartIdr.address, {
      from: exchangeOwner
    })

    // deploy contract exchange rate
    ap = await AdvancedPrice.new(
      exchange.address, {
        from: owner
      });
  });

  describe('can have price for specific address', async function () {
    before(async function () {
      // set hart rate
      await exchangeHartIdr.setExchangeRate(100, {
        from: exchangeOwner
      });
    });

    it('can not get price if base price is not set', async function () {
      await expectRevert(ap.getPrice(web3.utils.fromAscii("1"), {
        from: datastore
      }));
    });

    it('can set base price', async function () {
      var receipt = await ap.setPrice(web3.utils.fromAscii("1"), 5000, {
        from: datastore
      });
        var logs = receipt.receipt.rawLogs;
        var log = encodeDecode.decodeLogsByTopic(logHelper.IPriceable.PriceChangedLogTopic,
          logHelper.IPriceable.PriceChangedLogAbi, logs)[0];
        assert.strictEqual(log.itemAddress, ap.address);
        assert.strictEqual(log.id, web3.utils.padRight(web3.utils.fromAscii("1"), 64));
        assert.strictEqual(log.oldValue.toString(), "0");
        assert.strictEqual(log.newValue.toString(), "5000");

      var basePrice = await ap.basePrice(datastore, web3.utils.fromAscii("1"));
      assert.strictEqual(basePrice.toString(), "5000");

    });

    it('can get price using advanced price', async function () {
      var price = await ap.getPrice(web3.utils.fromAscii("1"), {
        from: datastore
      });
    });
  });

  describe('is sale always return true', async function () {
    it('can get price using advanced price', async function () {
      var isSale = await ap.isSale(web3.utils.fromAscii("1"));
      assert.strictEqual(isSale, true);
    });
  });


  describe('killed the contract', async function () {
    it('can not killed by not owner', async function () {
      await expectRevert(ap.kill({
        from: notOwner
      }));
    });

    it('killed by owner and can\'t access contract', async function () {
      await ap.kill({
        from: owner
      });
      await expectContractNotExists(ap.owner());
    });
  });
});