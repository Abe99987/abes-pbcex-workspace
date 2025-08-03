import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ScaleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: string;
}

interface ScaleOrderPreview {
  orderNumber: number;
  price: number;
  amount: number;
  total: number;
}

const ScaleOrderModal = ({ isOpen, onClose, pair }: ScaleOrderModalProps) => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [totalAmount, setTotalAmount] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [bottomPrice, setBottomPrice] = useState("");
  const [numberOfOrders, setNumberOfOrders] = useState("5");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  
  const { toast } = useToast();

  const calculatePreview = (): ScaleOrderPreview[] => {
    if (!totalAmount || !entryPrice || !bottomPrice || !numberOfOrders) return [];
    
    const total = parseFloat(totalAmount);
    const entry = parseFloat(entryPrice);
    const bottom = parseFloat(bottomPrice);
    const orders = parseInt(numberOfOrders);
    
    if (orders < 2 || orders > 10) return [];
    if (side === "buy" && entry <= bottom) return [];
    if (side === "sell" && entry >= bottom) return [];
    
    const amountPerOrder = total / orders;
    const priceStep = Math.abs(entry - bottom) / (orders - 1);
    
    const preview: ScaleOrderPreview[] = [];
    
    for (let i = 0; i < orders; i++) {
      const price = side === "buy" 
        ? entry - (priceStep * i)
        : entry + (priceStep * i);
      
      preview.push({
        orderNumber: i + 1,
        price: price,
        amount: amountPerOrder,
        total: price * amountPerOrder
      });
    }
    
    return preview;
  };

  const preview = calculatePreview();
  const totalValue = preview.reduce((sum, order) => sum + order.total, 0);

  const handleSubmit = () => {
    if (!totalAmount || !entryPrice || !bottomPrice || !numberOfOrders) {
      toast({
        title: "Invalid Scale Order",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (preview.length === 0) {
      toast({
        title: "Invalid Price Range",
        description: "Please check your price range and order configuration",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Scale Order Placed",
      description: `${numberOfOrders} ${side.toUpperCase()} orders placed for ${pair.split("/")[0]}`,
    });

    // Reset form
    setTotalAmount("");
    setEntryPrice("");
    setBottomPrice("");
    setNumberOfOrders("5");
    setTakeProfit("");
    setStopLoss("");
    setShowPreview(false);
    onClose();
  };

  const handlePreview = () => {
    if (preview.length > 0) {
      setShowPreview(true);
    } else {
      toast({
        title: "Invalid Configuration",
        description: "Please check your inputs to generate preview",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Scale Order - {pair}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Side Selection */}
          <div>
            <Label className="text-gray-300 text-sm">Side</Label>
            <div className="flex bg-gray-800 rounded-md p-1 mt-1">
              <Button
                variant={side === "buy" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSide("buy")}
                className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700"
              >
                Buy
              </Button>
              <Button
                variant={side === "sell" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSide("sell")}
                className="flex-1 text-xs h-8 bg-red-600 hover:bg-red-700"
              >
                Sell
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Total Amount */}
            <div>
              <Label htmlFor="totalAmount" className="text-gray-300 text-sm">
                Total Amount (grams)
              </Label>
              <Input
                id="totalAmount"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="100.0"
                className="mt-1 bg-gray-800 border-gray-600 text-white"
              />
            </div>

            {/* Number of Orders */}
            <div>
              <Label htmlFor="numberOfOrders" className="text-gray-300 text-sm">
                Number of Orders (2-10)
              </Label>
              <Select value={numberOfOrders} onValueChange={setNumberOfOrders}>
                <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Entry Price */}
            <div>
              <Label htmlFor="entryPrice" className="text-gray-300 text-sm">
                {side === "buy" ? "Entry Price (Top)" : "Entry Price (Bottom)"} (USD)
              </Label>
              <Input
                id="entryPrice"
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="2,380.50"
                className="mt-1 bg-gray-800 border-gray-600 text-white"
              />
            </div>

            {/* Bottom Price */}
            <div>
              <Label htmlFor="bottomPrice" className="text-gray-300 text-sm">
                {side === "buy" ? "Bottom Price (Low)" : "Top Price (High)"} (USD)
              </Label>
              <Input
                id="bottomPrice"
                type="number"
                value={bottomPrice}
                onChange={(e) => setBottomPrice(e.target.value)}
                placeholder="2,300.00"
                className="mt-1 bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="takeProfit" className="text-gray-300 text-sm">
                Take Profit (USD) - Optional
              </Label>
              <Input
                id="takeProfit"
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="2,500.00"
                className="mt-1 bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="stopLoss" className="text-gray-300 text-sm">
                Stop Loss (USD) - Optional
              </Label>
              <Input
                id="stopLoss"
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="2,200.00"
                className="mt-1 bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && preview.length > 0 && (
            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-semibold">Order Preview</h4>
                  <Badge variant="outline" className="text-gray-300">
                    {preview.length} Orders
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {preview.map((order) => (
                    <div key={order.orderNumber} className="flex justify-between items-center p-2 bg-gray-700 rounded text-sm">
                      <span className="text-gray-300">Order {order.orderNumber}</span>
                      <span className="text-white">${order.price.toFixed(2)}</span>
                      <span className="text-gray-300">{order.amount.toFixed(2)}g</span>
                      <span className="text-white font-mono">${order.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold">Total Value:</span>
                    <span className="text-white font-mono text-lg">${totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handlePreview}
              variant="outline" 
              className="flex-1 border-gray-600 text-white hover:bg-gray-800"
            >
              Preview Orders
            </Button>
            <Button 
              onClick={handleSubmit}
              className={`flex-1 ${
                side === "buy" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"
              } text-white font-medium`}
              disabled={!showPreview || preview.length === 0}
            >
              Place Scale Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScaleOrderModal;