import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateOrderBookData } from "./TradingUtils";

interface OrderBookProps {
  pair: string;
}

const OrderBook = ({ pair }: OrderBookProps) => {
  const [orderBook, setOrderBook] = useState<{
    bids: Array<{ price: number; amount: number; total: number }>;
    asks: Array<{ price: number; amount: number; total: number }>;
  }>({ bids: [], asks: [] });

  useEffect(() => {
    const data = generateOrderBookData();
    setOrderBook(data);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      const newData = generateOrderBookData();
      setOrderBook(newData);
    }, 2000);

    return () => clearInterval(interval);
  }, [pair]);

  return (
    <div className="h-full bg-slate-950 p-4">
      <h3 className="text-sm font-semibold text-gold mb-4">Order Book</h3>
      
      <div className="space-y-4">
        {/* Asks (Sell Orders) */}
        <div>
          <div className="text-xs text-slate-400 mb-2 grid grid-cols-3 gap-2">
            <span>Price (USD)</span>
            <span>Amount</span>
            <span>Total</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {orderBook.asks.slice(0, 8).reverse().map((ask, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-2 text-xs py-1 relative"
              >
                <div
                  className="absolute inset-0 bg-red-500/10"
                  style={{ width: `${(ask.total / Math.max(...orderBook.asks.map(a => a.total))) * 100}%` }}
                />
                <span className="text-red-400 relative z-10">{ask.price.toFixed(2)}</span>
                <span className="text-slate-300 relative z-10">{ask.amount.toFixed(3)}</span>
                <span className="text-slate-400 relative z-10">{ask.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spread */}
        <div className="border-t border-b border-slate-800 py-2">
          <div className="text-center">
            <div className="text-xs text-slate-400">Spread</div>
            <div className="text-sm text-gold">
              {orderBook.asks.length > 0 && orderBook.bids.length > 0
                ? (orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)
                : "0.00"}
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {orderBook.bids.slice(0, 8).map((bid, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-2 text-xs py-1 relative"
              >
                <div
                  className="absolute inset-0 bg-green-500/10"
                  style={{ width: `${(bid.total / Math.max(...orderBook.bids.map(b => b.total))) * 100}%` }}
                />
                <span className="text-green-400 relative z-10">{bid.price.toFixed(2)}</span>
                <span className="text-slate-300 relative z-10">{bid.amount.toFixed(3)}</span>
                <span className="text-slate-400 relative z-10">{bid.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;