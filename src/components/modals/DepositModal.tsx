import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Building2, 
  DollarSign, 
  Landmark,
  Zap,
  ArrowRight
} from "lucide-react";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DepositModal = ({ open, onOpenChange }: DepositModalProps) => {
  const depositMethods = [
    {
      id: "direct-deposit",
      title: "Set Up Direct Deposit",
      description: "Connect your employer for automatic deposits",
      icon: Building2,
      comingSoon: false,
    },
    {
      id: "plaid",
      title: "Connect via Plaid",
      description: "Instantly connect your bank account",
      icon: Zap,
      comingSoon: false,
    },
    {
      id: "bank-transfer",
      title: "Bank Transfer (ACH / Wire)",
      description: "Transfer from your bank account",
      icon: Landmark,
      comingSoon: false,
    },
    {
      id: "debit-card",
      title: "Set Up Debit Card",
      description: "Add your debit card for instant deposits",
      icon: CreditCard,
      comingSoon: false,
    },
    {
      id: "paypal",
      title: "Deposit via PayPal",
      description: "Use your PayPal balance (selected regions)",
      icon: DollarSign,
      comingSoon: true,
    },
  ];

  const handleMethodClick = (methodId: string) => {
    // Here you would implement the specific flow for each method
    console.log("Selected deposit method:", methodId);
    // For now, just close the modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Funds</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how you'd like to deposit money to your account
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-6">
          {depositMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <Button
                key={method.id}
                variant="outline"
                className="w-full h-auto p-4 flex items-center justify-between hover:bg-accent group"
                onClick={() => handleMethodClick(method.id)}
                disabled={method.comingSoon}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">
                      {method.title}
                      {method.comingSoon && (
                        <span className="ml-2 text-xs text-muted-foreground">Coming Soon</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {method.description}
                    </div>
                  </div>
                </div>
                {!method.comingSoon && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;