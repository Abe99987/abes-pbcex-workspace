import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError } from '@/utils/logger';
import { Balance, BalanceUtils, BalanceChange } from '@/models/Balance';
import { ASSETS, ACCOUNT_TYPES } from '@/utils/constants';
import { AuthController } from './AuthController';

/**
 * Wallet Controller for PBCEx
 * Handles account balances, transfers, deposits, and withdrawals
 */

// In-memory stores for balances and transactions
const balances: Balance[] = [];
const balanceChanges: BalanceChange[] = [];

export class WalletController {
  /**
   * GET /api/wallet/balances
   * Get user account balances
   */
  static getBalances = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const startTs = Date.now();
    if (process.env.E2E_TEST_ENABLED === 'true') {
      console.log('E2E_BALANCES_START', { userId, ts: new Date().toISOString() });
    }

    // Get user accounts
    const userAccounts = AuthController.getUserAccounts(userId);
    const fundingAccount = userAccounts.find(a => a.type === ACCOUNT_TYPES.FUNDING);
    const tradingAccount = userAccounts.find(a => a.type === ACCOUNT_TYPES.TRADING);

    if (!fundingAccount || !tradingAccount) {
      throw createError.internal('User accounts not properly initialized');
    }

    // Get balances for each account
    const fundingBalances = WalletController.getAccountBalances(fundingAccount.id);
    const tradingBalances = WalletController.getAccountBalances(tradingAccount.id);

    // Calculate USD values (mock prices for now)
    const prices = await WalletController.getCurrentPrices();
    
    const fundingBalancesWithValue = fundingBalances.map(balance => ({
      asset: balance.asset,
      amount: BalanceUtils.formatAmount(balance.amount),
      lockedAmount: BalanceUtils.formatAmount(balance.lockedAmount),
      availableAmount: BalanceUtils.formatAmount(BalanceUtils.getAvailableAmount(balance)),
      usdValue: WalletController.calculateUsdValue(balance.amount, balance.asset, prices),
    }));

    const tradingBalancesWithValue = tradingBalances.map(balance => ({
      asset: balance.asset,
      amount: BalanceUtils.formatAmount(balance.amount),
      lockedAmount: BalanceUtils.formatAmount(balance.lockedAmount),
      availableAmount: BalanceUtils.formatAmount(BalanceUtils.getAvailableAmount(balance)),
      usdValue: WalletController.calculateUsdValue(balance.amount, balance.asset, prices),
    }));

    const fundingTotal = fundingBalancesWithValue
      .reduce((sum, b) => sum + parseFloat(b.usdValue), 0)
      .toFixed(2);

    const tradingTotal = tradingBalancesWithValue
      .reduce((sum, b) => sum + parseFloat(b.usdValue), 0)
      .toFixed(2);

    res.json({
      code: 'SUCCESS',
      data: {
        funding: {
          id: fundingAccount.id,
          type: ACCOUNT_TYPES.FUNDING,
          name: fundingAccount.name,
          balances: fundingBalancesWithValue,
          totalUsdValue: fundingTotal,
        },
        trading: {
          id: tradingAccount.id,
          type: ACCOUNT_TYPES.TRADING,
          name: tradingAccount.name,
          balances: tradingBalancesWithValue,
          totalUsdValue: tradingTotal,
        },
        combined: {
          totalUsdValue: (parseFloat(fundingTotal) + parseFloat(tradingTotal)).toFixed(2),
        },
      },
    });

    if (process.env.E2E_TEST_ENABLED === 'true') {
      console.log('E2E_BALANCES_DONE', { userId, durationMs: Date.now() - startTs });
    }
  });

  /**
   * POST /api/wallet/transfer
   * Transfer between funding and trading accounts (PAXG ↔ XAU-s conversion)
   */
  static transfer = asyncHandler(async (req: Request, res: Response) => {
    const { fromAccount, toAccount, asset, amount } = req.body;
    const userId = req.user!.id;

    logInfo('Wallet transfer initiated', { 
      userId, 
      fromAccount, 
      toAccount, 
      asset, 
      amount 
    });

    // Validate transfer parameters
    if (fromAccount === toAccount) {
      throw createError.validation('Cannot transfer to the same account type');
    }

    if (!['FUNDING', 'TRADING'].includes(fromAccount) || !['FUNDING', 'TRADING'].includes(toAccount)) {
      throw createError.validation('Invalid account type');
    }

    // Get user accounts
    const userAccounts = AuthController.getUserAccounts(userId);
    const sourceAccount = userAccounts.find(a => a.type === fromAccount);
    const targetAccount = userAccounts.find(a => a.type === toAccount);

    if (!sourceAccount || !targetAccount) {
      throw createError.notFound('Account');
    }

    // Determine conversion
    let sourceAsset = asset;
    let targetAsset = asset;

    if (fromAccount === 'FUNDING' && toAccount === 'TRADING') {
      // PAXG → XAU-s (minting synthetic)
      if (asset === 'PAXG') {
        sourceAsset = 'PAXG';
        targetAsset = 'XAU-s';
      } else {
        throw createError.validation('Only PAXG can be converted from Funding to Trading account');
      }
    } else if (fromAccount === 'TRADING' && toAccount === 'FUNDING') {
      // XAU-s → PAXG (burning synthetic)
      if (asset === 'XAU-s') {
        sourceAsset = 'XAU-s';
        targetAsset = 'PAXG';
      } else {
        throw createError.validation('Only XAU-s can be converted from Trading to Funding account');
      }
    } else {
      throw createError.validation('Invalid transfer direction');
    }

    // Check sufficient balance
    const sourceBalance = WalletController.getBalance(sourceAccount.id, sourceAsset);
    if (!BalanceUtils.hasSufficientBalance(sourceBalance, amount)) {
      throw createError.validation(`Insufficient ${sourceAsset} balance`);
    }

    // Perform atomic transfer
    const transferId = uuidv4();
    
    try {
      // Debit source account
      await WalletController.updateBalance(
        sourceAccount.id,
        sourceAsset,
        BalanceUtils.subtract(sourceBalance.amount, amount),
        'TRANSFER_OUT',
        amount,
        transferId,
        `Transfer ${amount} ${sourceAsset} to ${toAccount} account`
      );

      // Credit target account (1:1 conversion for PAXG ↔ XAU-s)
      const targetBalance = WalletController.getBalance(targetAccount.id, targetAsset);
      await WalletController.updateBalance(
        targetAccount.id,
        targetAsset,
        BalanceUtils.add(targetBalance.amount, amount),
        targetAsset === 'XAU-s' ? 'MINT' : 'BURN',
        amount,
        transferId,
        `Transfer ${amount} ${targetAsset} from ${fromAccount} account`
      );

      logInfo('Wallet transfer completed successfully', { 
        userId, 
        transferId,
        sourceAsset,
        targetAsset,
        amount,
      });

      res.json({
        code: 'SUCCESS',
        message: 'Transfer completed successfully',
        data: {
          transferId,
          fromAccount: {
            type: fromAccount,
            asset: sourceAsset,
            amount,
          },
          toAccount: {
            type: toAccount,
            asset: targetAsset,
            amount,
          },
          conversionRate: '1.0000', // 1:1 for PAXG ↔ XAU-s
          completedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      logError('Wallet transfer failed', error as Error);
      throw createError.internal('Transfer failed');
    }
  });

  /**
   * POST /api/wallet/deposit
   * Initiate deposit to funding account
   */
  static deposit = asyncHandler(async (req: Request, res: Response) => {
    const { asset, amount, paymentMethod } = req.body;
    const userId = req.user!.id;

    logInfo('Deposit initiated', { userId, asset, amount, paymentMethod });

    // Validate asset (only real assets can be deposited)
    if (!['PAXG', 'USD', 'USDC'].includes(asset)) {
      throw createError.validation('Only real assets (PAXG, USD, USDC) can be deposited');
    }

    // Get funding account
    const userAccounts = AuthController.getUserAccounts(userId);
    const fundingAccount = userAccounts.find(a => a.type === ACCOUNT_TYPES.FUNDING);

    if (!fundingAccount) {
      throw createError.notFound('Funding account');
    }

    const depositId = uuidv4();

    // Simulate deposit process based on asset and payment method
    let depositInstructions: any = {};
    let estimatedTime = '1-3 business days';

    switch (asset) {
      case 'PAXG':
        depositInstructions = await WalletController.generatePaxgDepositInstructions(userId, amount);
        estimatedTime = '10-30 minutes (blockchain confirmation)';
        break;
      case 'USD':
        if (paymentMethod === 'BANK_TRANSFER') {
          depositInstructions = await WalletController.generateWireInstructions(userId, amount);
          estimatedTime = '1-2 business days';
        } else if (paymentMethod === 'ACH') {
          depositInstructions = await WalletController.generateAchInstructions(userId, amount);
          estimatedTime = '3-5 business days';
        }
        break;
      case 'USDC':
        depositInstructions = await WalletController.generateUsdcDepositInstructions(userId, amount);
        estimatedTime = '5-15 minutes (blockchain confirmation)';
        break;
    }

    res.status(201).json({
      code: 'SUCCESS',
      message: 'Deposit initiated successfully',
      data: {
        depositId,
        asset,
        amount,
        paymentMethod,
        status: 'PENDING',
        estimatedTime,
        instructions: depositInstructions,
        createdAt: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/wallet/withdraw
   * Initiate withdrawal from funding account
   */
  static withdraw = asyncHandler(async (req: Request, res: Response) => {
    const { asset, amount, destination } = req.body;
    const userId = req.user!.id;

    logInfo('Withdrawal initiated', { userId, asset, amount, destination: destination.type });

    // Validate asset (only real assets can be withdrawn)
    if (!['PAXG', 'USD', 'USDC'].includes(asset)) {
      throw createError.validation('Only real assets (PAXG, USD, USDC) can be withdrawn');
    }

    // Get funding account and check balance
    const userAccounts = AuthController.getUserAccounts(userId);
    const fundingAccount = userAccounts.find(a => a.type === ACCOUNT_TYPES.FUNDING);

    if (!fundingAccount) {
      throw createError.notFound('Funding account');
    }

    const balance = WalletController.getBalance(fundingAccount.id, asset);
    if (!BalanceUtils.hasSufficientBalance(balance, amount)) {
      throw createError.validation(`Insufficient ${asset} balance`);
    }

    const withdrawalId = uuidv4();

    // Calculate withdrawal fee (0.1% minimum $5 for crypto, $25 for fiat)
    const fee = WalletController.calculateWithdrawalFee(asset, amount);

    // Lock the withdrawal amount plus fee
    await WalletController.updateBalance(
      fundingAccount.id,
      asset,
      balance.amount,
      'LOCK',
      BalanceUtils.add(amount, fee),
      withdrawalId,
      `Lock funds for withdrawal ${withdrawalId}`
    );

    // Simulate withdrawal process
    const estimatedTime = asset === 'USD' ? '2-3 business days' : '30-60 minutes';

    logInfo('Withdrawal request created', { 
      userId, 
      withdrawalId, 
      asset, 
      amount, 
      fee 
    });

    res.status(201).json({
      code: 'SUCCESS',
      message: 'Withdrawal initiated successfully',
      data: {
        withdrawalId,
        asset,
        amount,
        fee,
        netAmount: BalanceUtils.subtract(amount, fee),
        status: 'PENDING',
        estimatedTime,
        destination: {
          type: destination.type,
          // Don't return full destination details for security
        },
        createdAt: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /api/wallet/transactions
   * Get transaction history
   */
  static getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { limit = 50, offset = 0, type } = req.query;

    // Get user accounts
    const userAccounts = AuthController.getUserAccounts(userId);
    const accountIds = userAccounts.map(a => a.id);

    // Filter balance changes for user's accounts
    let userTransactions = balanceChanges.filter(bc => {
      const balance = balances.find(b => b.id === bc.balanceId);
      return balance && accountIds.includes(balance.accountId);
    });

    // Filter by type if specified
    if (type) {
      userTransactions = userTransactions.filter(tx => tx.changeType === type);
    }

    // Sort by date (newest first) and paginate
    userTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const paginatedTransactions = userTransactions.slice(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string)
    );

    // Format transactions for response
    const formattedTransactions = paginatedTransactions.map(tx => {
      const balance = balances.find(b => b.id === tx.balanceId);
      const account = userAccounts.find(a => a.id === balance?.accountId);

      return {
        id: tx.id,
        type: tx.changeType,
        asset: balance?.asset,
        amount: tx.amount,
        accountType: account?.type,
        description: tx.description,
        reference: tx.reference,
        createdAt: tx.createdAt,
      };
    });

    res.json({
      code: 'SUCCESS',
      data: {
        transactions: formattedTransactions,
        total: userTransactions.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  });

  // Private helper methods

  private static getAccountBalances(accountId: string): Balance[] {
    return balances.filter(b => b.accountId === accountId);
  }

  private static getBalance(accountId: string, asset: string): Balance {
    let balance = balances.find(b => b.accountId === accountId && b.asset === asset);
    
    if (!balance) {
      // Create new balance with zero amount
      balance = {
        id: uuidv4(),
        accountId,
        asset,
        amount: '0',
        lockedAmount: '0',
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
      balances.push(balance);
    }
    
    return balance;
  }

  private static async updateBalance(
    accountId: string,
    asset: string,
    newAmount: string,
    changeType: BalanceChange['changeType'],
    changeAmount: string,
    reference?: string,
    description?: string
  ): Promise<Balance> {
    const balance = WalletController.getBalance(accountId, asset);
    const previousAmount = balance.amount;
    
    balance.amount = newAmount;
    balance.lastUpdated = new Date();

    // Record balance change
    const balanceChange: BalanceChange = {
      id: uuidv4(),
      balanceId: balance.id,
      changeType,
      amount: changeAmount,
      previousAmount,
      newAmount,
      reference,
      description,
      createdAt: new Date(),
    };

    balanceChanges.push(balanceChange);

    return balance;
  }

  private static async getCurrentPrices(): Promise<Record<string, number>> {
    // Mock current prices (in production, this would come from PriceFeedService)
    return {
      'PAXG': 2050.25,
      'XAU-s': 2050.25,
      'USD': 1.0,
      'USDC': 1.0,
      'XAG-s': 24.75,
      'XPT-s': 975.50,
      'XPD-s': 1150.75,
      'XCU-s': 8.25,
    };
  }

  private static calculateUsdValue(amount: string, asset: string, prices: Record<string, number>): string {
    const amountNum = parseFloat(amount) || 0;
    const price = prices[asset] || 0;
    return (amountNum * price).toFixed(2);
  }

  private static calculateWithdrawalFee(asset: string, amount: string): string {
    const amountNum = parseFloat(amount);
    
    if (asset === 'USD') {
      return Math.max(25, amountNum * 0.001).toFixed(2); // 0.1%, min $25
    } else {
      const feeUsd = Math.max(5, amountNum * 0.001); // 0.1%, min $5 USD
      // Convert to asset terms (simplified)
      return asset === 'PAXG' ? (feeUsd / 2050).toFixed(8) : feeUsd.toFixed(6);
    }
  }

  private static async generatePaxgDepositInstructions(userId: string, amount: string) {
    // Simulate Paxos API call to generate deposit address
    return {
      type: 'CRYPTO_DEPOSIT',
      asset: 'PAXG',
      network: 'Ethereum',
      depositAddress: `0x${userId.slice(-8)}...${Math.random().toString(16).slice(-8)}`,
      memo: `PBCEX-${userId.slice(-8)}`,
      minimumAmount: '0.001',
      confirmations: 12,
      note: 'Send only PAXG tokens to this address. Other tokens will be lost.',
    };
  }

  private static async generateWireInstructions(userId: string, amount: string) {
    return {
      type: 'WIRE_TRANSFER',
      bankName: 'PBCEx Partner Bank',
      routingNumber: '123456789',
      accountNumber: `PBCEX${userId.slice(-8)}`,
      accountName: 'PBCEx Client Funds',
      reference: `DEPOSIT-${userId.slice(-8)}-${Date.now()}`,
      note: 'Include reference number in wire memo',
    };
  }

  private static async generateAchInstructions(userId: string, amount: string) {
    return {
      type: 'ACH_TRANSFER',
      routingNumber: '123456789',
      accountNumber: `ACH${userId.slice(-8)}`,
      accountType: 'CHECKING',
      note: 'ACH transfers take 3-5 business days',
    };
  }

  private static async generateUsdcDepositInstructions(userId: string, amount: string) {
    return {
      type: 'CRYPTO_DEPOSIT',
      asset: 'USDC',
      network: 'Ethereum',
      depositAddress: `0x${userId.slice(-8)}...${Math.random().toString(16).slice(-8)}`,
      memo: `PBCEX-USDC-${userId.slice(-8)}`,
      minimumAmount: '1.00',
      confirmations: 12,
      note: 'Send only USDC tokens to this address. Other tokens will be lost.',
    };
  }

  // Utility methods for testing and admin
  static getAllBalances = (): Balance[] => balances;
  static getUserBalances = (userId: string): Balance[] => {
    const userAccounts = AuthController.getUserAccounts(userId);
    const accountIds = userAccounts.map(a => a.id);
    return balances.filter(b => accountIds.includes(b.accountId));
  };
  static getBalanceChanges = (): BalanceChange[] => balanceChanges;
  /**
   * Test-only seeding helper for E2E: set a specific balance for a user's account type and asset
   */
  static async seedBalanceForTest(
    userId: string,
    accountType: 'FUNDING' | 'TRADING',
    asset: string,
    amount: string
  ): Promise<void> {
    const userAccounts = AuthController.getUserAccounts(userId);
    const account = userAccounts.find(a => a.type === accountType);
    if (!account) throw createError.notFound('Account');
    const bal = WalletController.getBalance(account.id, asset);
    const previous = bal.amount;
    bal.amount = amount;
    bal.lastUpdated = new Date();
    balanceChanges.push({
      id: uuidv4(),
      balanceId: bal.id,
      changeType: 'CREDIT',
      amount,
      previousAmount: previous,
      newAmount: amount,
      reference: 'E2E-SEED',
      description: `E2E seed ${asset}=${amount} on ${accountType}`,
      createdAt: new Date(),
    });
  }
}
