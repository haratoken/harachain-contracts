const Order = artifacts.require('Order');
const HaraToken = artifacts.require('HaraTokenPrivate');
const DataFactory = artifacts.require('DataFactory');
const DataFactoryRegistry = artifacts.require('DataFactoryRegistry');
const DataStore = artifacts.require('DataStore');

const encoderDecoder = require("./helpers/encoderDecoder")
const expectRevert = require("./helpers/expectRevert")
const logsDetail = require("./helpers/LogsHelper")
const expectContractNotExists = require("./helpers/expectContractNotExists")

contract('Order', accounts => {
    let hart;
    let initHartAddress;
    let order;
    let dataFactory;
    let dataFactoryRegistry;

    const owner = accounts[0];
    const notOwner = accounts[1];
    const hartOwner = accounts[2]; // hart owner
    const orderOwner1 = accounts[3];
    const orderOwner2 = accounts[4];

    const seller1 = {
        address: accounts[5],
        version1: web3.utils.fromAscii("1")
    };
    const seller2 = {
        address: accounts[6],
        version1: web3.utils.fromAscii("1")
    };

    const initLocation = web3.utils.toChecksumAddress("0xca35b7d915458ef540ade6068dfe2f44e8fa733c");
    const initSignature = "0x430dec04b9ebe807ce8fb9b0d025861c13f5e36f226c12469ff6f89fb217fa9f";
    const initSignatureFunc = "keccak";

    const OrderCreatedTopic = logsDetail.Order.OrderCreatedTopic;
    const OrderCreatedAbi = logsDetail.Order.OrderCreatedAbi;
    const OrderAddedTopic = logsDetail.Order.OrderAddedTopic;
    const OrderAddedAbi = logsDetail.Order.OrderAddedAbi;

    const OrderCancelledTopic = logsDetail.Order.OrderCancelledTopic;
    const OrderCancelledAbi = logsDetail.Order.OrderCancelledAbi;

    const OrderAlreadyExistsTopic = logsDetail.Order.OrderAlreadyExistsTopic;
    const OrderAlreadyExistsAbi = logsDetail.Order.OrderAlreadyExistsAbi;

    const DataCreationLogTopic = logsDetail.DataFactory.DataCreationLogTopic;
    const DataCreationLogAbi = logsDetail.DataFactory.DataCreationLogAbi;


    before(async function () {
        // deploy hara token contract
        hart = await HaraToken.new({
            from: hartOwner
        })
        initHartAddress = hart.address;
        console.log(initHartAddress);

        await hart.mint(owner, web3.utils.toWei("1000"), {
            from: hartOwner
        });

        // deploy order contract
        order = await Order.new(initHartAddress, {
            from: owner
        });
        console.log("order", order.address);

        // deploy data factory contract
        dataFactory = await DataFactory.new(initHartAddress, {
            from: hartOwner
        });
        console.log("dataFactory", dataFactory.address);

        //deploy data factory registry contract
        dataFactoryRegistry = await DataFactoryRegistry.new(dataFactory.address, {
            from: hartOwner
        });
        console.log("dataFactoryRegistry", dataFactoryRegistry.address);

        // create data store 1
        seller1.receipt = await dataFactoryRegistry.storeData(
            seller1.address,
            initLocation,
            web3.utils.asciiToHex(initSignature),
            web3.utils.asciiToHex(initSignatureFunc), {
                from: seller1.address
            }
        );

        const logs1 = seller1.receipt.receipt.rawLogs;
        const DataCreationLog1 = encoderDecoder.decodeLogsByTopic(DataCreationLogTopic, DataCreationLogAbi, logs1)[0];
        seller1.dataAddress = DataCreationLog1.contractDataAddress;
        seller1.data = await DataStore.at(seller1.dataAddress);
        console.log("datastore1", seller1.dataAddress);

        await seller1.data.setSale(seller1.version1, true, {
            from: seller1.address
        });
        await seller1.data.setPrice(seller1.version1, web3.utils.toWei("1"), {
            from: seller1.address
        });

        // create data store 2
        seller2.receipt = await dataFactoryRegistry.storeData(
            seller2.address,
            initLocation,
            web3.utils.asciiToHex(initSignature),
            web3.utils.asciiToHex(initSignatureFunc), {
                from: seller2.address
            }
        );

        const logs2 = seller2.receipt.receipt.rawLogs;
        const DataCreationLog2 = encoderDecoder.decodeLogsByTopic(DataCreationLogTopic, DataCreationLogAbi, logs2)[0];
        seller2.dataAddress = DataCreationLog2.contractDataAddress;
        seller2.data = await DataStore.at(seller2.dataAddress);
        console.log("datastore2", seller2.dataAddress);

        await seller2.data.setPrice(seller2.version1, web3.utils.toWei("5"), {
            from: seller2.address
        });
        await seller2.data.setSale(seller2.version1, true, {
            from: seller2.address
        });
    });

    // describe('create order', async function () {
    //     it('can create order without initial data address to order', async function () {
    //         var receipt = await order.createOrder({
    //             from: orderOwner1
    //         });

    //         var logs = receipt.receipt.rawLogs;
    //         var CreateOrderLog = encoderDecoder.decodeLogsByTopic(OrderCreatedTopic, OrderCreatedAbi, logs)[0];
    //         var addressActiveId = await order.isActive(orderOwner1);

    //         // cek order transaction
    //         //cek is active
    //         assert.strictEqual(addressActiveId.toString(), CreateOrderLog.orderId.toString());
    //         assert.notStrictEqual(addressActiveId.toString(), "0");
    //         //cek logs
    //         assert.strictEqual(CreateOrderLog.__length__, 3);
    //         assert.strictEqual(CreateOrderLog.orderId.toString(), "1");
    //         assert.strictEqual(CreateOrderLog.buyer, orderOwner1);
    //     });

    //     it('can create order with initial data address to order', async function () {
    //         var receipt = await order.createOrder([seller1.dataAddress, seller2.dataAddress], [seller1.version1, seller2.version1], {
    //             from: orderOwner2
    //         });

    //         var logs = receipt.receipt.rawLogs;
    //         var CreateOrderLog = encoderDecoder.decodeLogsByTopic(OrderCreatedTopic, OrderCreatedAbi, logs)[0];
    //         var addressActiveId = await order.isActive(orderOwner2);

    //         //cek is active
    //         assert.strictEqual(addressActiveId.toString(), CreateOrderLog.orderId);
    //         assert.notStrictEqual(addressActiveId.toString(), "0");

    //         //cek logs
    //         assert.strictEqual(CreateOrderLog.__length__, 3);
    //         assert.strictEqual(CreateOrderLog.orderId.toString(), "2");
    //         assert.strictEqual(CreateOrderLog.buyer, orderOwner2);
    //     });

    //     it('can not create order if address still have active order', async function () {
    //         await expectRevert(
    //             order.createOrder({
    //                 from: orderOwner1
    //             })
    //         )
    //     });
    // });
    // describe('add order', async function () {
    //     it('can add order by order owner', async function () {
    //         var receipt = await order.addOrder(1, [seller1.dataAddress, seller2.dataAddress], [seller1.version1, seller2.version1], {
    //             from: orderOwner1
    //         });
    //         var logs = receipt.receipt.rawLogs;
    //         var OrderAddedLog = encoderDecoder.decodeLogsByTopic(OrderAddedTopic, OrderAddedAbi, logs);

    //         //cek is active
    //         var addressActiveId = await order.isActive(orderOwner1);            
    //         assert.strictEqual(addressActiveId.toString(), OrderAddedLog[0].orderId.toString());
    //         assert.notStrictEqual(addressActiveId.toString(), "0");

    //         //cek logs
    //         assert.strictEqual(OrderAddedLog[0].__length__, 3);
    //         assert.strictEqual(OrderAddedLog[0].orderId.toString(), "1");
    //         assert.strictEqual(OrderAddedLog[0].sellerAddress.toString(), seller1.dataAddress);
    //         assert.strictEqual(OrderAddedLog[0].version, web3.utils.padRight(seller1.version1, 64));
    //         assert.strictEqual(OrderAddedLog[1].__length__, 3);
    //         assert.strictEqual(OrderAddedLog[1].orderId.toString(), "1");
    //         assert.strictEqual(OrderAddedLog[1].sellerAddress.toString(), seller2.dataAddress);
    //         assert.strictEqual(OrderAddedLog[1].version, web3.utils.padRight(seller2.version1, 64));
    //     });

    //     it('can add order by order owner, skip if seller and version already included', async function () {
    //         var receipt = await order.addOrder(1, [seller1.dataAddress], [seller1.version1], {
    //             from: orderOwner1
    //         });
    //         var logs = receipt.receipt.rawLogs;
    //         var OrderAlreadyExists = encoderDecoder.decodeLogsByTopic(OrderAlreadyExistsTopic, OrderAlreadyExistsAbi, logs);

    //         //cek is active
    //         var addressActiveId = await order.isActive(orderOwner1);            
    //         assert.strictEqual(addressActiveId.toString(), OrderAlreadyExists[0].orderId.toString());
    //         assert.notStrictEqual(addressActiveId.toString(), "0");

    //         //cek logs
    //         assert.strictEqual(OrderAlreadyExists[0].__length__, 3);
    //         assert.strictEqual(OrderAlreadyExists[0].orderId.toString(), "1");
    //         assert.strictEqual(OrderAlreadyExists[0].sellerAddress.toString(), seller1.dataAddress);
    //         assert.strictEqual(OrderAlreadyExists[0].version, web3.utils.padRight(seller1.version1, 64));
    //     });

    //     it('can not add order if not by order owner', async function () {
    //         await expectRevert(
    //             order.addOrder(1, [seller2.address], [seller2.version1], {
    //                 from: orderOwner2
    //             })
    //         )
    //     });

    //     it('can not add order if sellers length is not same with versions length', async function () {
    //         await expectRevert(
    //             order.addOrder(1, [seller1.dataAddress, seller2.dataAddress], [seller2.version1], {
    //                 from: orderOwner2
    //             })
    //         )
    //     });
    // });
    // describe('cancel order', async function () {
    //     it('can cancel order by order owner', async function () {
    //         var receipt = await order.cancelOrder(2, {
    //             from: orderOwner2
    //         });

    //         var addressActive  = await order.isActive(orderOwner2);
    //         assert.strictEqual(addressActive.toString(), "0");

    //         var logs = receipt.receipt.rawLogs;
    //         var OrderCancelledLog = encoderDecoder.decodeLogsByTopic(OrderCancelledTopic, OrderCancelledAbi, logs);
    //         assert.strictEqual(OrderCancelledLog[0].__length__, 2);
    //         assert.strictEqual(OrderCancelledLog[0].orderId.toString(), "2");
    //         assert.strictEqual(OrderCancelledLog[0].by,orderOwner2);
    //     });

    //     it('can not add order if not by order owner', async function () {
    //         await expectRevert(
    //             order.cancelOrder(1, {
    //                 from: orderOwner2
    //             })
    //         )
    //     });

    //     it('can add order by order owner', async function () {
    //         var receipt = await order.createOrder([seller1.dataAddress, seller2.dataAddress], [seller1.version1, seller2.version1], {
    //             from: orderOwner2
    //         });
    //         var logs = receipt.receipt.rawLogs;
    //         var OrderAddedLog = encoderDecoder.decodeLogsByTopic(OrderAddedTopic, OrderAddedAbi, logs);

    //         //cek is active
    //         var addressActiveId = await order.isActive(orderOwner2);            
    //         assert.strictEqual(addressActiveId.toString(), OrderAddedLog[0].orderId.toString());
    //         assert.notStrictEqual(addressActiveId.toString(), "0");

    //         //cek logs
    //         // assert.strictEqual(OrderAddedLog[0].__length__, 3);
    //         // assert.strictEqual(OrderAddedLog[0].orderId.toString(), "1");
    //         // assert.strictEqual(OrderAddedLog[0].sellerAddress.toString(), seller1.dataAddress);
    //         // assert.strictEqual(OrderAddedLog[0].version, web3.utils.padRight(seller1.version1, 64));
    //         // assert.strictEqual(OrderAddedLog[1].__length__, 3);
    //         // assert.strictEqual(OrderAddedLog[1].orderId.toString(), "1");
    //         // assert.strictEqual(OrderAddedLog[1].sellerAddress.toString(), seller2.dataAddress);
    //         // assert.strictEqual(OrderAddedLog[1].version, web3.utils.padRight(seller2.version1, 64));
    //     });

    // });

    describe('buy order', async function () {
        before(async function () {
            var create = await order.createandAddOrder([seller1.dataAddress, seller2.dataAddress], [seller1.version1, seller2.version1], {
                from: orderOwner2
            });
            var CreateOrderLog = encoderDecoder.decodeLogsByTopic(OrderCreatedTopic, OrderCreatedAbi, create.receipt.rawLogs)[0];
            console.log(CreateOrderLog)
        });
        
        it('get total price', async function () {
            // var a  = await order.getPrice(web3.utils.padLeft(web3.utils.numberToHex(1), 64));
            var a = await order.getTotalInvoice("0", {from:orderOwner1});
            console.log(await a.toString());
            var b = await order.getTotalInvoice("1", {from:orderOwner1});
            console.log(await b.toString());
            var c = await order.getTotalInvoice("2", {from:orderOwner1});
            console.log(await c.toString());
        });

        it('buy', async function () {

        });
    });
});