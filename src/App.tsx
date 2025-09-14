import React, { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Index from './pages/Index';
import Markets from './pages/Markets';
import Trade from './pages/Trade';
import Trading from './pages/Trading';
import CoinTrading from './pages/CoinTrading';
import FxTrading from './pages/FxTrading';
import Franchise from './pages/Franchise';
import Education from './pages/Education';
import MyAssets from './pages/MyAssets';
import MySpending from './pages/MySpending';
import TransactionHistory from './pages/TransactionHistory';
import OrderHistory from './pages/OrderHistory';
import TitledAsset from './pages/TitledAsset';
import Realize from './pages/Realize';
import PnL from './pages/PnL';
import ProviderSettings from './pages/ProviderSettings';
import LargeLimit from './pages/LargeLimit';
import Careers from './pages/Careers';
import About from './pages/About';
import Press from './pages/Press';
import Investors from './pages/Investors';
import DigitalWallet from './pages/DigitalWallet';
import AssetTrading from './pages/AssetTrading';
import GlobalPayments from './pages/GlobalPayments';
import MobileApp from './pages/MobileApp';
import Contact from './pages/Contact';
import ThankYou from './pages/ThankYou';
import Shop from './pages/Shop';
import CommodityDetail from './pages/CommodityDetail';
import Account from './pages/Account';
import QuickBuy from './pages/buy/QuickBuy';
import BuyWithCard from './pages/buy/BuyWithCard';
import Convert from './pages/Convert';
import Deposit from './pages/Deposit';
import Balances from './pages/Balances';
import SpotUSD from './pages/trading/SpotUSD';
import SpotUSDC from './pages/trading/SpotUSDC';
import CoinToCoin from './pages/trading/CoinToCoin';
import InternalTransfer from './pages/send/InternalTransfer';
import CryptoWithdrawal from './pages/send/CryptoWithdrawal';
import BankTransfer from './pages/send/BankTransfer';
import PayWithQR from './pages/pay/PayWithQR';
import ReceiveWithQR from './pages/receive/ReceiveWithQR';
import CardSpend from './pages/card/Spend';
import BillPay from './pages/pay/BillPay';
import RequestPayment from './pages/pay/RequestPayment';
import RecurringTransfers from './pages/send/Recurring';
import DCA from './pages/trade/DCA';
import HelpCenter from './pages/support/HelpCenter';
import Security from './pages/support/Security';
import Compliance from './pages/support/Compliance';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import Regulatory from './pages/legal/Regulatory';
import Licenses from './pages/legal/Licenses';
import LegalList from './pages/legal/LegalList';
import LegalView from './pages/legal/LegalView';

import PrivacyHub from './pages/legal/privacy';
import ComplianceHub from './pages/legal/compliance';
import TermsRiskHub from './pages/legal/terms-risk';
import OperationsHub from './pages/legal/operations';
import Health from './pages/Health';
import NotFound from './pages/NotFound';
import AdminTrade from './pages/AdminTrade';
import AdminKPI from './pages/AdminKPI';

// Development-only imports (tree-shaken out in production)
const DevIntegrations = import.meta.env.DEV
  ? React.lazy(() => import('./pages/DevIntegrations'))
  : null;

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Helmet>
          <title>
            PBCex - Asset-Backed Digital Banking | Trade Gold, Silver &
            Commodities
          </title>
          <meta
            name='description'
            content='A Bank for the People — Backed by Real Assets, Connected to the World. Trade gold, silver, commodities with full regulatory compliance and bank-grade security.'
          />
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <meta
            property='og:title'
            content='PBCex - Asset-Backed Digital Banking'
          />
          <meta
            property='og:description'
            content='Trade precious metals and commodities with full regulatory compliance. Secure, transparent, and innovative digital banking backed by real assets.'
          />
          <meta property='og:type' content='website' />
          <meta property='og:url' content='https://pbcex.com' />
          <meta name='twitter:card' content='summary_large_image' />
          <link rel='canonical' href='https://pbcex.com' />
        </Helmet>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Index />} />
            <Route path='/markets' element={<Markets />} />
            <Route path='/trade/:pair' element={<Trade />} />
            <Route path='/trading' element={<Trading />} />
            <Route path='/coin-trading' element={<CoinTrading />} />
            <Route path='/admin/trade' element={<AdminTrade />} />
            <Route path='/admin/kpi' element={<AdminKPI />} />
            <Route path='/fx-trading' element={<FxTrading />} />
            <Route path='/franchise' element={<Franchise />} />
            <Route path='/education' element={<Education />} />
            <Route path='/my-assets' element={<MyAssets />} />
            <Route path='/my-spending' element={<MySpending />} />
            <Route
              path='/transaction-history'
              element={<TransactionHistory />}
            />
            <Route path='/order-history' element={<OrderHistory />} />
            <Route path='/titled-asset/:address' element={<TitledAsset />} />
            <Route path='/realize' element={<Realize />} />
            <Route path='/pnl' element={<PnL />} />
            <Route path='/provider-settings' element={<ProviderSettings />} />
            <Route path='/large-limit' element={<LargeLimit />} />
            <Route path='/careers' element={<Careers />} />
            <Route path='/about' element={<About />} />
            <Route path='/press' element={<Press />} />
            <Route path='/investors' element={<Investors />} />
            <Route path='/wallet' element={<DigitalWallet />} />
            <Route path='/asset-trading' element={<AssetTrading />} />
            <Route path='/payments' element={<GlobalPayments />} />
            <Route path='/app' element={<MobileApp />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/thank-you' element={<ThankYou />} />
            <Route path='/shop' element={<Shop />} />
            
            {/* Buy/Convert/Deposit Routes */}
            <Route path='/buy' element={<QuickBuy />} />
            <Route path='/buy/card' element={<BuyWithCard />} />
            <Route path='/convert' element={<Convert />} />
            <Route path='/deposit' element={<Deposit />} />
            <Route path='/balances' element={<Balances />} />
            
            {/* Trading Routes */}
            <Route path='/trading/spot-usd' element={<SpotUSD />} />
            <Route path='/trading/spot-usdc' element={<SpotUSDC />} />
            <Route path='/trading/coin' element={<CoinToCoin />} />
            
            {/* Account Routes */}
            <Route path='/account' element={<Account />} />
            <Route path='/account/identity' element={<Account />} />
            <Route path='/account/security' element={<Account />} />
            <Route path='/account/payments' element={<Account />} />
            <Route path='/account/notifications' element={<Account />} />
            <Route path='/account/api-keys' element={<Account />} />
            <Route path='/account/tax' element={<Account />} />

            {/* Send/Pay Routes */}
            <Route path='/send/internal' element={<InternalTransfer />} />
            <Route path='/send/crypto' element={<CryptoWithdrawal />} />
            <Route path='/send/bank' element={<BankTransfer />} />
            <Route path='/pay/qr' element={<PayWithQR />} />
            <Route path='/receive/qr' element={<ReceiveWithQR />} />
            <Route path='/card/spend' element={<CardSpend />} />
            <Route path='/pay/bills' element={<BillPay />} />
            <Route path='/pay/request' element={<RequestPayment />} />
            <Route path='/send/recurring' element={<RecurringTransfers />} />
            <Route path='/trade/dca' element={<DCA />} />
            <Route path='/support/help-center' element={<HelpCenter />} />
            <Route path='/support/security' element={<Security />} />
            <Route path='/support/compliance' element={<Compliance />} />
            <Route path='/legal' element={<LegalList />} />
            <Route path='/legal/privacy' element={<PrivacyHub />} />
            <Route path='/legal/compliance' element={<ComplianceHub />} />
            <Route path='/legal/terms-risk' element={<TermsRiskHub />} />
            <Route path='/legal/operations' element={<OperationsHub />} />
            <Route path='/legal/:slug' element={<LegalView />} />
            <Route path='/legal/privacy-policy' element={<PrivacyPolicy />} />
            <Route
              path='/legal/terms-of-service'
              element={<TermsOfService />}
            />
            {/* Redirect legacy regulatory path to disclosures */}
            <Route
              path='/legal/regulatory'
              element={<Navigate to='/disclosures' replace />}
            />
            <Route path='/legal/licenses' element={<Licenses />} />
            <Route path='/health' element={<Health />} />
            {/* Development-only routes */}
            {import.meta.env.DEV && DevIntegrations && (
              <Route
                path='/dev/integrations'
                element={
                  <Suspense
                    fallback={
                      <div className='flex items-center justify-center min-h-screen'>
                        Loading...
                      </div>
                    }
                  >
                    <DevIntegrations />
                  </Suspense>
                }
              />
            )}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path='*' element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
