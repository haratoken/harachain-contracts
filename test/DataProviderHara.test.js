const expectRevert = require("./helpers/expectRevert");

const DataProviderHara = artifacts.require('DataProviderHara');

contract('DataProviderHara', accounts => {
  let dataProvider;
  const owner = accounts[0];
  const notOwner = accounts[1];

  // const initLocatioId = web3.utils.asciiToHex("petaniA");
  const initLocatioId = "1";
  const initPriceId = "0";
  const initBuyer = accounts[3];
  const initEndpoint = "http://endpoint.hara.com/get_data";
  const initUri = initEndpoint + "?id=" + initLocatioId + "&&version=" + initPriceId + "&&address=" + initBuyer;

  before(async function () {
    dataProvider = await DataProviderHara.new({ from: owner });
  });

  it('can not get uri because endpoint not set', async function () {
    await expectRevert(
      dataProvider.getUri(initLocatioId, initPriceId, initBuyer)
    );
  });

  it('set endpoint by data provider owner', async function () {
    await dataProvider.setEndpoint(initEndpoint, {from: owner});
    const endpoint = await dataProvider.endpoint();
    assert.strictEqual(initEndpoint, endpoint);
  });

  it('can not set endpoint by not owner', async function () {
    await expectRevert(
      dataProvider.setEndpoint(initEndpoint, {from: notOwner})
    );
  });

  it('return Uri', async function () {
    const uri = await dataProvider.getUri(initLocatioId, initPriceId, initBuyer);
    assert.strictEqual(initUri, uri);
  });
});