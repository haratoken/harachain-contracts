const HNS = artifacts.require('./HNSRegistry');
const Resolver = artifacts.require('./HaraResolver');

const expectRevert = require("./../helpers/expectRevert");

contract('HaraResolver', accounts => {
    let hnsRegistry;
    let resolver;

    const rootOwner = accounts[0];
    const haraOwner = accounts[1];
    const devharaOwner = accounts[2];
    const notOwner = accounts[4];
    const dummyRegistrar = accounts[5];

    const haraHash = web3.utils.sha3("hara");
    const devHash = web3.utils.sha3("dev");

    const haraNamehash = "0x55bd9b4e23672e6dd82f8b7bd349e5722479ad1e90582f51cce66772ab933bf5";
    const devharaNamehash = "0xd93cd5307735da7b67876b30e536dea4e0c19ad7c528f196f2e22648dec8dc3f";

    before(async function () {
        // deploy hns contract
        hnsRegistry = await HNS.new({
            from: rootOwner
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

        // deploy resolver
        resolver = await Resolver.new(hnsRegistry.address, {
            from: devharaOwner
        });


    });

    describe('check supported interface', async function () {

        it('true if supported', async function () {
            // check address
            var isSupport = await resolver.supportsInterface("0x3b3b57de");
            assert.strictEqual(isSupport, true)
        });
        it('false if not supported', async function () {
            // check non supported
            var isSupport = await resolver.supportsInterface("0x5b0fc9c3");
            assert.strictEqual(isSupport, false)
        });
    });

    describe('change address of dev.hara', async function () {

        it('change address of dev.hara by domain owner', async function () {
            var addressBefore = await resolver.addr(devharaNamehash);
            var receipt = await resolver.setAddr(devharaNamehash, devharaOwner, {
                from: devharaOwner
            });
            var addressAfter = await resolver.addr(devharaNamehash);
            assert.strictEqual(addressBefore, "0x0000000000000000000000000000000000000000");
            assert.strictEqual(addressAfter, devharaOwner);
            assert.notStrictEqual(addressBefore, addressAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "AddrChanged");
            assert.strictEqual(log.args.node, devharaNamehash);
            assert.strictEqual(log.args.a, devharaOwner);
        });

        it('change address of dev.hara by not domain owner', async function () {
            await expectRevert(
                resolver.setAddr(devharaNamehash, devharaOwner, {
                    from: notOwner
                })
            );
        });

    });

    describe('change content of dev.hara', async function () {

        it('change content of dev.hara by domain owner', async function () {
            var contentBefore = await resolver.content(devharaNamehash);
            var receipt = await resolver.setContent(devharaNamehash, web3.utils.sha3("this is content"), {
                from: devharaOwner
            });
            var contentAfter = await resolver.content(devharaNamehash);
            assert.strictEqual(contentBefore, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.strictEqual(contentAfter, web3.utils.sha3("this is content"));
            assert.notStrictEqual(contentBefore, contentAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "ContentChanged");
            assert.strictEqual(log.args.node, devharaNamehash);
            assert.strictEqual(log.args.hash, web3.utils.sha3("this is content"));
        });

        it('change content of dev.hara by not domain owner', async function () {
            await expectRevert(
                resolver.setContent(devharaNamehash, web3.utils.sha3("this is content"), {
                    from: notOwner
                })
            );
        });
    });

    describe('change name of dev.hara', async function () {

        it('change name of dev.hara by domain owner', async function () {
            var nameBefore = await resolver.name(devharaNamehash);
            var receipt = await resolver.setName(devharaNamehash, "hara.dev", {
                from: devharaOwner
            });
            var nameAfter = await resolver.name(devharaNamehash);
            assert.strictEqual(nameBefore, "");
            assert.strictEqual(nameAfter, "hara.dev");
            assert.notStrictEqual(nameBefore, nameAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "NameChanged");
            assert.strictEqual(log.args.node, devharaNamehash);
            assert.strictEqual(log.args.name, "hara.dev");
        });

        it('change name of dev.hara by not domain owner', async function () {
            await expectRevert(
                resolver.setName(devharaNamehash, "hara.dev", {
                    from: notOwner
                })
            );
        });
    });

    // [WIP]
    describe('change abi of dev.hara', async function () {
        const ABI = web3.utils.toHex('[{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"status","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"buy","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]');

        it('change abi of dev.hara by domain owner', async function () {
            var abiBefore = await resolver.ABI(devharaNamehash, 1);
            var receipt = await resolver.setABI(devharaNamehash, 1, ABI, {
                from: devharaOwner
            });
            var abiAfter = await resolver.ABI(devharaNamehash, "0001");
            // assert.strictEqual(abiBefore.contentType.toString(), "0");
            // assert.strictEqual(abiBefore.data, null);
            // assert.strictEqual(abiAfter.contentType.toString(), "1");
            // assert.strictEqual(abiAfter.data, ABI);
            // assert.notStrictEqual(abiBefore, abiAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "ABIChanged");
            assert.strictEqual(log.args.node, devharaNamehash);
            assert.strictEqual(log.args.contentType.toString(), "1");
        });

        it('change abi of dev.hara by not domain owner', async function () {
            await expectRevert(
                resolver.setABI(devharaNamehash, 1, ABI, {
                    from: notOwner
                })
            );
        });
    });

    describe('change pubkey of dev.hara', async function () {

        it('change pubkey of dev.hara by domain owner', async function () {
            var pubkeyBefore = await resolver.pubkey(devharaNamehash);
            var receipt = await resolver.setPubkey(devharaNamehash, web3.utils.sha3("1"), web3.utils.sha3("2"), {
                from: devharaOwner
            });
            var pubkeyAfter = await resolver.pubkey(devharaNamehash);
            assert.strictEqual(pubkeyBefore.x, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.strictEqual(pubkeyBefore.y, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.strictEqual(pubkeyAfter.x, web3.utils.sha3("1"));
            assert.strictEqual(pubkeyAfter.y, web3.utils.sha3("2"));
            assert.notStrictEqual(pubkeyBefore, pubkeyAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "PubkeyChanged");
            assert.strictEqual(log.args.node, devharaNamehash);
            assert.strictEqual(log.args.x, web3.utils.sha3("1"));
            assert.strictEqual(log.args.y, web3.utils.sha3("2"));
        });

        it('change pubkey of dev.hara by not domain owner', async function () {
            await expectRevert(
                resolver.setPubkey(devharaNamehash, web3.utils.sha3("1"), web3.utils.sha3("2"), {
                    from: notOwner
                })
            );
        });
    });

    describe('change text of dev.hara', async function () {

        it('change text of dev.hara by domain owner', async function () {
            var textBefore = await resolver.text(devharaNamehash, "value");
            var receipt = await resolver.setText(devharaNamehash, "value", "test", {
                from: devharaOwner
            });
            var textAfter = await resolver.text(devharaNamehash, "value");
            assert.strictEqual(textBefore, "");
            assert.strictEqual(textAfter, "test");
            assert.notStrictEqual(textBefore, textAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "TextChanged");
            assert.strictEqual(log.args.node, devharaNamehash);
            assert.strictEqual(log.args.indexedKey, web3.utils.sha3("value"));
            assert.strictEqual(log.args.key, "value");
        });

        it('change content of dev.hara by not domain owner', async function () {
            await expectRevert(
                resolver.setText(devharaNamehash, "value", "test", {
                    from: notOwner
                })
            );
        });
    });
});