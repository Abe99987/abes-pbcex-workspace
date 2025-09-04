import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORIES, SpendStat } from '@/hooks/useSpendingData';

interface CategorySummaryListProps {
  data: SpendStat[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

const CategorySummaryList = ({
  data,
  selectedCategory,
  onCategorySelect,
}: CategorySummaryListProps) => {
  const sortedData = data.sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardContent className='p-4'>
        <h3 className='text-lg font-semibold text-foreground mb-4'>
          Category Summary
        </h3>
        <div className='space-y-2 max-h-96 overflow-y-auto'>
          {sortedData.map(stat => {
            const category = CATEGORIES.find(c => c.id === stat.categoryId);
            const isSelected = selectedCategory === stat.categoryId;

            return (
              <Button
                key={stat.categoryId}
                variant='ghost'
                className={`w-full justify-between p-3 h-auto ${
                  isSelected
                    ? 'bg-accent border-2 border-primary'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() =>
                  onCategorySelect(isSelected ? null : stat.categoryId)
                }
              >
                <div className='flex items-center space-x-3'>
                  <div
                    className='w-4 h-4 rounded-full flex-shrink-0'
                    style={{ backgroundColor: category?.color || '#95A5A6' }}
                  />
                  <div className='flex items-center space-x-2'>
                    <span className='text-lg'>{category?.icon}</span>
                    <span className='font-medium text-left'>
                      {category?.name}
                    </span>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-semibold'>
                    $
                    {stat.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {stat.pct.toFixed(1)}%
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategorySummaryList;
