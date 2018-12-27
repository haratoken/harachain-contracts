
module.exports = {
  networks: {
    development: {
      host: process.env.DEVELOPMENT_HOST,
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4700000
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    // rinkeby: {
    //   provider: function() { 
    //            return new HDWalletProvider(mnemonic, process.env.RINKEBY_HOST) 
    //          },
    //   network_id: 4,
    //   gas: 4700000,
    //   from: process.env.ADDRESS
    // },
  },
  solc: {
    version: "0.4.25",    
   optimizer: {
     enabled: true,
     runs: 200
   }
 },
 mocha: {  
  reporter: "spec",
  reporter: "mocha-junit-reporter", 
  reporterOptions: {  
    mochaFile: "reports/testresults.xml"
  }  
},
};
