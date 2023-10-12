const { JsonRpcProvider, FetchRequest } = require('ethers');
const { HttpsProxyAgent } = require('https-proxy-agent');
const http = require('node:http');
const { createProxy } = require('proxy');

const ETH_RPC = 'https://eth.llamarpc.com';
// Example that doesn't use proxy connections
const BSC_RPC = 'https://binance.llamarpc.com';
const HTTP_PROXY = `http://localhost:3128`;

/**
 * Define new FetchRequest used for a provider
 */
// Assigning custom getUrl function will apply to all ethers v6 providers

const fetchReq = new FetchRequest(ETH_RPC);
fetchReq.getUrlFunc = FetchRequest.createGetUrlFunc({ agent: new HttpsProxyAgent(HTTP_PROXY) });
const provider = new JsonRpcProvider(fetchReq);
const provider2 = new JsonRpcProvider(BSC_RPC);

let resolvePromise;
const promise = new Promise((resolve) => {resolvePromise = resolve});

promise.then(() => provider.getBlockNumber().then(console.log));
promise.then(() => provider2.getBlockNumber().then(console.log));

/**
 * (Optional) Define new http proxy server to demonstrate RPC proxy connection (like squid)
 */
const server = createProxy(http.createServer());

server.listen(3128, () => {
  resolvePromise();
  console.log('HTTP(s) proxy server listening on port %d', server.address().port);
});

server.on('connect', (res, socket) => {
  // This is where you could find out that ethers provider will connect RPC via proxy agent
  console.log(`Proxy connection from ${socket.remoteAddress} with headers: ${JSON.stringify(res.rawHeaders)}`);
});