import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  User, 
  Wallet,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: {
    name: string;
    symbol: string;
    balance: string;
    icon: string;
  };
}

const SendModal = ({ open, onOpenChange, asset }: SendModalProps) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientType, setRecipientType] = useState("pbcex-user");
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    setIsConfirming(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Transfer Successful!",
      description: `${amount} ${asset?.symbol} sent to ${recipient}`,
    });
    
    setIsConfirming(false);
    onOpenChange(false);
    setRecipient("");
    setAmount("");
  };

  const maxBalance = parseFloat(asset?.balance?.replace(/[^0-9.]/g, '') || '0');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send {asset?.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Transfer your assets to another user or wallet
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Asset Display */}
          {asset && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{asset.icon}</span>
                    <div>
                      <div className="font-semibold">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">Available: {asset.balance}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recipient Type */}
          <div className="space-y-3">
            <Label>Recipient Type</Label>
            <RadioGroup value={recipientType} onValueChange={setRecipientType}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="pbcex-user" id="pbcex-user" />
                <User className="w-4 h-4" />
                <div className="flex-1">
                  <Label htmlFor="pbcex-user" className="font-medium">PBcex User</Label>
                  <div className="text-sm text-muted-foreground">Send to another PBcex user by username or email</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="external-wallet" id="external-wallet" />
                <Wallet className="w-4 h-4" />
                <div className="flex-1">
                  <Label htmlFor="external-wallet" className="font-medium">External Wallet</Label>
                  <div className="text-sm text-muted-foreground">Send to an external wallet address</div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Recipient Input */}
          <div className="space-y-3">
            <Label>
              {recipientType === "pbcex-user" ? "Username or Email" : "Wallet Address"}
            </Label>
            <Input
              placeholder={recipientType === "pbcex-user" ? "user@example.com" : "0x..."}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label>Amount</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={maxBalance}
                step="0.01"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto px-2 py-1 text-xs"
                onClick={() => setAmount(maxBalance.toString())}
              >
                Max
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Max: {asset?.balance}
            </div>
          </div>

          {/* Warning for External Transfers */}
          {recipientType === "external-wallet" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <strong className="text-yellow-800">External Transfer Notice</strong><br />
                    <span className="text-yellow-700">
                      Only redeemable tokens (like PAXG) can be sent to external wallets. 
                      Trade-only tokens remain within the PBcex ecosystem.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction Summary */}
          {amount && recipient && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{amount} {asset?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="truncate max-w-32">{recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Fee:</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{amount} {asset?.symbol}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSend}
            disabled={!recipient || !amount || isConfirming || parseFloat(amount) > maxBalance}
            className="w-full"
            size="lg"
          >
            {isConfirming ? "Sending..." : `Send ${asset?.symbol}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendModal;