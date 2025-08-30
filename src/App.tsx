import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Trading from "./pages/Trading";
import CoinTrading from "./pages/CoinTrading";
import FxTrading from "./pages/FxTrading";
import Franchise from "./pages/Franchise";
import Education from "./pages/Education";
import MyAssets from "./pages/MyAssets";
import MySpending from "./pages/MySpending";
import TransactionHistory from "./pages/TransactionHistory";
import OrderHistory from "./pages/OrderHistory";
import TitledAsset from "./pages/TitledAsset";
import Realize from "./pages/Realize";
import PnL from "./pages/PnL";
import ProviderSettings from "./pages/ProviderSettings";
import LargeLimit from "./pages/LargeLimit";
import Careers from "./pages/Careers";
import About from "./pages/About";
import Press from "./pages/Press";
import Investors from "./pages/Investors";
import DigitalWallet from "./pages/DigitalWallet";
import AssetTrading from "./pages/AssetTrading";
import GlobalPayments from "./pages/GlobalPayments";
import MobileApp from "./pages/MobileApp";
import Contact from "./pages/Contact";
import ThankYou from "./pages/ThankYou";
import Shop from "./pages/Shop";
import CommodityDetail from "./pages/CommodityDetail";
import HelpCenter from "./pages/support/HelpCenter";
import Security from "./pages/support/Security";
import Compliance from "./pages/support/Compliance";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import Regulatory from "./pages/legal/Regulatory";
import Licenses from "./pages/legal/Licenses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/trading" element={<Trading />} />
          <Route path="/coin-trading" element={<CoinTrading />} />
          <Route path="/fx-trading" element={<FxTrading />} />
          <Route path="/franchise" element={<Franchise />} />
          <Route path="/education" element={<Education />} />
          <Route path="/my-assets" element={<MyAssets />} />
          <Route path="/my-spending" element={<MySpending />} />
          <Route path="/transaction-history" element={<TransactionHistory />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/titled-asset/:address" element={<TitledAsset />} />
          <Route path="/realize" element={<Realize />} />
          <Route path="/pnl" element={<PnL />} />
          <Route path="/provider-settings" element={<ProviderSettings />} />
          <Route path="/large-limit" element={<LargeLimit />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/about" element={<About />} />
          <Route path="/press" element={<Press />} />
          <Route path="/investors" element={<Investors />} />
          <Route path="/wallet" element={<DigitalWallet />} />
          <Route path="/asset-trading" element={<AssetTrading />} />
          <Route path="/payments" element={<GlobalPayments />} />
          <Route path="/app" element={<MobileApp />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:symbol" element={<CommodityDetail />} />
          <Route path="/support/help-center" element={<HelpCenter />} />
          <Route path="/support/security" element={<Security />} />
          <Route path="/support/compliance" element={<Compliance />} />
          <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/legal/terms-of-service" element={<TermsOfService />} />
          <Route path="/legal/regulatory" element={<Regulatory />} />
          <Route path="/legal/licenses" element={<Licenses />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
