import "dotenv/config";
import fetch from "node-fetch";

const feed = process.env.CHAINLINK_FEED_ADDRESS;
const rpc = process.env.RPC_URL_MAINNET || process.env.RPC_URL;

const url = new URL("http://localhost:4001/api/oracle/chainlink");
if (feed) url.searchParams.set("feed", feed);
if (rpc) url.searchParams.set("rpc", rpc);

const r = await fetch(url.toString());
console.log(await r.json());
