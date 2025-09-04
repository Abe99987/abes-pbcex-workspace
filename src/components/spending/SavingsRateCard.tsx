import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
  targetRate = 0.15,
}: SavingsRateCardProps) => {
  const navigate = useNavigate();
  const [selectedAsset, setSelectedAsset] = useState('gold');

  const savingsTargets = [
    { rate: 0.15, label: 'Secure', color: '#F39C12' },
    { rate: 0.2, label: 'Strong', color: '#3498DB' },
    { rate: 0.25, label: 'Wealth Path', color: '#2ECC71' },
  ];

  const currentTarget =
    savingsTargets.find(t => t.rate === targetRate) || savingsTargets[0];
  const progressPercentage = Math.min((currentRate / targetRate) * 100, 100);

  // Compute savings surplus
  const computeSavingsSurplus = ({
    monthlyIncome,
    currentRate,
    targetRate,
    underBudget = 0,
  }: {
    monthlyIncome: number;
    currentRate: number;
    targetRate: number;
    underBudget?: number;
  }): number => {
    const raw = Math.max(0, currentRate - targetRate) * monthlyIncome;
    const pick = Math.max(raw, underBudget || 0);
    return Math.round(pick / 5) * 5; // round to $5
  };

  const surplus = computeSavingsSurplus({
    monthlyIncome: totalIncome,
    currentRate,
    targetRate,
  });

  const showCTA = currentRate >= targetRate && surplus >= 25;

  // Get tiered copy based on savings rate
  const getTieredCopy = () => {
    if (currentRate >= 0.25)
      return 'Excellent discipline. Put excess to work in metals or other assets.';
    if (currentRate >= 0.2)
      return "You're ahead. Convert surplus into diversified assets.";
    if (currentRate >= 0.15)
      return 'Great pace. Automate investing your surplus each month.';
    return '';
  };

  const getBadgeVariant = () => {
    if (currentRate >= 0.25) return 'default';
    if (currentRate >= 0.2) return 'secondary';
    if (currentRate >= 0.15) return 'outline';
    return 'destructive';
  };

  const getBadgeLabel = () => {
    if (currentRate >= 0.25) return 'Wealth Path';
    if (currentRate >= 0.2) return 'Strong';
    if (currentRate >= 0.15) return 'Secure';
    return 'Below Target';
  };

  const handleConvertToAssets = () => {
    // Deep link to Buy flow with asset selection and amount
    navigate(
      `/trading?action=buy&asset=${selectedAsset}&amount=${surplus}&source=my-spending-savings-nudge`
    );
  };

  const shortfall = totalSpend - totalIncome * (1 - targetRate);
  const moveToAssetsAmount = Math.max(shortfall, 0);

  return (
    <Card className='relative overflow-hidden'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg flex items-center space-x-2'>
            <Target className='w-5 h-5' />
            <span>Savings Rate</span>
          </CardTitle>
          <Badge
            variant={getBadgeVariant()}
            className='flex items-center space-x-1'
          >
            <TrendingUp className='w-3 h-3' />
            <span>{getBadgeLabel()}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Current Rate Display */}
        <div className='text-center'>
          <div className='text-3xl font-bold text-primary'>
            {(currentRate * 100).toFixed(1)}%
          </div>
          <div className='text-sm text-muted-foreground'>
            Current Savings Rate
          </div>
        </div>

        {/* Progress Bar */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span>Progress to {currentTarget.label}</span>
            <span>
              {(currentRate * 100).toFixed(1)}% / {targetRate * 100}%
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className='h-2'
            style={
              {
                '--progress-background': currentTarget.color,
              } as React.CSSProperties
            }
          />
        </div>

        {/* Target Selection */}
        <div className='flex space-x-2'>
          {savingsTargets.map(target => (
            <Button
              key={target.rate}
              variant={targetRate === target.rate ? 'default' : 'outline'}
              size='sm'
              className='flex-1 text-xs'
              style={{
                backgroundColor:
                  targetRate === target.rate ? target.color : 'transparent',
                borderColor: target.color,
              }}
            >
              {target.label} ({target.rate * 100}%)
            </Button>
          ))}
        </div>

        {/* 50/30/20 Reference */}
        <div className='text-xs text-muted-foreground text-center py-2 border-t'>
          Reference: 50% Needs / 30% Wants / 20% Savings
        </div>

        {/* Enhanced CTA for Surplus Conversion */}
        {showCTA && (
          <div className='bg-primary/10 rounded-lg p-4 space-y-3'>
            <div className='text-sm text-primary font-medium'>
              🎉 You're exceeding your {targetRate * 100}% goal!
            </div>
            <div className='text-xs text-muted-foreground'>
              {getTieredCopy()}
            </div>
            <div className='flex items-center space-x-2'>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger className='w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='gold'>Gold</SelectItem>
                  <SelectItem value='silver'>Silver</SelectItem>
                  <SelectItem value='platinum'>Platinum</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant='default'
                size='sm'
                className='flex-1'
                onClick={handleConvertToAssets}
              >
                Convert ${surplus} to{' '}
                {selectedAsset.charAt(0).toUpperCase() + selectedAsset.slice(1)}
                <ArrowRight className='w-4 h-4 ml-2' />
              </Button>
            </div>
          </div>
        )}

        {/* Shortfall Warning (when below target) */}
        {moveToAssetsAmount > 0 && !showCTA && (
          <div className='bg-accent/20 rounded-lg p-3 space-y-2'>
            <div className='text-sm text-muted-foreground'>
              Cut{' '}
              <span className='font-semibold text-destructive'>
                ${moveToAssetsAmount.toLocaleString()}
              </span>{' '}
              in spending to hit {targetRate * 100}% goal
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavingsRateCard;
