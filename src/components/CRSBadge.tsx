import { Badge } from '@/components/ui/badge';
import { Crown, Star, Shield, AlertTriangle } from 'lucide-react';

interface CRSBadgeProps {
  tier: number;
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

const CRSBadge = ({
  tier,
  score,
  size = 'md',
  showScore = true,
}: CRSBadgeProps) => {
  const getTierColor = (tier: number) => {
    switch (tier) {
      case 5:
        return 'bg-purple-600 text-white hover:bg-purple-700';
      case 4:
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 3:
        return 'bg-green-600 text-white hover:bg-green-700';
      case 2:
        return 'bg-yellow-600 text-white hover:bg-yellow-700';
      case 1:
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-gray-600 text-white hover:bg-gray-700';
    }
  };

  const getTierIcon = (tier: number) => {
    if (tier >= 5) return <Crown className='h-3 w-3' />;
    if (tier >= 4) return <Star className='h-3 w-3' />;
    if (tier >= 3) return <Shield className='h-3 w-3' />;
    return <AlertTriangle className='h-3 w-3' />;
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-sm px-3 py-2';
      default:
        return 'text-xs px-2 py-1';
    }
  };

  return (
    <Badge
      className={`${getTierColor(tier)} ${getSizeClasses(size)} flex items-center space-x-1 cursor-pointer transition-colors`}
      title={`Customer Ranking System - Tier ${tier} (Score: ${score}/100)`}
    >
      {getTierIcon(tier)}
      <span>T{tier}</span>
      {showScore && <span>({score})</span>}
    </Badge>
  );
};

export default CRSBadge;
