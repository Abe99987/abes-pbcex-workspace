import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { generateOrderBookData } from './TradingUtils';

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
    <div className='h-full bg-black flex flex-col'>
      {/* Header */}
      <div className='p-3 border-b border-gray-800'>
        <h3 className='text-sm font-semibold text-white'>Order Book</h3>
      </div>

      {/* Order Book Content */}
      <div className='flex-1 overflow-hidden'>
        {/* Asks (Sell Orders) */}
        <div className='h-[45%] overflow-y-auto'>
          <div className='px-3 py-1 bg-gray-900'>
            <div className='grid grid-cols-3 gap-2 text-xs text-gray-400 font-medium'>
              <span>Price (USD)</span>
              <span className='text-right'>Amount</span>
              <span className='text-right'>Total</span>
            </div>
          </div>

          <div>
            {orderBook.asks
              .slice(0, 8)
              .reverse()
              .map((ask, index) => {
                const total = ask.price * ask.amount;
                const maxTotal = Math.max(
                  ...orderBook.asks.map(a => a.price * a.amount)
                );
                const widthPercentage = (total / maxTotal) * 100;

                return (
                  <div
                    key={`ask-${index}`}
                    className='relative px-3 py-0.5 hover:bg-gray-800/50 cursor-pointer'
                  >
                    <div
                      className='absolute right-0 top-0 h-full bg-red-500/10'
                      style={{ width: `${widthPercentage}%` }}
                    />
                    <div className='relative grid grid-cols-3 gap-2 text-xs leading-5'>
                      <span className='text-red-400 font-mono'>
                        ${ask.price.toFixed(2)}
                      </span>
                      <span className='text-right text-white font-mono'>
                        {ask.amount.toFixed(3)}
                      </span>
                      <span className='text-right text-gray-300 font-mono'>
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Spread */}
        <div className='px-3 py-2 bg-gray-900 border-y border-gray-700'>
          <div className='text-center'>
            <div className='text-xs text-gray-400'>Spread</div>
            <div className='text-xs font-mono text-yellow-400'>
              {orderBook.asks.length > 0 && orderBook.bids.length > 0
                ? `$${(orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)} (${(((orderBook.asks[0].price - orderBook.bids[0].price) / orderBook.asks[0].price) * 100).toFixed(3)}%)`
                : '$0.00 (0.000%)'}
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className='h-[45%] overflow-y-auto'>
          <div>
            {orderBook.bids.slice(0, 8).map((bid, index) => {
              const total = bid.price * bid.amount;
              const maxTotal = Math.max(
                ...orderBook.bids.map(b => b.price * b.amount)
              );
              const widthPercentage = (total / maxTotal) * 100;

              return (
                <div
                  key={`bid-${index}`}
                  className='relative px-3 py-0.5 hover:bg-gray-800/50 cursor-pointer'
                >
                  <div
                    className='absolute right-0 top-0 h-full bg-green-500/10'
                    style={{ width: `${widthPercentage}%` }}
                  />
                  <div className='relative grid grid-cols-3 gap-2 text-xs leading-5'>
                    <span className='text-green-400 font-mono'>
                      ${bid.price.toFixed(2)}
                    </span>
                    <span className='text-right text-white font-mono'>
                      {bid.amount.toFixed(3)}
                    </span>
                    <span className='text-right text-gray-300 font-mono'>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
