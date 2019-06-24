module.exports.stringToBytes32 = function (string) {
  var hexString = web3.utils.asciiToHex(string);
  return web3.utils.padRight(hexString, 64)
};

module.exports.decodeLogsByTopic = function (topic, inputAbi, logs) {
  var decoded = [];
  for (i in logs) {
    if (logs[i].topics[0] == topic) {
      if (logs[i].topics.length == 1) {
        var a = web3.eth.abi.decodeLog(inputAbi, logs[i].data, logs[i].topics);
      } else {
        var a = web3.eth.abi.decodeLog(inputAbi, logs[i].data, logs[i].topics.slice(1));
      }
      decoded.push(a);
    }
  }
  return decoded;
}

module.exports.parseConcatedBytes = function(concatedBytes){
  var resultAddress = "", resultVersion="", address="0x", version="";

  var uint64Digits = 16;
  var uint32Digits = 8;

  for(i = 0; i<concatedBytes.length; i++){
    if (i<uint64Digits + 2){ //only get character of version 
      version+=concatedBytes[i];
    }
    if ( i >= uint64Digits + uint32Digits + 2 ){ //only get address
      address+=concatedBytes[i];
    }
  }

  resultVersion = parseInt(version); //convert to integer
  resultAddress = address;
  return {
    version: resultVersion,
    address: resultAddress
  };

}