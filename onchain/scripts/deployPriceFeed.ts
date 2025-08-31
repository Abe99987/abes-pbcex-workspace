import { ethers } from 'hardhat';

const DEFAULT_FEED =
  process.env.CHAINLINK_FEED_ADDRESS ??
  (process.env.CHAIN_ID === '11155111'
    ? '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43' // Sepolia BTC/USD
    : '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'); // Mainnet ETH/USD

async function main() {
  const PriceFeedConsumer =
    await ethers.getContractFactory('PriceFeedConsumer');
  const contract = await PriceFeedConsumer.deploy(DEFAULT_FEED);
  await contract.deployed();
  console.log('PriceFeedConsumer deployed:', contract.address);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
