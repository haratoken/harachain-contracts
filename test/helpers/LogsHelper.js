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
    OrderCreatedAbi: [{
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
    OrderAddedTopic: "0x4716c3755b157ac0a45de27e57cbc67d10eff78b62bffecda3769c2997729e74",
    OrderAddedAbi: [{
            "indexed": true,
            "name": "orderId",
            "type": "uint256"
        },
        // {
        //     "indexed": true,
        //     "name": "sellerAddress",
        //     "type": "address"
        // },
        {
            "indexed": false,
            "name": "itemId",
            "type": "bytes32"
        }
    ],
    OrderCancelledTopic: "0xc0362da6f2ff36b382b34aec0814f6b3cdf89f5ef282a1d1f114d0c0b036d596",
    OrderCancelledAbi: [{
            "indexed": true,
            "name": "orderId",
            "type": "uint256"
        },
        {
            "indexed": false,
            "name": "by",
            "type": "address"
        }
    ],
    OrderAlreadyExistsTopic: "0x2294efd78862ef0006381379583f056e1494b63e2dbc4b53309d59a8dda4fbf0",
    OrderAlreadyExistsAbi: [{
            "indexed": true,
            "name": "orderId",
            "type": "uint256"
        },
        // {
        //     "indexed": true,
        //     "name": "sellerAddress",
        //     "type": "address"
        // },
        {
            "indexed": false,
            "name": "itemId",
            "type": "bytes32"
        }
    ],
    OrderBoughtTopic: "0x4ea975be7a26e51b453e12da2076d26f45d67f18eeb2ad1ae06e74484fccd83b",
    OrderBoughtAbi: [{
            "indexed": true,
            "name": "orderId",
            "type": "uint256"
        },
        {
            "indexed": true,
            "name": "buyerAddress",
            "type": "address"
        },
        // {
        //     "indexed": true,
        //     "name": "sellerAddress",
        //     "type": "address"
        // },
        {
            "indexed": false,
            "name": "itemId",
            "type": "bytes32"
        },
        {
            "indexed": false,
            "name": "price",
            "type": "uint256"
        }
    ],
    WithdrawnTopic: "0xac1fd9f6b0f3b54e0ee425d21b2c640b0a221ad9b6f94bef78e29022c654c0d1",
    WithdrawnAbi: [{
            "indexed": true,
            "name": "to",
            "type": "address"
        },
        {
            "indexed": true,
            "name": "from",
            "type": "address"
        },
        {
            "indexed": false,
            "name": "value",
            "type": "uint256"
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
    DataFactoryAddressChangedLogAbi: [{
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
    ],
    AllowedAddressLogTopic: "0x36e9b361b4898c048e6266002b7104750b6cd4ec703c6044f8efb5e00576fd1e",
    AllowedAddressLogAbi: [{
            "indexed": true,
            "name": "who",
            "type": "address"
        },
        {
            "indexed": true,
            "name": "isAllowed",
            "type": "bool"
        },
        {
            "indexed": true,
            "name": "by",
            "type": "address"
        }
    ]
}

module.exports.ExchangeHartIdr = {
    ExchangeChangerChangedLogTopic: "0x380fa5e4685b8048c8b8b5d97e94ea0debb4b2c2b545ca0d6d90134156c96c73",
    ExchangeChangerChangedLogAbi: [{
        "indexed": true,
        "name": "by",
        "type": "address"
    }, {
        "indexed": true,
        "name": "oldAddress",
        "type": "address"
    }, {
        "indexed": true,
        "name": "newAddress",
        "type": "address"
    }],
    ExchangeRateChangedLogTopic: "0x2a6923cabf27ba217a1a8d74158f58b24acd1e443e80eb99c27b45c307425083",
    ExchangeRateChangedLogLogAbi: [{
        "indexed": true,
        "name": "by",
        "type": "address"
    }, {
        "indexed": true,
        "name": "oldRate",
        "type": "uint256"
    }, {
        "indexed": true,
        "name": "newRate",
        "type": "uint256"
    }]
}

module.exports.IPriceable = {
    PriceChangedLogTopic: "0x1ac0de4edb01f7bc0881a541a74de65881b2453f53f68837c41e5ab5bfddc292",
    PriceChangedLogAbi: [{
        "indexed": true,
        "name": "itemAddress",
        "type": "address"
    }, {
        "indexed": true,
        "name": "id",
        "type": "bytes32"
    },{
        "indexed": false,
        "name": "oldValue",
        "type": "uint256"
    }, {
        "indexed": false,
        "name": "newValue",
        "type": "uint256"
    }]
}

module.exports.HaraTokenPrivate = {
    ReceiptCreatedTopic: "0xcbb5fceff2b5edbb576e90de25cc2e14c35936bcccced274e28ce87fa75b696c",
    ReceiptCreatedAbi: [{
        "indexed": true,
        "name": "receiptId",
        "type": "uint256"
    }, {
        "indexed": true,
        "name": "buyer",
        "type": "address"
    }, {
        "indexed": true,
        "name": "seller",
        "type": "address"
    },{
        "indexed": false,
        "name": "id",
        "type": "bytes32"
    }, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
    }]
}

module.exports.ContractMadeAbstract = {
    HasGetClassTopic: "0x5e80a0839b78e29f73bb490669c9b8b77e190751a8f9569fd6a42f3a16e97a91",
    HasGetClassAbi: []
}

module.exports.DataStore = {
    SignatureLogTopic: "0xbb9f6a2766f43575abb11a054ffdb9a40439ea63fa517fe2cc3e8e145fc5f36b",
    SignatureLogAbi: [{
        "indexed": true,
        "name": "version",
        "type": "bytes32"
    }, {
        "indexed": false,
        "name": "signature",
        "type": "bytes"
    }]
}

module.exports.DataProviderRelation = {
    EndpointChangedLogTopic: "0x4111b886b9600f01e3735293a06336ba02fbb0aff7eca35ddca34d429d34119c",
    EndpointChangedLogAbi: [{
        "indexed": false,
        "name": "oldEndpoint",
        "type": "string"
    }, {
        "indexed": false,
        "name": "newEndpoint",
        "type": "string"
    }, {
        "indexed": true,
        "name": "by",
        "type": "address"
    }]    
}

module.exports.DataFactoryProvider = {
    RelationCreatedLogTopic: "0x47940b042ea2e2b9c22b08dfff43c2558325774a7184316e7791a584e494eae3",
    RelationCreatedLogAbi: [{
        "indexed": true,
        "name": "fromAddr",
        "type": "string"
    }, {
        "indexed": false,
        "name": "fromVersion",
        "type": "string"
    }, {
        "indexed": true,
        "name": "toAddr",
        "type": "string"
    }, {
        "indexed": false,
        "name": "toVersion",
        "type": "string"
    }]
}
