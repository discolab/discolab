const xmlrpc = require('xmlrpc');

let xmlRpcClient;

module.exports = {
  callXMLRPCMethod
};

function callXMLRPCMethod(methodName, args) {
  if (!xmlRpcClient) {
    xmlRpcClient = xmlrpc.createSecureClient(getXMLRPCServerAddress(), true);
  }

  return new Promise((resolve, reject) => {
    console.log(`calling XMLRPC method ${methodName}`);
    xmlRpcClient.methodCall(methodName, args, (error, value) => {
      error ? reject(error) : resolve(value);
    });
  });
}

function getXMLRPCServerAddress() {
  const {
    WHATBOX_RTORRENT_XMLRPC_SERVER,
    WHATBOX_USERNAME,
    WHATBOX_PASSWORD
  } = process.env;

  return `https://${WHATBOX_USERNAME}:${WHATBOX_PASSWORD}@${WHATBOX_RTORRENT_XMLRPC_SERVER}`;
}
