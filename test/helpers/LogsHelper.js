module.exports.DataProviderRegistry = {
    RegisterCompletedLogTopic: "0xdb43c34d22da28c99c1bbcc95026c5bc82f1d940ac1ba37e995bb3df5e1e3802",
    RegisterCompletedLogAbi: [{
            "indexed": true,
            "name": "registerId",
            "type": "bytes32"
        },
        {
            "indexed": true,
            "name": "by",
            "type": "address"
        },
        {
            "indexed": true,
            "name": "feeValue",
            "type": "uint256"
        }
    ]
}

module.exports.Order = {
    OrderCreatedTopic: "0x6a5e189f9eb3f26eed61a4c1479af52ca50a67b958e345749a4296cf91ded42f",
    OrderCreatedAbi: [
        {
            "indexed": true,
            "name": "buyer",
            "type": "address"
        },
        {
            "indexed": true,
            "name": "orderId",
            "type": "uint256"
        },
        {
            "indexed": false,
            "name": "paymentId",
            "type": "bytes32"
        }
    ],
    OrderAddedTopic: "0x2bb47abe10260782f758cdeb3038ef76149bd172b24f570d7b7566646e682ad5",
    OrderAddedAbi: [
        {
            "indexed": true,
            "name": "orderId",
            "type": "uint256"
        },
        {
            "indexed": true,
            "name": "sellerAddress",
            "type": "address"
        },
        {
            "indexed": false,
            "name": "version",
            "type": "bytes32"
        }
    ],
    OrderCancelledTopic: "0xc0362da6f2ff36b382b34aec0814f6b3cdf89f5ef282a1d1f114d0c0b036d596",
    OrderCancelledAbi: [
        {
            "indexed": true,
            "name": "orderId",
            "type": "uint256"
        },
        {
            "indexed": true,
            "name": "by",
            "type": "address"
        }
    ],
    OrderAlreadyExistsTopic: "0x54aa32bfde67c81fbbf9a1002241dd2d616fc69e42139e5090677891e6f9f4c4",
    OrderAlreadyExistsAbi: [
        {
          "indexed": true,
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "name": "sellerAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "version",
          "type": "bytes32"
        }
      ]
}

module.exports.DataFactory = {
    DataCreationLogTopic: "0xba4eef7a56e3b8bee912b9f8f83435cf9021729f21d02a5abc46aa90e0940305",
    DataCreationLogAbi: [{
        "indexed": true,
        "name": "contractDataAddress",
        "type": "address"
      }, {
        "indexed": true,
        "name": "owner",
        "type": "address"
      }, {
        "indexed": false,
        "name": "location",
        "type": "address"
      }, {
        "indexed": false,
        "name": "signature",
        "type": "bytes"
      }, {
        "indexed": false,
        "name": "signatureFunc",
        "type": "bytes"
      }]
}

module.exports.DataFactoryRegistry = {
    DataFactoryAddressChangedLogTopic: "0xe9192a628b2c8c954d2affbd49e739e2a839c14cd11ee4d9484481e56410be5a",
    DataFactoryAddressChangedLogAbi: [
        {
            "indexed": true,
            "name": "who",
            "type": "address"
        },
        {
            "indexed": true,
            "name": "oldAddress",
            "type": "address"
        },
        {
            "indexed": true,
            "name": "newAddress",
            "type": "address"
        }
    ]
}