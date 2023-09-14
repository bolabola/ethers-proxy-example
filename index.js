//const { ethers, JsonRpcProvider, FetchRequest } = require('../ethers.js/lib.commonjs/index.js');
const { ethers, JsonRpcProvider, FetchRequest } = require('ethers');
const fetch = require('cross-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const http = require('node:http');
const { createProxy } = require('proxy');

const ETH_RPC = 'https://eth.llamarpc.com';

const HTTP_PROXY_PORT = 3128;
const HTTP_PROXY_HOST = 'localhost';
const HTTP_PROXY = `http://${HTTP_PROXY_HOST}:${HTTP_PROXY_PORT}`;

/**
 * Define our own custom getUrl (typeof FetchGetUrlFunc) function
 *
 * See examples on
 * https://github.com/ethers-io/ethers.js/blob/main/src.ts/utils/geturl-browser.ts
 *
 * Documents:
 * https://docs.ethers.org/v6/api/utils/fetching/#FetchRequest_registerGetUrl
 * https://docs.ethers.org/v6/api/utils/fetching/#FetchGetUrlFunc
 */
const getUrl = async (req, _signal) => {
  // Inherited from https://github.com/ethers-io/ethers.js/blob/main/src.ts/utils/geturl-browser.ts
  let signal;

  if (_signal) {
      const controller = new AbortController();
      signal = controller.signal;
      _signal.addListener(() => { controller.abort(); });
  }

  const init = {
    method: req.method,
    headers: req.headers,
    body: req.body || undefined,
    signal
  };

  // This is what we want
  init.agent = new HttpsProxyAgent(HTTP_PROXY);

  // Inherited from https://github.com/ethers-io/ethers.js/blob/main/src.ts/utils/geturl-browser.ts
  const resp = await fetch(req.url, init);

  const headers = {};
  resp.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const respBody = await resp.arrayBuffer();
  const body = (respBody == null) ? null: new Uint8Array(respBody);

  return {
    statusCode: resp.status,
    statusMessage: resp.statusText,
    headers,
    body
  };
};

const sleep = (sec) => new Promise(r => setTimeout(r, sec * 1000));

/**
 * Define new FetchRequest used for a provider
 */
// Assigning custom getUrl function will apply to all ethers v6 providers

/**
For next ethers.js version release

const fetchReq = new FetchRequest(ETH_RPC);
fetchReq.getUrlFunc = getUrl;
const provider = new JsonRpcProvider(fetchReq);
const provider2 = new JsonRpcProvider('https://binance.llamarpc.com');

sleep(2).then(() => provider.getBlockNumber().then(console.log));
sleep(2).then(() => provider2.getBlockNumber().then(console.log));
**/

FetchRequest.registerGetUrl(getUrl);
const provider = new JsonRpcProvider(ETH_RPC);

// Sleep until proxy server is booted up
sleep(2).then(() => provider.getBlockNumber().then(console.log));

/**
 * (Optional) Define new http proxy server (like squid)
 */
let server = http.createServer();

server = createProxy(server);

server.listen(3128, () => {
  var port = server.address().port;
  console.log('HTTP(s) proxy server listening on port %d', port);
});

server.on('connect', (res, socket) => {
  // This is where you could find out that ethers provider will connect RPC via proxy agent
  console.log(`Proxy connection from ${socket.remoteAddress} with headers: ${JSON.stringify(res.rawHeaders)}`);
});
