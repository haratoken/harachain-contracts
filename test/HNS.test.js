const HNS = artifacts.require('./HNSRegistry');

const expectRevert = require("./helpers/expectRevert");
const encoderDecoder = require("./helpers/encoderDecoder");
const logsDetail = require("./helpers/LogsHelper");

contract('HNS', accounts => {
    let hnsRegistry;

    const rootOwner1 = accounts[0];
    const rootOwner2 = accounts[1];
    const haraOwner = accounts[2];
    const devharaOwner = accounts[3];
    const notOwner = accounts[4];
    const dummyResolver = accounts[5];
    const dummyRegistrar = accounts[6];

    const haraHash = web3.utils.sha3("hara");
    const devHash = web3.utils.sha3("dev");

    const haraNamehash = "0x55bd9b4e23672e6dd82f8b7bd349e5722479ad1e90582f51cce66772ab933bf5";
    const devharaNamehash = "0xd93cd5307735da7b67876b30e536dea4e0c19ad7c528f196f2e22648dec8dc3f";

    before(async function () {
        // deploy hns contract
        hnsRegistry = await HNS.new({
            from: rootOwner1
        });
    });

    it('0x0 owns by owner', async function () {
        var owner = await hnsRegistry.owner("0x00");
        assert.strictEqual(owner, rootOwner1);
    });

    describe('change owner of node', async function () {

        it('change owner by owner', async function () {
            var ownerBefore = await hnsRegistry.owner("0x0");
            var receipt = await hnsRegistry.setOwner("0x0", rootOwner2, {
                from: rootOwner1
            });
            var ownerAfter = await hnsRegistry.owner("0x0");
            assert.strictEqual(ownerBefore, rootOwner1);
            assert.strictEqual(ownerAfter, rootOwner2);
            assert.notStrictEqual(ownerBefore, ownerAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "Transfer");
            assert.strictEqual(log.args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.strictEqual(log.args.owner, rootOwner2);
        });

        it('can not change owner by not owner', async function () {
            await expectRevert(
                hnsRegistry.setOwner("0x0", notOwner, {
                    from: notOwner
                })
            );
        });

        after(async function () {
            // change owner to address who deployed the contract (rootOwner1)
            await hnsRegistry.setOwner("0x0", rootOwner1, {
                from: rootOwner2
            });
        });
    });

    describe('set and change owner of subnode', async function () {
        it('set .hara tld', async function () {
            var ownerBefore = await hnsRegistry.owner(haraNamehash);
            var receipt = await hnsRegistry.setSubnodeOwner("0x0", haraHash, haraOwner, {
                from: rootOwner1
            });
            var ownerAfter = await hnsRegistry.owner(haraNamehash);
            assert.strictEqual(ownerBefore, "0x0000000000000000000000000000000000000000");
            assert.strictEqual(ownerAfter, haraOwner);
            assert.notStrictEqual(ownerBefore, ownerAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "NewOwner");
            assert.strictEqual(log.args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.strictEqual(log.args.label, haraHash);
            assert.strictEqual(log.args.owner, haraOwner);
        });

        it('can not set .test tld  by not owner', async function () {
            await expectRevert(
                hnsRegistry.setSubnodeOwner("0x0", web3.utils.sha3("test"), notOwner, {
                    from: notOwner
                })
            );
        });

        it('set dev.hara domain', async function () {
            var ownerBefore = await hnsRegistry.owner(devharaNamehash);
            var receipt = await hnsRegistry.setSubnodeOwner(haraNamehash, devHash, devharaOwner, {
                from: haraOwner
            });
            var ownerAfter = await hnsRegistry.owner(devharaNamehash);
            assert.strictEqual(ownerBefore, "0x0000000000000000000000000000000000000000");
            assert.strictEqual(ownerAfter, devharaOwner);
            assert.notStrictEqual(ownerBefore, ownerAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "NewOwner");
            assert.strictEqual(log.args.node, haraNamehash);
            assert.strictEqual(log.args.label, devHash);
            assert.strictEqual(log.args.owner, devharaOwner);
        });
    });

    describe('set resolver', async function () {
        it('can set resolver by owner', async function () {
            var resolverBefore = await hnsRegistry.resolver(devharaNamehash);
            var receipt = await hnsRegistry.setResolver(devharaNamehash, dummyResolver, {
                from: devharaOwner
            });
            var resolverAfter = await hnsRegistry.resolver(devharaNamehash);
            assert.strictEqual(resolverBefore, "0x0000000000000000000000000000000000000000");
            assert.strictEqual(resolverAfter, dummyResolver);
            assert.notStrictEqual(resolverBefore, resolverAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "NewResolver");
            assert.strictEqual(log.args.node, devharaNamehash);
            assert.strictEqual(log.args.resolver, dummyResolver);
        });

        it('can not set resolver by not owner', async function () {
            await expectRevert(
                hnsRegistry.setResolver(devharaNamehash, dummyResolver, {
                    from: notOwner
                })
            )
        })
    });

    describe('set ttl', async function () {
        it('can set ttl by owner', async function () {
            var ttlBefore = await hnsRegistry.ttl(devharaNamehash);
            var receipt = await hnsRegistry.setTTL(devharaNamehash, 5, {
                from: devharaOwner
            });
            var ttlAfter = await hnsRegistry.ttl(devharaNamehash);
            assert.strictEqual(ttlBefore.toString(), "0");
            assert.strictEqual(ttlAfter.toString(), "5");
            assert.notStrictEqual(ttlBefore, ttlAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "NewTTL");
            assert.strictEqual(log.args.node, devharaNamehash);
            assert.strictEqual(log.args.ttl.toString(), "5");
        });

        it('can not set resolver by not owner', async function () {
            await expectRevert(
                hnsRegistry.setResolver(devharaNamehash, dummyResolver, {
                    from: notOwner
                })
            )
        })
    });

    describe('have activeRegistrar', async function () {
        it('can set registrar by owner', async function () {
            var registrarBefore = await hnsRegistry.activeRegistrar();
            var receipt = await hnsRegistry.setRegistrar(dummyRegistrar, {
                from: rootOwner1
            });
            var registrarAfter = await hnsRegistry.activeRegistrar();
            assert.strictEqual(registrarBefore.toString(), "0x0000000000000000000000000000000000000000");
            assert.strictEqual(registrarAfter.toString(), dummyRegistrar);
            assert.notStrictEqual(registrarBefore, registrarAfter);

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "RegistrarChanged");
            assert.strictEqual(log.args.oldRegistrar, "0x0000000000000000000000000000000000000000");
            assert.strictEqual(log.args.newRegistrar, dummyRegistrar);
        });

        it('can not set registrar by not owner', async function () {
            await expectRevert(
                hnsRegistry.setRegistrar(dummyRegistrar, {
                    from: notOwner
                })
            )
        });

        it('can set new subnode by registrar if registrar is set', async function () {
            var ownerBefore = await hnsRegistry.owner("0xc228250cd567687ff7faee5c63fb721b525b63beaba08a87df1eeaea0120f79d");
            var receipt = await hnsRegistry.setSubnodeOwner(devharaNamehash, "0x8c9e37c3d5f4d11153908eeaa7d86bcdf59b3478f4b3854a0ac463b58b1110d9",
            devharaOwner, {
                from: dummyRegistrar
            });
            var ownerAfter = await hnsRegistry.owner("0xc228250cd567687ff7faee5c63fb721b525b63beaba08a87df1eeaea0120f79d");
            assert.strictEqual(ownerBefore, "0x0000000000000000000000000000000000000000");
            assert.strictEqual(ownerAfter, devharaOwner);
            assert.notStrictEqual(ownerBefore, ownerAfter)

            const log = receipt.receipt.logs[0];
            assert.strictEqual(log.event, "NewOwner");
            assert.strictEqual(log.args.node, devharaNamehash);
            assert.strictEqual(log.args.label, "0x8c9e37c3d5f4d11153908eeaa7d86bcdf59b3478f4b3854a0ac463b58b1110d9");
            assert.strictEqual(log.args.owner, devharaOwner);
        });

        it('can not set new subnode by parent owner if registrar is set', async function () {
            await expectRevert(
                hnsRegistry.setSubnodeOwner(devharaNamehash, "0xe3c2047d1585216bd5d32ce945e193c651c42e76e847e4c66a4ec43fe8f2177e",
                devharaOwner, {
                    from: devharaOwner
                })
            )
        });
    });
});