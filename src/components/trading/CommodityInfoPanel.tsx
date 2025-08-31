import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import CommoditySpecs from '@/components/shop/CommoditySpecs';
import CommodityTradeInfo from '@/components/shop/CommodityTradeInfo';
import { useCommodityMeta } from '@/hooks/useCommodityMeta';

interface CommodityInfoPanelProps {
  symbol: string;
}

const CommodityInfoPanel = ({ symbol }: CommodityInfoPanelProps) => {
  const meta = useCommodityMeta(symbol);

  if (!meta) {
    return (
      <div className='p-4 text-center text-gray-400'>
        <p>Commodity information not available for {symbol}</p>
      </div>
    );
  }

  return (
    <div className='h-full bg-black'>
      <Tabs defaultValue='specs' className='h-full'>
        <TabsList className='grid w-full grid-cols-2 bg-gray-900 border-b border-gray-800'>
          <TabsTrigger value='specs' className='text-xs'>
            Commodity Specs
          </TabsTrigger>
          <TabsTrigger value='trade-info' className='text-xs'>
            Trade Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value='specs' className='h-full mt-0'>
          <div className='h-full overflow-y-auto'>
            <CommoditySpecs meta={meta} />
          </div>
        </TabsContent>

        <TabsContent value='trade-info' className='h-full mt-0'>
          <div className='h-full overflow-y-auto'>
            <CommodityTradeInfo meta={meta} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommodityInfoPanel;
