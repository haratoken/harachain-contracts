const HNS = artifacts.require('./HNSRegistry');
const Registrar = artifacts.require('./HaraRegistrar');
const HaraToken = artifacts.require('./HaraTokenPrivate');

const expectRevert = require("./../helpers/expectRevert");

contract('HaraRegistrar', accounts => {
    let hart;
    let hnsRegistry;
    let registrar;

    const rootOwner = accounts[0];
    const haraOwner = accounts[1];
    const devharaOwner = accounts[2];
    const registrarOwner = accounts[3];
    const blockchaindevharaOwner = accounts[4];
    const agentdevharaOwner = accounts[5];
    const dummyRegistrar = accounts[6];

    const haraHash = web3.utils.sha3("hara");
    const devHash = web3.utils.sha3("dev");
    const blockchainHash = web3.utils.sha3("blockchain");
    const agentHash = web3.utils.sha3("agent");

    const haraNamehash = "0x55bd9b4e23672e6dd82f8b7bd349e5722479ad1e90582f51cce66772ab933bf5";
    const devharaNamehash = "0xd93cd5307735da7b67876b30e536dea4e0c19ad7c528f196f2e22648dec8dc3f";
    const blockchaindevharanamehash = "0x85bf393d9f3d20f33edf5d4cb89520f83b4b1d608b979598e85c3fcad413719a"

    before(async function () {
        // deploy haratoken contract
        hart = await HaraToken.new({
            from: haraOwner
        });

        // deploy hns contract
        hnsRegistry = await HNS.new({
            from: rootOwner
        });

        // deploy registrar
        registrar = await Registrar.new(
            hnsRegistry.address,
            hart.address,
            {
            from: registrarOwner
        });

        await hnsRegistry.setRegistrar(dummyRegistrar, {
            from: rootOwner
        });

        // add .hara tld
        await hnsRegistry.setSubnodeOwner("0x0", haraHash, haraOwner, {
            from: dummyRegistrar
        });

        // add dev.hara domain
        await hnsRegistry.setSubnodeOwner(haraNamehash, devHash, devharaOwner, {
            from: dummyRegistrar
        });

        // add agent.dev.hara domain
        await hnsRegistry.setSubnodeOwner(devharaNamehash, agentHash, agentdevharaOwner, {
            from: dummyRegistrar
        });
    });

    it('owned by registrar owner', async function () {
        var owner = await registrar.owner();
        assert.strictEqual(owner, registrarOwner)
    });

    describe('have price and sale', async function () {

        it('can set price by registrar owner', async function () {
            var receipt = await registrar.setPrice(blockchainHash, web3.utils.toWei("1"), {from: registrarOwner});

            var logs = receipt.receipt.logs;
            assert.strictEqual(logs[0].event, "PriceChangedLog");
            assert.strictEqual(logs[0].args.id, blockchainHash);
            assert.strictEqual(logs[0].args.oldValue.toString(), "0");
            assert.strictEqual(logs[0].args.newValue.toString(), web3.utils.toWei("1").toString());
        });

        it('get current price', async function () {
            var currentPrice = await registrar.getPrice(blockchainHash);
            assert.strictEqual(currentPrice.toString(), web3.utils.toWei("1").toString());
        });

        it('get sale status false if no invoice request made', async function () {
            var isSale = await registrar.isSale(web3.utils.fromAscii("1"));
            assert.strictEqual(isSale, false);
        });
    });

    describe('register subnode using registrar', async function () {
        var requestId;
        before(async function(){
            // set registrar
            await hnsRegistry.setRegistrar(registrar.address, {from: rootOwner});
            // give hart to devharaowner
            await hart.mint(blockchaindevharaOwner, web3.utils.toWei("5"), {from: haraOwner});
            await hart.mint(devharaOwner, web3.utils.toWei("5"), {from: haraOwner});
        });

        it('request registrar', async function () {
            var receipt = await registrar.request(devharaNamehash, blockchainHash, blockchaindevharaOwner, {from: devharaOwner});
            var logs = receipt.receipt.logs;
            assert.strictEqual(logs[0].event, "SubnodeRequested");
            assert.strictEqual(logs[0].args.node, devharaNamehash);
            assert.strictEqual(logs[0].args.label, blockchainHash);
            assert.strictEqual(logs[0].args.owner, blockchaindevharaOwner);
            assert.strictEqual(logs[0].args.requestId.toString(), "0x0000000000000000000000000000000000000000000000000000000000000001");
            requestId = logs[0].args.requestId.toString()
        });

        it('register new subdomain on dev.hara', async function () {
            var receipt = await hart.buy(registrar.address, requestId, web3.utils.toWei("1"), {from: blockchaindevharaOwner});
            assert.strictEqual(receipt.receipt.rawLogs.length, 6);

            var owner = await hnsRegistry.owner(blockchaindevharanamehash);
            assert.strictEqual(owner, blockchaindevharaOwner)
        });

        it('can only call buy from hara token contract', async function () {
            await expectRevert(
                registrar.buy(requestId, {from: blockchaindevharaOwner})
            );
        });

        it('can only request by parent domain owner', async function () {
            await expectRevert(
                registrar.request(devharaNamehash, blockchainHash, blockchaindevharaOwner, {from: blockchaindevharaOwner})
            );
        });
    });
});
