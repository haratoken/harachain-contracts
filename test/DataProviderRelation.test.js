const expectRevert = require("./helpers/expectRevert");

const DataProviderRelation = artifacts.require('DataProviderRelation');

contract('DataProviderRelation', accounts => {
  let dataProvider;
  const owner = accounts[0];
  const notOwner = accounts[1];
  const dummyData = accounts[2];

  const initVersion1 = "0";
  const initVersion2 = "1"
  const dataWithVersion1 = dummyData+initVersion1;
  const dataWithVersion2 = dummyData+initVersion2;

  before(async function () {
    dataProvider = await DataProviderRelation.new({ from: owner });
  });

  it('set endpoint by data provider owner', async function () {
    const receipt = await dataProvider.setEndpoint(web3.utils.soliditySha3({t:'string', v:dummyData}, {t:'string',v:initVersion1}), dataWithVersion2, {from: owner});
    const log = receipt.receipt.logs[0]
    assert.strictEqual(log.event, "EndpointChangedLog");
    assert.strictEqual(log.args.oldEndpoint, "")
    assert.strictEqual(log.args.newEndpoint, dataWithVersion2);
    assert.strictEqual(log.args.by, owner);
  });

  it('can not set endpoint by not owner', async function () {
    await expectRevert(
        dataProvider.setEndpoint(web3.utils.soliditySha3({t:'string', v:dummyData}, {t:'string',v:initVersion1}), "test", {from: notOwner})
    );
  });

  it('return Uri', async function () {
    const uri = await dataProvider.getUri(dummyData, initVersion1);
    assert.strictEqual(uri, dataWithVersion2);
  });
});