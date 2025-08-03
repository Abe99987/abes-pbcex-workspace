import Navigation from "@/components/Navigation";
import TradingInterface from "@/components/trading/TradingInterface";

const Trading = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TradingInterface />
    </div>
  );
};

export default Trading;