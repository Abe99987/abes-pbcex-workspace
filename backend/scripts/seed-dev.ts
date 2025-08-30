import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { AuthController } from '@/controllers/AuthController';
import { WalletController } from '@/controllers/WalletController';
import { TradeController } from '@/controllers/TradeController';
import {
  ACCOUNT_TYPES,
  TRADE_STATUS,
  USER_ROLES,
  KYC_STATUS,
} from '@/utils/constants';
import { logInfo, logError } from '@/utils/logger';
import { User } from '@/models/User';
import { Account } from '@/models/Account';
import { Balance, BalanceChange } from '@/models/Balance';
import { Trade } from '@/models/Trade';

/**
 * Development Data Seeder
 * Creates sample users, accounts, balances, and transactions for development
 */

async function seedDevData() {
  console.log('🌱 Seeding development data...\n');

  try {
    // 1. Create dev user
    logInfo('Creating dev user...');
    const devPassword = 'pbcextest1';
    const devPasswordHash = bcrypt.hashSync(devPassword, 10);

    const devUser: User = {
      id: 'dev-user-id', // Fixed ID to match auth middleware
      email: 'dev@local.test',
      passwordHash: devPasswordHash, // Properly hashed password
      firstName: 'Dev',
      lastName: 'User',
      role: USER_ROLES.USER,
      kycStatus: KYC_STATUS.APPROVED,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      phone: '+1-555-0123',
      loginCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Clear and seed users
    AuthController.clearUsers();
    AuthController.addUser(devUser);
    logInfo(`Created dev user: ${devUser.email} (ID: ${devUser.id})`);

    // 2. Create user accounts
    logInfo('Creating user accounts...');
    const fundingAccount: Account = {
      id: uuidv4(),
      userId: devUser.id,
      type: ACCOUNT_TYPES.FUNDING,
      name: 'Funding Account',
      description: 'Real asset storage and custody',
      custodyProvider: 'PAXOS',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tradingAccount: Account = {
      id: uuidv4(),
      userId: devUser.id,
      type: ACCOUNT_TYPES.TRADING,
      name: 'Trading Account',
      description: 'Synthetic asset trading',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    AuthController.addUserAccount(devUser.id, fundingAccount);
    AuthController.addUserAccount(devUser.id, tradingAccount);
    logInfo(`Created funding account: ${fundingAccount.id}`);
    logInfo(`Created trading account: ${tradingAccount.id}`);

    // 3. Add initial balances
    logInfo('Adding initial balances...');

    // Funding account balances (real assets)
    const fundingBalances = [
      { asset: 'PAXG', amount: '2.5000' }, // $5,125 @ $2,050/oz
      { asset: 'USD', amount: '10000.00' }, // $10,000 USD
      { asset: 'USDC', amount: '5000.00' }, // $5,000 USDC
    ];

    // Trading account balances (synthetic assets)
    const tradingBalances = [
      { asset: 'XAU-s', amount: '1.2500' }, // $2,562.50 @ $2,050/oz
      { asset: 'XAG-s', amount: '150.0000' }, // $3,712.50 @ $24.75/oz
      { asset: 'XPT-s', amount: '0.8000' }, // $780.40 @ $975.50/oz
      { asset: 'XPD-s', amount: '0.3000' }, // $345.225 @ $1,150.75/oz
      { asset: 'XCU-s', amount: '80.0000' }, // $660 @ $8.25/lb
    ];

    // Add funding balances
    for (const { asset, amount } of fundingBalances) {
      const balance: Balance = {
        id: uuidv4(),
        accountId: fundingAccount.id,
        asset,
        amount,
        lockedAmount: '0',
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
      WalletController.getAllBalances().push(balance);
      logInfo(`Added ${amount} ${asset} to funding account`);
    }

    // Add trading balances
    for (const { asset, amount } of tradingBalances) {
      const balance: Balance = {
        id: uuidv4(),
        accountId: tradingAccount.id,
        asset,
        amount,
        lockedAmount: '0',
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
      WalletController.getAllBalances().push(balance);
      logInfo(`Added ${amount} ${asset} to trading account`);
    }

    // 4. Add sample transactions (balance changes)
    logInfo('Adding sample transaction history...');

    const balanceChanges: BalanceChange[] = [
      // Initial deposits
      {
        id: uuidv4(),
        balanceId:
          WalletController.getAllBalances().find(b => b.asset === 'USD')?.id ||
          '',
        changeType: 'CREDIT',
        amount: '10000.00',
        previousAmount: '0',
        newAmount: '10000.00',
        reference: 'INITIAL_DEPOSIT_USD',
        description: 'Initial USD deposit for development',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        id: uuidv4(),
        balanceId:
          WalletController.getAllBalances().find(b => b.asset === 'PAXG')?.id ||
          '',
        changeType: 'CREDIT',
        amount: '2.5000',
        previousAmount: '0',
        newAmount: '2.5000',
        reference: 'INITIAL_DEPOSIT_PAXG',
        description: 'Initial PAXG deposit for development',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
      // Transfers
      {
        id: uuidv4(),
        balanceId:
          WalletController.getAllBalances().find(b => b.asset === 'XAU-s')
            ?.id || '',
        changeType: 'MINT',
        amount: '1.2500',
        previousAmount: '0',
        newAmount: '1.2500',
        reference: 'TRANSFER_PAXG_TO_XAU',
        description: 'Converted PAXG to XAU-s for trading',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      // Recent trades
      {
        id: uuidv4(),
        balanceId:
          WalletController.getAllBalances().find(b => b.asset === 'XAG-s')
            ?.id || '',
        changeType: 'TRADE',
        amount: '150.0000',
        previousAmount: '0',
        newAmount: '150.0000',
        reference: 'TRADE_XAU_TO_XAG',
        description: 'Traded XAU-s for XAG-s',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: uuidv4(),
        balanceId:
          WalletController.getAllBalances().find(b => b.asset === 'XPT-s')
            ?.id || '',
        changeType: 'TRADE',
        amount: '0.8000',
        previousAmount: '0',
        newAmount: '0.8000',
        reference: 'TRADE_XAG_TO_XPT',
        description: 'Traded XAG-s for XPT-s',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: uuidv4(),
        balanceId:
          WalletController.getAllBalances().find(b => b.asset === 'USDC')?.id ||
          '',
        changeType: 'CREDIT',
        amount: '5000.00',
        previousAmount: '0',
        newAmount: '5000.00',
        reference: 'DEPOSIT_USDC_BANK',
        description: 'Bank wire converted to USDC',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
    ];

    for (const change of balanceChanges) {
      WalletController.getBalanceChanges().push(change);
      logInfo(`Added transaction: ${change.description}`);
    }

    // 5. Add sample trades
    logInfo('Adding sample trade history...');

    const sampleTrades: Trade[] = [
      {
        id: uuidv4(),
        userId: devUser.id,
        fromAccountId: tradingAccount.id,
        toAccountId: tradingAccount.id,
        assetSold: 'XAU-s',
        assetBought: 'XAG-s',
        amountSold: '0.5000',
        amountBought: '41.4141',
        price: '82.8282',
        feeAmount: '0.0025',
        feeAsset: 'XAU-s',
        status: TRADE_STATUS.FILLED,
        orderType: 'MARKET',
        executedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reference: 'MARKET_XAU_XAG_001',
        metadata: {
          spread: '1.66',
          feeRate: '0.50',
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: uuidv4(),
        userId: devUser.id,
        fromAccountId: tradingAccount.id,
        toAccountId: tradingAccount.id,
        assetSold: 'XAG-s',
        assetBought: 'XPT-s',
        amountSold: '30.0000',
        amountBought: '0.7500',
        price: '0.0250',
        feeAmount: '0.1500',
        feeAsset: 'XAG-s',
        status: TRADE_STATUS.FILLED,
        orderType: 'MARKET',
        executedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        reference: 'MARKET_XAG_XPT_001',
        metadata: {
          spread: '0.49',
          feeRate: '0.50',
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const trade of sampleTrades) {
      TradeController.getAllTrades().push(trade);
      logInfo(`Added trade: ${trade.assetSold} -> ${trade.assetBought}`);
    }

    // 6. Summary
    console.log('\n📊 Seeding Summary:');
    console.log('===================');
    logInfo(`Users: ${AuthController.getAllUsers().length}`);
    logInfo(
      `Accounts: ${AuthController.getAllUsers().reduce((sum, u) => sum + AuthController.getUserAccounts(u.id).length, 0)}`
    );
    logInfo(`Balances: ${WalletController.getAllBalances().length}`);
    logInfo(`Transactions: ${WalletController.getBalanceChanges().length}`);
    logInfo(`Trades: ${TradeController.getAllTrades().length}`);

    // Calculate total portfolio value
    const allBalances = WalletController.getAllBalances();
    const prices = {
      PAXG: 2050.25,
      'XAU-s': 2050.25,
      USD: 1.0,
      USDC: 1.0,
      'XAG-s': 24.75,
      'XPT-s': 975.5,
      'XPD-s': 1150.75,
      'XCU-s': 8.25,
    };

    const totalValue = allBalances.reduce((sum, balance) => {
      const price = prices[balance.asset as keyof typeof prices] || 0;
      return sum + parseFloat(balance.amount) * price;
    }, 0);

    console.log(`\n💰 Total Portfolio Value: $${totalValue.toLocaleString()}`);

    console.log('\n🎯 Ready for dashboard testing:');
    console.log('  • Visit http://localhost:3000/dashboard');
    console.log('  • Login with:');
    console.log('    Email: dev@local.test');
    console.log('    Password: pbcextest1');
    console.log('  • Check balances, prices, and activity');

    console.log('\n✅ Development data seeded successfully!\n');
  } catch (error) {
    logError('Failed to seed development data', error as Error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  seedDevData();
}

export default seedDevData;
