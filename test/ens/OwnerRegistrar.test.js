const HNS = artifacts.require('./HNSRegistry');
const Registrar = artifacts.require('./OwnerRegistrar');

const expectRevert = require("./../helpers/expectRevert");

contract('OwnerRegistrar', accounts => {
    let hnsRegistry;
    let registrar;

    const rootOwner = accounts[0];
    const haraOwner = accounts[1];
    const devharaOwner = accounts[2];
    const registrarOwner = accounts[3];
    const notOwner = accounts[4];

    const haraHash = web3.utils.sha3("hara");
    const devHash = web3.utils.sha3("dev");

    const haraNamehash = "0x55bd9b4e23672e6dd82f8b7bd349e5722479ad1e90582f51cce66772ab933bf5";
    const devharaNamehash = "0xd93cd5307735da7b67876b30e536dea4e0c19ad7c528f196f2e22648dec8dc3f";

    before(async function () {
        // deploy hns contract
        hnsRegistry = await HNS.new({
            from: rootOwner
        });

        // deploy registrar
        registrar = await Registrar.new(
            hnsRegistry.address,
            {
            from: registrarOwner
        });

        await hnsRegistry.setRegistrar(registrar.address, {
            from: rootOwner
        });
    });

    it('owned by registrar owner', async function () {
        var owner = await registrar.owner();
        assert.strictEqual(owner, registrarOwner)
    });

    describe('register subnode using registrar', async function () {

        it('register new subdomain on .hara', async function () {
            var receipt = await registrar.register("0x0", haraHash, haraOwner, {from: registrarOwner});
            var owner = await hnsRegistry.owner(haraNamehash);
            assert.strictEqual(owner, haraOwner);
        });

        it('can not register new subdomain on dev.hara by not owner', async function () {
            await expectRevert(registrar.register(haraNamehash, devHash, devharaOwner, {from: notOwner})
            );
            var owner = await hnsRegistry.owner(devharaNamehash);
            assert.notEqual(owner, devharaOwner);
            assert.strictEqual(owner, "0x0000000000000000000000000000000000000000");
        });
    });
});
