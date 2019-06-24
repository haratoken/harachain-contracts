const Order = artifacts.require('Order');
const HaraToken = artifacts.require('HaraTokenPrivate');
const DataFactory = artifacts.require('DataFactory');
const DataFactoryRegistry = artifacts.require('DataFactoryRegistry');
const DataStore = artifacts.require('DataStore');
const DexItem= artifacts.require('DexItem');

const encoderDecoder = require("./helpers/encoderDecoder")
const expectRevert = require("./helpers/expectRevert")
const logsDetail = require("./helpers/LogsHelper")
const expectContractNotExists = require("./helpers/expectContractNotExists")
const BN = web3.utils.BN;

contract('Order', accounts => {
    let hart;
    let initHartAddress;
    let order;
    let dataFactory;
    let dataFactoryRegistry;
    let dexItem;

    const owner = accounts[0];
    const notOwner = accounts[1];
    const hartOwner = accounts[2]; // hart owner
    const orderOwner1 = accounts[3];
    const orderOwner2 = accounts[4];
    const orderOwner3 = accounts[5];
    const dataProvider1 = accounts[6];
    const dexOwner = accounts[7];

    const seller1 = {
        address: accounts[7],
        version1: web3.utils.padLeft(web3.utils.toHex(web3.utils.toBN(1)), 24)
    };
    const seller2 = {
        address: accounts[8],
        version1: web3.utils.padLeft(web3.utils.toHex(web3.utils.toBN(1)), 24)
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

        // mint token to owner
        await hart.mint(owner, web3.utils.toWei("1000"), {
            from: hartOwner
        });

        // deploy order contract
        order = await Order.new(initHartAddress, {
            from: owner
        });

        // deploy data factory contract
        dataFactory = await DataFactory.new(initHartAddress, {
            from: hartOwner
        });

        //deploy data factory registry contract
        dataFactoryRegistry = await DataFactoryRegistry.new(dataFactory.address, {
            from: hartOwner
        });
        await dataFactoryRegistry.addAllowedAddress(dataProvider1, {
            from: hartOwner
        });

        dexItem = await DexItem.new(
            hart.address, 
            dataFactoryRegistry.address, {
              from: dexOwner
            });
    
        await dataFactoryRegistry.setDexAddress(dexItem.address, {from: hartOwner});
        await order.setDexAddress(dexItem.address, {from: owner});

        // create data store 1
        seller1.receipt = await dataFactoryRegistry.storeData(
            seller1.address,
            initLocation,
            web3.utils.asciiToHex(initSignature),
            web3.utils.asciiToHex(initSignatureFunc), {
                from: dataProvider1
            }
        );

        const logs1 = seller1.receipt.receipt.rawLogs;
        const DataCreationLog1 = encoderDecoder.decodeLogsByTopic(DataCreationLogTopic, DataCreationLogAbi, logs1)[0];
        seller1.dataAddress = DataCreationLog1.contractDataAddress;
        seller1.data = await DataStore.at(seller1.dataAddress);
        seller1.id1 = seller1.dataAddress + seller1.version1.slice(2);

        await dexItem.setSale(seller1.id1, true, {
            from: seller1.address
        });
        await dexItem.setPrice(seller1.id1, web3.utils.toWei("1"), {
            from: seller1.address
        });

        // create data store 2
        seller2.receipt = await dataFactoryRegistry.storeData(
            seller2.address,
            initLocation,
            web3.utils.asciiToHex(initSignature),
            web3.utils.asciiToHex(initSignatureFunc), {
                from: dataProvider1
            }
        );

        const logs2 = seller2.receipt.receipt.rawLogs;
        const DataCreationLog2 = encoderDecoder.decodeLogsByTopic(DataCreationLogTopic, DataCreationLogAbi, logs2)[0];
        seller2.dataAddress = DataCreationLog2.contractDataAddress;
        seller2.data = await DataStore.at(seller2.dataAddress);
        seller2.id1 = seller2.dataAddress + seller2.version1.slice(2);

        await dexItem.setPrice(seller2.id1, web3.utils.toWei("5"), {
            from: seller2.address
        });
        await dexItem.setSale(seller2.id1, true, {
            from: seller2.address
        });
    });

    describe('create order', async function () {
        it('can create order without initial data address to order', async function () {
            var receipt = await order.createOrder({
                from: orderOwner1
            });

            var logs = receipt.receipt.rawLogs;
            var CreateOrderLog = encoderDecoder.decodeLogsByTopic(OrderCreatedTopic, OrderCreatedAbi, logs)[0];
            var addressActiveId = await order.isActive(orderOwner1);

            // cek order transaction
            //cek is active
            assert.strictEqual(addressActiveId.toString(), CreateOrderLog.orderId.toString());
            assert.notStrictEqual(addressActiveId.toString(), "0");
            //cek logs
            assert.strictEqual(CreateOrderLog.__length__, 3);
            assert.strictEqual(CreateOrderLog.orderId.toString(), "1");
            assert.strictEqual(CreateOrderLog.buyer, orderOwner1);
        });

        it('can create order with initial data address to order', async function () {
            var receipt = await order.createandAddOrder([seller1.id1, seller2.id1], {
                from: orderOwner2
            });

            var logs = receipt.receipt.rawLogs;
            var CreateOrderLog = encoderDecoder.decodeLogsByTopic(OrderCreatedTopic, OrderCreatedAbi, logs)[0];
            var addressActiveId = await order.isActive(orderOwner2);

            //cek is active
            assert.strictEqual(addressActiveId.toString(), CreateOrderLog.orderId);
            assert.notStrictEqual(addressActiveId.toString(), "0");

            //cek logs
            assert.strictEqual(CreateOrderLog.__length__, 3);
            assert.strictEqual(CreateOrderLog.orderId.toString(), "2");
            assert.strictEqual(CreateOrderLog.buyer, orderOwner2);
        });

        it('can not create order if address still have active order', async function () {
            await expectRevert(
                order.createOrder({
                    from: orderOwner1
                })
            )
        });
    });
    describe('add order', async function () {
        it('can add order by order owner', async function () {
            var receipt = await order.addOrder(1, [seller1.id1, seller2.id1], {
                from: orderOwner1
            });
            var logs = receipt.receipt.rawLogs;
            var OrderAddedLog = encoderDecoder.decodeLogsByTopic(OrderAddedTopic, OrderAddedAbi, logs);

            //cek is active
            var addressActiveId = await order.isActive(orderOwner1);
            assert.strictEqual(addressActiveId.toString(), OrderAddedLog[0].orderId.toString());
            assert.notStrictEqual(addressActiveId.toString(), "0");

            //cek logs
            assert.strictEqual(OrderAddedLog[0].__length__, 2);
            assert.strictEqual(OrderAddedLog[0].orderId.toString(), "1");
            assert.strictEqual(OrderAddedLog[0].itemId, seller1.id1.toLowerCase());
            assert.strictEqual(OrderAddedLog[1].__length__, 2);
            assert.strictEqual(OrderAddedLog[1].orderId.toString(), "1");
            assert.strictEqual(OrderAddedLog[1].itemId, seller2.id1.toLowerCase());
        });

        it('can add order by order owner, skip if seller and version already included', async function () {
            var receipt = await order.addOrder(1, [seller1.id1], {
                from: orderOwner1
            });
            var logs = receipt.receipt.rawLogs;
            var OrderAlreadyExists = encoderDecoder.decodeLogsByTopic(OrderAlreadyExistsTopic, OrderAlreadyExistsAbi, logs);

            //cek is active
            var addressActiveId = await order.isActive(orderOwner1);
            assert.strictEqual(addressActiveId.toString(), OrderAlreadyExists[0].orderId.toString());
            assert.notStrictEqual(addressActiveId.toString(), "0");

            //cek logs
            assert.strictEqual(OrderAlreadyExists[0].__length__, 2);
            assert.strictEqual(OrderAlreadyExists[0].orderId.toString(), "1");
            assert.strictEqual(OrderAlreadyExists[0].itemId, seller1.id1.toLowerCase());
        });

        it('can not add order if not by order owner', async function () {
            await expectRevert(
                order.addOrder(1, [seller2.id1], {
                    from: orderOwner2
                }));
        });
    });

    describe('cancel order', async function () {
        it('can cancel order by order owner', async function () {
            var receipt = await order.cancelOrder(2, {
                from: orderOwner2
            });

            var addressActive = await order.isActive(orderOwner2);
            assert.strictEqual(addressActive.toString(), "0");

            var logs = receipt.receipt.rawLogs;
            var OrderCancelledLog = encoderDecoder.decodeLogsByTopic(OrderCancelledTopic, OrderCancelledAbi, logs);
            assert.strictEqual(OrderCancelledLog[0].__length__, 2);
            assert.strictEqual(OrderCancelledLog[0].orderId.toString(), "2");
            assert.strictEqual(OrderCancelledLog[0].by, orderOwner2);
        });

        it('can not add order if not by order owner', async function () {
            await expectRevert(
                order.cancelOrder(1, {
                    from: orderOwner2
                })
            )
        });

        it('can add order by order owner', async function () {
            var receipt = await order.createandAddOrder([seller1.id1, seller2.id1], {
                from: orderOwner2
            });
            var logs = receipt.receipt.rawLogs;
            var OrderAddedLog = encoderDecoder.decodeLogsByTopic(OrderAddedTopic, OrderAddedAbi, logs);

            //cek is active
            var addressActiveId = await order.isActive(orderOwner2);
            assert.strictEqual(addressActiveId.toString(), OrderAddedLog[0].orderId.toString());
            assert.notStrictEqual(addressActiveId.toString(), "0");

            //cek logs
            assert.strictEqual(OrderAddedLog[0].__length__, 2);
            assert.strictEqual(OrderAddedLog[0].orderId.toString(), "3");
            assert.strictEqual(OrderAddedLog[0].itemId, seller1.id1.toLowerCase());
            assert.strictEqual(OrderAddedLog[1].__length__, 2);
            assert.strictEqual(OrderAddedLog[1].orderId.toString(), "3");
            assert.strictEqual(OrderAddedLog[1].itemId, seller2.id1.toLowerCase());
        });

    });

    describe('buy order', async function () {

    });

    describe('get total order price', async function () {
        var orderId = web3.utils.padLeft(web3.utils.toHex(web3.utils.toBN(4)), 64);

        before(async function () {
            // orderId 4
            await order.createandAddOrder([seller1.id1, seller2.id1], {
                from: orderOwner3
            });
            await hart.transfer(orderOwner3, web3.utils.toWei("20"), {
                from: owner
            });
        });

        it('get total price', async function () {
            var totalOrderPrice = await order.getPrice(orderId, {
                from: orderOwner3
            });
            assert.strictEqual(totalOrderPrice.toString(), web3.utils.toWei("6"));

            var orderLength = await order.getOrderLength(orderOwner3, 4);
            assert.strictEqual(orderLength.toString(), "2");
        });

        it('on sale', async function () {
            var isOrderSale = await order.isSale(orderId)
        });

        it('buy', async function () {
            var orderId = web3.utils.padLeft(web3.utils.toHex(web3.utils.toBN(4)), 64);

            var orderStatusBeforeBuy = await order.isActive(orderOwner3);
            assert.strictEqual(orderStatusBeforeBuy.toString(), "4");

            var buy = await hart.buy(order.address, orderId, web3.utils.toWei("7"), {
                from: orderOwner3
            });

            const logs = buy.receipt.rawLogs;
            assert.strictEqual(logs.length, 21);
            encoderDecoder.decodeLogsByTopic(logsDetail)

            // OrderBought
            var orderBoughtLogs = encoderDecoder.decodeLogsByTopic(logsDetail.Order.OrderBoughtTopic, logsDetail.Order.OrderBoughtAbi, logs);
            assert.strictEqual(orderBoughtLogs.length, 2);
            assert.strictEqual(orderBoughtLogs[0].orderId, "4");
            assert.strictEqual(orderBoughtLogs[0].buyerAddress, orderOwner3);
            assert.strictEqual(orderBoughtLogs[0].itemId, seller1.id1.toLowerCase());
            assert.strictEqual(orderBoughtLogs[1].orderId, "4");
            assert.strictEqual(orderBoughtLogs[1].buyerAddress, orderOwner3);
            assert.strictEqual(orderBoughtLogs[1].itemId, seller2.id1.toLowerCase());

            // ReceiptCreatedLog
            var receiptCreatedLogs = encoderDecoder.decodeLogsByTopic(logsDetail.HaraTokenPrivate.ReceiptCreatedTopic, logsDetail.HaraTokenPrivate.ReceiptCreatedAbi, logs);
            assert.strictEqual(receiptCreatedLogs.length, 3)
            assert.strictEqual(receiptCreatedLogs[0].receiptId, "1");
            assert.strictEqual(receiptCreatedLogs[0].buyer, orderOwner3);
            assert.strictEqual(receiptCreatedLogs[0].seller, order.address);
            assert.strictEqual(receiptCreatedLogs[1].receiptId, "2");
            assert.strictEqual(receiptCreatedLogs[1].buyer, orderOwner3);
            assert.strictEqual(receiptCreatedLogs[1].seller, dexItem.address);
            assert.strictEqual(receiptCreatedLogs[1].id, seller1.id1.toLowerCase());
            assert.strictEqual(receiptCreatedLogs[2].receiptId, "3");
            assert.strictEqual(receiptCreatedLogs[2].buyer, orderOwner3);
            assert.strictEqual(receiptCreatedLogs[2].seller, dexItem.address);
            assert.strictEqual(receiptCreatedLogs[2].id, seller2.id1.toLowerCase());

            var isSeller1Purchased = await seller1.data.getPurchaseStatus(orderOwner3, seller1.version1)
            assert.strictEqual(isSeller1Purchased, true); // purchased should by order owner instead order contract address
            var isSellerPurchasedByOrder = await seller1.data.getPurchaseStatus(order.address, seller1.version1)
            assert.strictEqual(isSellerPurchasedByOrder, false); // purchased should by order owner instead order contract address
            var isSeller2Purchased = await seller2.data.getPurchaseStatus(orderOwner3, seller2.version1)
            assert.strictEqual(isSeller2Purchased, true); // purchased should by order owner instead order contract address
            var isOrderPurchased = await order.purchaseStatus(4);
            assert.strictEqual(isOrderPurchased, true);
            var orderStatusAfterBuy = await order.isActive(orderOwner3);
            assert.strictEqual(orderStatusAfterBuy.toString(), "0");
        });
    });

    describe('withdraw', async function () {
        var remainingHart;
        before(async function () {
            remainingHart = await hart.balanceOf(order.address);
        });

        it('can not withdraw if not by contract owner owner', async function () {
            await expectRevert(
                order.withdraw(notOwner, remainingHart, {
                    from: notOwner
                })
            )
        });

        it('can withdraw by order owner', async function () {
            var beforeWithdraw = await hart.balanceOf(owner);
            var receipt = await order.withdraw(owner, remainingHart, {
                from: owner
            });
            
            var logs = receipt.receipt.rawLogs;
            var WithdrawnLog = encoderDecoder.decodeLogsByTopic(logsDetail.Order.WithdrawnTopic, logsDetail.Order.WithdrawnAbi, logs);
            assert.strictEqual(WithdrawnLog[0].__length__, 3);
            assert.strictEqual(WithdrawnLog[0].to, owner);
            assert.strictEqual(WithdrawnLog[0].from, order.address);
            assert.strictEqual(WithdrawnLog[0].value.toString(), remainingHart.toString());

            var afterWithdraw = await hart.balanceOf(owner);
            assert.strictEqual(afterWithdraw.toString(), (beforeWithdraw.add(remainingHart)).toString());
        });

        it('failed if contract don\'t have remaining hart', async function () {
            await expectRevert(
                order.withdraw(owner, remainingHart, {
                    from: owner
                })
            )
        });

    });
});