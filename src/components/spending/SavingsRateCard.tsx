import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SavingsRateCardProps {
  currentRate: number; // 0-1 (e.g., 0.15 = 15%)
  totalSpend: number;
  totalIncome: number;
  targetRate?: number; // 0.15, 0.20, 0.25
}

const SavingsRateCard = ({ 
  currentRate, 
  totalSpend, 
  totalIncome, 
  targetRate = 0.15 
}: SavingsRateCardProps) => {
  const navigate = useNavigate();
  
  const savingsTargets = [
    { rate: 0.15, label: 'Secure', color: '#F39C12' },
    { rate: 0.20, label: 'Strong', color: '#3498DB' },
    { rate: 0.25, label: 'Wealth Path', color: '#2ECC71' }
  ];
  
  const currentTarget = savingsTargets.find(t => t.rate === targetRate) || savingsTargets[0];
  const progressPercentage = Math.min((currentRate / targetRate) * 100, 100);
  
  const shortfall = totalSpend - (totalIncome * (1 - targetRate));
  const moveToAssetsAmount = Math.max(shortfall, 0);
  
  const getBadgeVariant = () => {
    if (currentRate >= 0.25) return 'default';
    if (currentRate >= 0.20) return 'secondary';
    if (currentRate >= 0.15) return 'outline';
    return 'destructive';
  };
  
  const getBadgeLabel = () => {
    if (currentRate >= 0.25) return 'Wealth Path';
    if (currentRate >= 0.20) return 'Strong';
    if (currentRate >= 0.15) return 'Secure';
    return 'Below Target';
  };

  const handleMoveToAssets = () => {
    // Navigate to existing Buy flow with prefilled amount
    navigate(`/trading?action=buy&amount=${moveToAssetsAmount.toFixed(0)}`);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Savings Rate</span>
          </CardTitle>
          <Badge variant={getBadgeVariant()} className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>{getBadgeLabel()}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Rate Display */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">
            {(currentRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">
            Current Savings Rate
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to {currentTarget.label}</span>
            <span>{(currentRate * 100).toFixed(1)}% / {(targetRate * 100)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
            style={{ 
              '--progress-background': currentTarget.color 
            } as React.CSSProperties}
          />
        </div>
        
        {/* Target Selection */}
        <div className="flex space-x-2">
          {savingsTargets.map((target) => (
            <Button
              key={target.rate}
              variant={targetRate === target.rate ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              style={{
                backgroundColor: targetRate === target.rate ? target.color : 'transparent',
                borderColor: target.color
              }}
            >
              {target.label} ({(target.rate * 100)}%)
            </Button>
          ))}
        </div>
        
        {/* 50/30/20 Reference */}
        <div className="text-xs text-muted-foreground text-center py-2 border-t">
          Reference: 50% Needs / 30% Wants / 20% Savings
        </div>
        
        {/* Action Button */}
        {moveToAssetsAmount > 0 && (
          <div className="bg-accent/20 rounded-lg p-3 space-y-2">
            <div className="text-sm text-muted-foreground">
              Cut <span className="font-semibold text-destructive">
                ${moveToAssetsAmount.toLocaleString()}
              </span> in spending to hit {(targetRate * 100)}% goal
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleMoveToAssets}
            >
              Move ${moveToAssetsAmount.toFixed(0)} to Assets
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
        
        {currentRate >= targetRate && (
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <div className="text-sm text-primary font-medium">
              🎉 You're exceeding your savings goal!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavingsRateCard;