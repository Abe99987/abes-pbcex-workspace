import Navigation from "@/components/Navigation";
import TradingInterface from "@/components/trading/TradingInterface";

const Trading = () => {
  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <Navigation />
      <TradingInterface />
    </div>
  );
};

export default Trading;