const ExchangeHARTIDR = artifacts.require('ExchangeHARTIDR');

const encodeDecode = require("./helpers/encoderDecoder");
const expectRevert = require("./helpers/expectRevert");
const expectContractNotExists = require("./helpers/expectContractNotExists");
const logHelper = require("./helpers/LogsHelper");

contract('ExchangeHARTIDR', accounts => {
    let exchange;

    const exchangeOwner = accounts[0];
    const exchangeRateSet = accounts[1];
    const notOwner = accounts[2];

    before(async function () {
        // deploy contract
        exchange = await ExchangeHARTIDR.new({
            from: exchangeOwner
        });
    });

    describe('can have exchange changer', async function () {
        it('can set exchange changer by owner', async function () {
            var receipt = await exchange.setExchangeChanger(exchangeRateSet, {
                from: exchangeOwner
            });

            var logs = receipt.receipt.rawLogs;
            var log = encodeDecode.decodeLogsByTopic(logHelper.ExchangeHartIdr.ExchangeChangerChangedLogTopic,
                logHelper.ExchangeHartIdr.ExchangeChangerChangedLogAbi, logs)[0];
            assert.strictEqual(log.by, exchangeOwner);
            assert.strictEqual(log.oldAddress, "0x0000000000000000000000000000000000000000");
            assert.strictEqual(log.newAddress, exchangeRateSet);

            var exchangeAddr = await exchange.exchangeChanger();
            assert.strictEqual(exchangeAddr, exchangeRateSet);
        });

        it('can not set exchange changer by not owner', async function () {
            await expectRevert(
                exchange.setExchangeChanger(notOwner, {
                    from: notOwner
                })
            )
        });
        describe('can have exchange rate', async function () {
            it('can set exchange rate by exchange changer', async function () {
                var receipt = await exchange.setExchangeRate(100, {
                    from: exchangeRateSet
                });

                  var logs = receipt.receipt.rawLogs;
                  var log = encodeDecode.decodeLogsByTopic(logHelper.ExchangeHartIdr.ExchangeRateChangedLogTopic,
                    logHelper.ExchangeHartIdr.ExchangeRateChangedLogLogAbi, logs)[0];
                  assert.strictEqual(log.by, exchangeRateSet);
                  assert.strictEqual(log.oldRate, "0");
                  assert.strictEqual(log.newRate.toString(), "100");
            });

            it('can get latest update exchange rate', async function () {
                var rate = await exchange.getRate();
                assert.strictEqual(rate.toString(), "100");
            });

            it('can not set exchange rate by not exchange changer', async function () {
                await expectRevert(
                    exchange.setExchangeRate(110, {
                        from: notOwner
                    }))
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
});