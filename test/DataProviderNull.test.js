const expectRevert = require("./helpers/expectRevert");

const DataProviderNull = artifacts.require('DataProviderNull');

contract('DataProviderNull', accounts => {
  let dataProvider;
  const owner = accounts[0];

  const initLocatioId = "1";
  const initPriceId = "0";

  before(async function () {
    dataProvider = await DataProviderNull.new({ from: owner });
  });

  it('can get null uri', async function () {
    const uri = await dataProvider.getUri(initLocatioId, initPriceId);
    assert.strictEqual(uri, "");
  });
});