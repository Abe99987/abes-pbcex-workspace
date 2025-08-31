import { ethers } from 'ethers';
import { cache } from '../cache/redis';
import assert from 'assert';

type FeedResult = {
  price: string;
  decimals: number;
  roundId: string;
  updatedAt: number;
  source: 'chainlink';
};

const DEFAULT_RPC = process.env.RPC_URL_MAINNET ?? process.env.RPC_URL ?? '';
const DEFAULT_FEED =
  process.env.CHAINLINK_FEED_ADDRESS ??
  '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';

const AGGREGATOR_ABI = [
  'function decimals() view returns (uint8)',
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
];

export async function readChainlinkPrice(
  feedAddr = DEFAULT_FEED,
  rpcUrl = DEFAULT_RPC,
  cacheTtlSec = 10
): Promise<FeedResult> {
  assert(rpcUrl, 'RPC URL not set');
  const cacheKey = `chainlink:${feedAddr}`;

  const cached = await cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const feed = new ethers.Contract(feedAddr, AGGREGATOR_ABI, provider);

  const [roundId, answer, , updatedAt, answeredInRound] =
    await feed.latestRoundData();
  const decimals: number = await feed.decimals();

  if (!answer || answer.lte(0)) throw new Error('empty price');
  if (answeredInRound.lt(roundId)) throw new Error('stale round');
  if (updatedAt.toNumber() === 0) throw new Error('no timestamp');

  const result: FeedResult = {
    price: answer.toString(),
    decimals,
    roundId: roundId.toString(),
    updatedAt: updatedAt.toNumber(),
    source: 'chainlink',
  };

  await cache.set(cacheKey, JSON.stringify(result), cacheTtlSec);
  return result;
}
