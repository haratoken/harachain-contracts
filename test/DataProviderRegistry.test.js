const expectRevert = require("./helpers/expectRevert");

const DataProviderRegistry = artifacts.require('DataProviderRegistry');
const DataProvider = artifacts.require("DataProviderHara");

contract('DataProviderRegistry', accounts => {
  let dataProviderRegistry;
  let dataProvider;

  const owner = accounts[0];
  const notOwner = accounts[1];
  const auditor1 = accounts[2];
  const auditor2 = accounts[3];
  const dataProvider1= accounts[4];
  const dataProvider2 = accounts[5];

  before(async function () {
    dataProviderRegistry = await DataProviderRegistry.new({ from: owner });
    dataProvider = await DataProvider.new({ from: dataProvider1 });
  });

  it('have owner', async function () {
    const contractOwner = await dataProviderRegistry.owner();
    assert.strictEqual(contractOwner, owner);
  });

  it('can not add editor by not owner', async function () {
    await expectRevert(
      dataProviderRegistry.addAuditor(auditor1, {from: notOwner})
    );
  });

  it('can add editor by owner', async function () {
    await dataProviderRegistry.addAuditor(auditor1, {from: owner});
    const totalAuditor1 = await dataProviderRegistry.totalAuditors();
    const currentAuditor1 = await dataProviderRegistry.auditors(auditor1);
    assert.strictEqual(totalAuditor1.toString(), "1");
    assert.strictEqual(currentAuditor1, true);

    await dataProviderRegistry.addAuditor(auditor2, {from: owner});
    const totalAuditor2 = await dataProviderRegistry.totalAuditors();
    const currentAuditor2 = await dataProviderRegistry.auditors(auditor2);
    assert.strictEqual(totalAuditor2.toString(), "2");
    assert.strictEqual(currentAuditor2, true);
  });

  it('can give score to data provider by auditor', async function () {
    await dataProviderRegistry.scoreDataProvider(dataProvider1, 10, {from : auditor1});
    const testScore = await dataProviderRegistry.scores(dataProvider1, auditor1, {from:owner});
    assert.strictEqual(testScore.toString(), "10");
  });

  it('can remove editor by owner', async function () {
    await dataProviderRegistry.removeAuditor(auditor2, {from: owner});
    const totalAuditor = await dataProviderRegistry.totalAuditors();
    const currentAuditor = await dataProviderRegistry.auditors(auditor2);
    assert.strictEqual(totalAuditor.toString(), "1");
    assert.strictEqual(currentAuditor, false);
    assert.notEqual(currentAuditor, true);
  });

  describe('register new data provider', async function () {
    it('can register new data provider by owner', async function () {  
    await dataProviderRegistry.register(dataProvider.address, {from : owner})
    });
  });
});