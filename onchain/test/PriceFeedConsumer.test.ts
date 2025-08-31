import { ethers } from 'hardhat';
import { expect } from 'chai';

describe('PriceFeedConsumer', () => {
  it('reads price from mock', async () => {
    const DECIMALS = 8;
    const START = ethers.BigNumber.from('350000000000'); // 3,500.00000000 * 1e8

    const Mock = await ethers.getContractFactory('LocalMockFeed');
    const mock = await Mock.deploy(DECIMALS, START);
    await mock.deployed();

    const Reader = await ethers.getContractFactory('PriceFeedConsumer');
    const reader = await Reader.deploy(mock.address);
    await reader.deployed();

    const [answer, decimals] = await reader.latest();
    expect(decimals).to.equal(DECIMALS);
    expect(answer.toString()).to.equal(START.toString());
  });
});
