import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORIES, SpendStat } from '@/hooks/useSpendingData';

interface SpendingDonutProps {
  data: SpendStat[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  totalSpend: number;
}

interface ChartDataItem {
  name: string;
  value: number;
  categoryId: string;
  color: string;
  pct: number;
}

interface TooltipPayload {
  payload: ChartDataItem;
}

const SpendingDonut = ({
  data,
  selectedCategory,
  onCategorySelect,
  totalSpend,
}: SpendingDonutProps) => {
  const chartData: ChartDataItem[] = data
    .map(stat => {
      const category = CATEGORIES.find(c => c.id === stat.categoryId);
      return {
        name: category?.name || 'Unknown',
        value: stat.total,
        categoryId: stat.categoryId,
        color: category?.color || '#95A5A6',
        pct: stat.pct,
      };
    })
    .filter(item => item.value > 0);

  const handleClick = (data: ChartDataItem | null) => {
    if (data && data.categoryId) {
      onCategorySelect(
        selectedCategory === data.categoryId ? null : data.categoryId
      );
    }
  };

  return (
    <div className='w-full h-80 relative'>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={chartData}
            cx='50%'
            cy='50%'
            innerRadius={80}
            outerRadius={140}
            paddingAngle={2}
            dataKey='value'
            onClick={handleClick}
            className='cursor-pointer'
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={
                  selectedCategory === null ||
                  selectedCategory === entry.categoryId
                    ? 1
                    : 0.3
                }
                stroke={selectedCategory === entry.categoryId ? '#000' : 'none'}
                strokeWidth={selectedCategory === entry.categoryId ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: TooltipPayload) => [
              `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              name,
            ]}
            labelFormatter={(name: string, payload: TooltipPayload[]) => {
              if (payload && payload[0]) {
                return `${name} (${payload[0].payload.pct.toFixed(1)}%)`;
              }
              return name;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Value Display */}
      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none'>
        <div className='text-sm text-muted-foreground'>Total Spent</div>
        <div className='text-2xl font-bold text-primary'>
          ${(totalSpend / 1000).toFixed(1)}K
        </div>
        <div className='text-xs text-muted-foreground'>This Month</div>
      </div>
    </div>
  );
};

export default SpendingDonut;
