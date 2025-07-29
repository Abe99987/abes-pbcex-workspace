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
    <div className="h-full bg-slate-950 p-4">
      <h3 className="text-sm font-semibold text-gold mb-4">Place Order</h3>
      
      <div className="space-y-4">
        {/* Order Type Selector */}
        <div>
          <Label className="text-xs text-slate-400">Order Type</Label>
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger className="bg-slate-900 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="limit">Limit Order</SelectItem>
              <SelectItem value="market">Market Order</SelectItem>
              <SelectItem value="stop">Stop Order</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Input */}
        {orderType !== "market" && (
          <div>
            <Label className="text-xs text-slate-400">Price (USD)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-slate-900 border-slate-700 text-slate-100"
            />
          </div>
        )}

        {/* Amount Input */}
        <div>
          <Label className="text-xs text-slate-400">Amount ({pair.split("/")[0]})</Label>
          <Input
            type="number"
            placeholder="0.000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-slate-900 border-slate-700 text-slate-100"
          />
        </div>

        {/* Total */}
        <div>
          <Label className="text-xs text-slate-400">Total (USD)</Label>
          <div className="text-sm text-slate-100 py-2 px-3 bg-slate-900 rounded border border-slate-700">
            ${total}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleSubmitOrder("buy")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Buy {pair.split("/")[0]}
          </Button>
          <Button
            onClick={() => handleSubmitOrder("sell")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Sell {pair.split("/")[0]}
          </Button>
        </div>

        {/* Balance Information */}
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Available USD:</span>
              <span className="text-slate-100">$10,000.00</span>
            </div>
            <div className="flex justify-between">
              <span>Available {pair.split("/")[0]}:</span>
              <span className="text-slate-100">5.250</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPanel;