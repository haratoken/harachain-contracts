const expectRevert = require("./helpers/expectRevert");

const DataProviderProxy = artifacts.require('DataProviderProxy');
const DataProviderHara = artifacts.require('DataProviderHara');

contract('DataProviderProxy', accounts => {
  let dataProvider;
  let dataProviderProxy;

  const owner = accounts[0];
  const notOwner = accounts[1];

  const initLocatioId = "1";
  const initPriceId = "0";
  const initEndpoint = "http://endpoint.hara.com/get_data";
  const initUri = initEndpoint + "?id=" + initLocatioId + "&&version=" + initPriceId;

  before(async function () {
    dataProvider = await DataProviderHara.new({ from: owner });
    dataProviderProxy = await DataProviderProxy.new(dataProvider.address, { from: owner });
    await dataProvider.setProxyAddress(dataProviderProxy.address, {from: owner});
  });

  it('can not get uri because endpoint not set', async function () {
    await expectRevert(
      dataProviderProxy.getUri(initLocatioId, initPriceId)
    );
  });

  it('set endpoint by data provider owner', async function () {
    const receipt = await dataProviderProxy.setEndpoint("0x0", initEndpoint, {from: owner});
    const log = receipt.receipt.logs[0];
    assert.strictEqual(log.event, "ProxyLog");
  });

  it('can not set endpoint by not owner', async function () {
    await expectRevert(
      dataProviderProxy.setEndpoint("0x0", initEndpoint, {from: notOwner})
    );
  });

  it('return Uri', async function () {
    const uri = await dataProviderProxy.getUri(initLocatioId, initPriceId);
    assert.strictEqual(initUri, uri);
  });
});