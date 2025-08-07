import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, Lock, User } from "lucide-react";
import Navigation from "@/components/Navigation";

const TitledAsset = () => {
  const { address } = useParams();
  const navigate = useNavigate();

  // Mock data for the asset - in a real app this would come from an API
  const assetData = {
    address: "1987 Future Drive, Pittsburgh, PA",
    equity: 227436,
    homeValue: 328500,
    paymentsRemaining: 32000,
    principalPayments: 18,
    principalPaymentAmount: 3420,
    maintenancePayments: 18,
    maintenancePaymentAmount: 1200,
    paidOffPercentage: 71,
    payoffAmount: 52000,
    paymentsLeftToUnfreeze: 3
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Titled Asset Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Home className="w-6 h-6" />
              <div>
                <span className="text-lg font-medium">Titled Asset — </span>
                <span className="text-lg">{assetData.address}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-8 h-8 p-1 rounded-full bg-primary-foreground/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Left Column - Financial Details */}
              <div className="space-y-8">
                {/* Your Equity */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Your Equity</h2>
                  <p className="text-4xl font-bold text-foreground">
                    ${assetData.equity.toLocaleString()}
                  </p>
                </div>

                {/* Home Value */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Home Value</h3>
                  <p className="text-3xl font-bold text-foreground">
                    ${assetData.homeValue.toLocaleString()}
                  </p>
                </div>

                {/* Payments Remaining */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Payments Remaining</h3>
                  <p className="text-3xl font-bold text-foreground">
                    ${assetData.paymentsRemaining.toLocaleString()}
                  </p>
                </div>

                {/* Principal vs Maintenance Section */}
                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">=</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Principal vs Maintenance</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <span className="text-3xl font-bold text-foreground">{assetData.principalPayments}</span>
                      <p className="text-sm text-muted-foreground">payments remaining</p>
                      <p className="text-lg font-semibold text-foreground">${assetData.principalPaymentAmount.toLocaleString()} each</p>
                      <p className="text-xs text-muted-foreground mt-1">Principal Payments Remaining</p>
                    </div>
                    
                    <div>
                      <span className="text-3xl font-bold text-foreground">{assetData.maintenancePayments}</span>
                      <p className="text-sm text-muted-foreground">payments remaining</p>
                      <p className="text-lg font-semibold text-foreground">${assetData.maintenancePaymentAmount.toLocaleString()} each</p>
                      <p className="text-xs text-muted-foreground mt-1">Maintenance Payments Remaining</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Speedometer and Payoff Info */}
              <div className="flex flex-col items-center justify-center space-y-8">
                
                {/* Speedometer Chart */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                  {/* Outer circle */}
                  <div className="absolute inset-0 rounded-full border-8 border-muted"></div>
                  
                  {/* Progress circle */}
                  <div className="absolute inset-4">
                    <div className="relative w-full h-full">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="hsl(var(--muted))"
                          strokeWidth="8"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="hsl(var(--gold))"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 50 * (assetData.paidOffPercentage / 100)} ${2 * Math.PI * 50}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Center content */}
                  <div className="text-center z-10">
                    <div className="text-6xl font-bold text-foreground">{assetData.paidOffPercentage}%</div>
                    <div className="text-xl font-semibold text-foreground mt-2">Paid Off</div>
                  </div>
                </div>

                {/* Payoff Information */}
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Lock className="w-6 h-6 text-gold" />
                    <span className="text-lg font-semibold text-foreground">Payoff Now</span>
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      ${assetData.payoffAmount.toLocaleString()} to own the title
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-4xl font-bold text-foreground">{assetData.paymentsLeftToUnfreeze}</span>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">3 Payments Left</p>
                      <p className="text-sm text-muted-foreground">to Unfreeze Your Gold</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TitledAsset;