import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface OrderPanelProps {
  pair: string;
}

const OrderPanel = ({ pair }: OrderPanelProps) => {
  const [orderType, setOrderType] = useState("limit");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const handleSubmitOrder = (side: "buy" | "sell") => {
    if (!price || !amount) {
      toast({
        title: "Invalid Order",
        description: "Please enter both price and amount",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Order Placed",
      description: `${side.toUpperCase()} order for ${amount} ${pair.split("/")[0]} at $${price}`,
    });

    setPrice("");
    setAmount("");
  };

  const total = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : "0.00";

  return (
    <div className="h-full bg-black">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white mb-3">Place Order</h3>
        
        {/* Order Type Selection */}
        <div className="flex bg-gray-900 rounded-md p-1 mb-4">
          <Button
            variant={orderType === "limit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setOrderType("limit")}
            className="flex-1 text-xs h-8"
          >
            Limit
          </Button>
          <Button
            variant={orderType === "market" ? "default" : "ghost"}
            size="sm"
            onClick={() => setOrderType("market")}
            className="flex-1 text-xs h-8"
          >
            Market
          </Button>
          <Button
            variant={orderType === "stop" ? "default" : "ghost"}
            size="sm"
            onClick={() => setOrderType("stop")}
            className="flex-1 text-xs h-8"
          >
            Trigger
          </Button>
        </div>
      </div>
      
      <div className="p-3 space-y-3">

        {/* Price Input */}
        {orderType !== "market" && (
          <div>
            <Label htmlFor="price" className="text-gray-300 text-xs">
              Price (USD)
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2,380.50"
              className="mt-1 bg-gray-900 border-gray-700 text-white text-sm h-9"
            />
          </div>
        )}

        {/* Amount Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="amount" className="text-gray-300 text-xs">
              Amount (grams)
            </Label>
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" className="text-xs h-5 px-1 text-gray-400">25%</Button>
              <Button size="sm" variant="ghost" className="text-xs h-5 px-1 text-gray-400">50%</Button>
              <Button size="sm" variant="ghost" className="text-xs h-5 px-1 text-gray-400">75%</Button>
              <Button size="sm" variant="ghost" className="text-xs h-5 px-1 text-gray-400">Max</Button>
            </div>
          </div>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-gray-900 border-gray-700 text-white text-sm h-9"
          />
        </div>

        {/* Advanced Options */}
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-400 hover:text-white p-0 h-6"
          >
            + Set Take Profit / Stop Loss
          </Button>
        </div>

        {/* Total */}
        <div className="p-2 bg-gray-900 rounded border border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Total:</span>
            <span className="text-white font-mono text-sm">
              ${total}
            </span>
          </div>
        </div>

        {/* Buy/Sell Buttons */}
        <div className="space-y-2">
          <Button
            onClick={() => handleSubmitOrder("buy")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-10"
            disabled={!amount || (!price && orderType === "limit")}
          >
            Buy {pair.split("/")[0]}
          </Button>
          <Button
            onClick={() => handleSubmitOrder("sell")}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-10"
            disabled={!amount || (!price && orderType === "limit")}
          >
            Sell {pair.split("/")[0]}
          </Button>
        </div>
      </div>

      {/* Balance Info */}
      <div className="p-3 border-t border-gray-800 bg-gray-900/50">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Available USD:</span>
            <span className="text-white font-mono">$12,450.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Available Gold:</span>
            <span className="text-gold font-mono">24.5g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Buying Power:</span>
            <span className="text-green-400 font-mono">$12,450.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPanel;