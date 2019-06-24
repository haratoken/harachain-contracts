const ExchangeHARTIDR = artifacts.require('ExchangeHARTIDR');
const ExchangeRate = artifacts.require('ExchangeRate');

const encodeDecode = require("./helpers/encoderDecoder");
const expectRevert = require("./helpers/expectRevert");
const expectContractNotExists = require("./helpers/expectContractNotExists");
const logHelper = require("./helpers/LogsHelper");

contract('ExchangeHARTIDR', accounts => {
    let exchange;
    let exchangeHartIdr;

    const exchangeOwner = accounts[0];
    const exchangeChanger = accounts[1];
    const notOwner = accounts[2];

    before(async function () {
        // deploy contract ExchangeHARTIDR
        exchangeHartIdr = await ExchangeHARTIDR.new({
            from: exchangeOwner
        });

        // deploy contract ExchangeRate
        exchange = await ExchangeRate.new(exchangeHartIdr.address, {
            from: exchangeOwner
        })
    });

    it('have owner', async function () {
        var ownerContract = await exchange.owner();
        assert.strictEqual(ownerContract, exchangeOwner);
    });

    describe('connect with other exchange rate contract', async function () {
        it('contract address saved on storage', async function () {
            var rateAddress = await exchange.rateAddress();
            assert.strictEqual(rateAddress, exchangeHartIdr.address);
        });
        it('can not get rate if rate not set', async function () {
            await expectRevert(exchange.getRate());
        });
    });

    describe('can have price base on exchange rate', async function () {
        before(async function () {
            // set exchange changer
            await exchangeHartIdr.setExchangeChanger(exchangeChanger, {
                from: exchangeOwner
            });
            // set rate
            await exchangeHartIdr.setExchangeRate(400, {
                from: exchangeChanger
            });
        });
        it('can get current rate', async function () {
            var rate = await exchange.getRate();
            assert.strictEqual(rate.toString(), "400");
        });
        it('can get price based on rate', async function () {
            var price = await exchange.getPrice(2000);
            assert.strictEqual(price.toString(), "5");
        });
    });

    describe('killed the contract', async function () {
        it('can not killed by not owner', async function () {
            await expectRevert(exchange.kill({
                from: notOwner
            }));
        });

        it('killed by owner and can\'t access contract', async function () {
            await exchange.kill({
                from: exchangeOwner
            });
            await expectContractNotExists(exchange.owner());
        });
    });
});