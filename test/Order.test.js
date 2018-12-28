const Order = artifacts.require('Order');
const HaraToken = artifacts.require('HaraTokenPrivate');
const encoderDecoder = require("./helpers/encoderDecoder")
const expectRevert = require("./helpers/expectRevert")
const expectContractNotExists = require("./helpers/expectContractNotExists")

contract('Order', accounts => {
    let hart;
    let initHartAddress;
    let order;

    const owner = accounts[0];
    const notOwner = accounts[1];
    const hartOwner = accounts[2]; // hart owner
    const orderOwner1 = accounts[3];
    const orderOwner2 = accounts[4];

    const seller1 = {address: accounts[5], version1: web3.utils.fromAscii("1")};
    const seller2 = {address:accounts[6], version1: web3.utils.fromAscii("1")};
    
    const OrderCreatedTopic = "0xcb0c37c16aa3b0bbb7a817932094d8a20a00996d426a813f067039f0ef87ab07";
    const OrderCreatedAbi = [
        {
            "indexed": false,
            "name": "buyer",
            "type": "address"
        },
        {
            "indexed": false,
            "name": "orderId",
            "type": "uint256"
        }
    ];
    const OrderAddedTopic = "0x2bb47abe10260782f758cdeb3038ef76149bd172b24f570d7b7566646e682ad5";
    const OrderAddedAbi = [
        {
            "indexed": false,
            "name": "orderId",
            "type": "uint256"
        },
        {
            "indexed": false,
            "name": "sellerAddress",
            "type": "address"
        },
        {
            "indexed": false,
            "name": "version",
            "type": "bytes32"
        }
    ];

    const OrderCancelledTopic = "0xc0362da6f2ff36b382b34aec0814f6b3cdf89f5ef282a1d1f114d0c0b036d596";
    const OrderCancelledAbi = [
        {
            "indexed": false,
            "name": "orderId",
            "type": "uint256"
        },
        {
            "indexed": false,
            "name": "by",
            "type": "address"
        }
    ];

    const OrderAlreadyExistsTopic = "0x54aa32bfde67c81fbbf9a1002241dd2d616fc69e42139e5090677891e6f9f4c4";
    const OrderAlreadyExistsAbi = [
        {
          "indexed": false,
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "sellerAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "version",
          "type": "bytes32"
        }
      ];
    

    before(async function () {
        // deploy hara token contract
        var haratokenContract = new web3.eth.Contract(HaraToken.abi);
        hart = await haratokenContract.deploy({
            data: HaraToken.bytecode
        }).send({
            from: hartOwner,
            gas: 4700000
        });
        initHartAddress = hart.addrress;

        await hart.methods.mint(owner, web3.utils.toWei("1000")).send({
            from: hartOwner
        });

        order = await Order.new({
            from: owner
        });
    });

    describe('create order', async function () {
        it('can create order without initial data address to order', async function () {
            var receipt = await order.createOrder({
                from: orderOwner1
            });
            
            var logs = receipt.receipt.logs;
            var CreateOrderLog = encoderDecoder.decodeLogsByTopic(OrderCreatedTopic, OrderCreatedAbi, logs)[0];
            // var orderTransaction = await order.getOrderList(orderOwner1, CreateOrderLog.orderId);
            console.log("1----------------------------------------------------------------------------")
            // console.log(orderTransaction);
            var addressActiveId = await order.isActive(orderOwner1);
            
            // cek order transaction
            // assert.strictEqual(orderTransaction.toString(), "")
            //cek is active
            assert.strictEqual(addressActiveId.toString(), CreateOrderLog.orderId.toString());
            assert.notStrictEqual(addressActiveId.toString(), "0");
            //cek logs
            assert.strictEqual(CreateOrderLog.__length__, 2);
            assert.strictEqual(CreateOrderLog.orderId.toString(), "1");
            assert.strictEqual(CreateOrderLog.buyer, orderOwner1);

        });

        it('can create order with initial data address to order', async function () {
            var receipt = await order.createOrder([seller1.address, seller2.address], [seller1.version1, seller2.version1], {
                from: orderOwner2
            });

            var logs = receipt.receipt.logs;
            var CreateOrderLog = encoderDecoder.decodeLogsByTopic(OrderCreatedTopic, OrderCreatedAbi, logs)[0];
            // var orderTransaction = await order.getOrderList(orderOwner2, CreateOrderLog.orderId);
            console.log("2----------------------------------------------------------------------------")
            // console.log(orderTransaction);
            var addressActiveId = await order.isActive(orderOwner2);
            
            // cek order transaction
            // assert.strictEqual(orderTransaction.toString(), [seller1.address, seller2.address].toString());
            //cek is active
            assert.strictEqual(addressActiveId.toString(), CreateOrderLog.orderId);
            assert.notStrictEqual(addressActiveId.toString(), "0");
            //cek logs
            assert.strictEqual(CreateOrderLog.__length__, 2);
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
            var receipt = await order.addOrder(1, [seller1.address, seller2.address], [seller1.version1, seller2.version1], {
                from: orderOwner1
            });
            var logs = receipt.receipt.logs;
            var OrderAddedLog = encoderDecoder.decodeLogsByTopic(OrderAddedTopic, OrderAddedAbi, logs);
            // var orderTransaction = await order.getOrderList(orderOwner1, OrderAddedLog[0].orderId);
            console.log("3----------------------------------------------------------------------------")
            // console.log(orderTransaction);
            var addressActiveId = await order.isActive(orderOwner1);            
            // cek order transaction
            // assert.strictEqual(orderTransaction.toString(), [seller1.address, seller2.address].toString());
            //cek is active
            assert.strictEqual(addressActiveId.toString(), OrderAddedLog[0].orderId.toString());
            assert.notStrictEqual(addressActiveId.toString(), "0");
            //cek logs
            assert.strictEqual(OrderAddedLog[0].__length__, 3);
            assert.strictEqual(OrderAddedLog[0].orderId.toString(), "1");
            assert.strictEqual(OrderAddedLog[0].sellerAddress.toString(), seller1.address);
            assert.strictEqual(OrderAddedLog[0].version, web3.utils.padRight(seller1.version1, 64));
            assert.strictEqual(OrderAddedLog[1].__length__, 3);
            assert.strictEqual(OrderAddedLog[1].orderId.toString(), "1");
            assert.strictEqual(OrderAddedLog[1].sellerAddress.toString(), seller2.address);
            assert.strictEqual(OrderAddedLog[1].version, web3.utils.padRight(seller2.version1, 64));
        });

        it('can add order by order owner, skip if seller and version already included', async function () {
            var receipt = await order.addOrder(1, [seller1.address], [seller1.version1], {
                from: orderOwner1
            });
            var logs = receipt.receipt.logs;
            var OrderAlreadyExists = encoderDecoder.decodeLogsByTopic(OrderAlreadyExistsTopic, OrderAlreadyExistsAbi, logs);
            // var orderTransaction = await order.getOrderList(orderOwner1, OrderAddedLog[0].orderId);
            console.log("3----------------------------------------------------------------------------")
            // console.log(orderTransaction);
            var addressActiveId = await order.isActive(orderOwner1);            
            // cek order transaction
            // assert.strictEqual(orderTransaction.toString(), [seller1.address, seller2.address].toString());
            //cek is active
            assert.strictEqual(addressActiveId.toString(), OrderAlreadyExists[0].orderId.toString());
            assert.notStrictEqual(addressActiveId.toString(), "0");
            //cek logs
            assert.strictEqual(OrderAlreadyExists[0].__length__, 3);
            assert.strictEqual(OrderAlreadyExists[0].orderId.toString(), "1");
            assert.strictEqual(OrderAlreadyExists[0].sellerAddress.toString(), seller1.address);
            assert.strictEqual(OrderAlreadyExists[0].version, web3.utils.padRight(seller1.version1, 64));
        });

        it('can not add order if not by order owner', async function () {
            await expectRevert(
                order.addOrder(1, [seller2.address], [seller2.version1], {
                    from: orderOwner2
                })
            )
        });

        it('can not add order if sellers length is not same with versions length', async function () {
            await expectRevert(
                order.addOrder(1, [seller1.address, seller2.address], [seller2.version1], {
                    from: orderOwner2
                })
            )
        });
    });
    describe('cancel order', async function () {
        it('can cancel order by order owner', async function () {
            var receipt = await order.cancelOrder(2, {
                from: orderOwner2
            });

            var addressActive  = await order.isActive(orderOwner2);
            assert.strictEqual(addressActive.toString(), "0");

            var logs = receipt.receipt.logs;
            var OrderCancelledLog = encoderDecoder.decodeLogsByTopic(OrderCancelledTopic, OrderCancelledAbi, logs);
            assert.strictEqual(OrderCancelledLog[0].__length__, 2);
            assert.strictEqual(OrderCancelledLog[0].orderId.toString(), "2");
            assert.strictEqual(OrderCancelledLog[0].by,orderOwner2);
        });

        it('can not add order if not by order owner', async function () {
            await expectRevert(
                order.cancelOrder(1, {
                    from: orderOwner2
                })
            )
        });
    });
});