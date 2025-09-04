import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CommodityMeta } from '@/types/commodities';

interface CommoditySpecsProps {
  meta: CommodityMeta;
}

const CommoditySpecs = ({ meta }: CommoditySpecsProps) => {
  const SpecRow = ({
    label,
    value,
    tooltip,
  }: {
    label: string;
    value: string | number;
    tooltip?: string;
  }) => {
    const content = (
      <div className='flex justify-between items-center py-3 border-b border-gray-800 last:border-b-0'>
        <span className='text-gray-400 text-sm'>{label}</span>
        <span className='text-white text-sm font-medium'>{value}</span>
      </div>
    );

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <div className='space-y-6 text-white p-4'>
      {/* Core Identity */}
      <div>
        <h4 className='text-gray-300 text-lg font-semibold mb-4 flex items-center'>
          Identity
        </h4>
        <div className='space-y-0'>
          <SpecRow label='Name' value={meta.displayName} />
          <SpecRow label='Symbol' value={meta.symbol} />
          <SpecRow label='Category' value={meta.category} />
          <SpecRow label='Common Units' value={meta.commonUnits.join(', ')} />
          <SpecRow label='Purity Grades' value={meta.purityGrades.join(', ')} />
          <SpecRow
            label='Available Forms'
            value={meta.availableForms.join(', ')}
          />
          <SpecRow
            label='Minimum Order'
            value={`${meta.minOrder.value} ${meta.minOrder.unit}`}
            tooltip='Minimum order quantity for retail purchases'
          />
          <SpecRow
            label='Bulk Minimum'
            value={`${meta.minBulkOrder.value} ${meta.minBulkOrder.unit}`}
            tooltip='Minimum order for bulk/institutional purchases'
          />
        </div>
      </div>

      {/* Market Data */}
      <div>
        <h4 className='text-gray-300 text-lg font-semibold mb-4'>Market</h4>
        <div className='space-y-0'>
          <SpecRow
            label='Price Feed'
            value={`${meta.referencePriceFeed.vendor}: ${meta.referencePriceFeed.code}`}
          />
          <SpecRow label='Quote Currency' value={meta.quoteCurrency} />
          <SpecRow
            label='Volatility Class'
            value={meta.volatilityClass}
            tooltip='Based on 30-day ATR relative to price'
          />
        </div>
      </div>

      {/* Fulfillment */}
      <div>
        <h4 className='text-gray-300 text-lg font-semibold mb-4'>
          Fulfillment
        </h4>
        <div className='space-y-0'>
          <SpecRow
            label='Domestic Delivery'
            value={meta.deliverySLA.domestic}
          />
          <SpecRow
            label='International Delivery'
            value={meta.deliverySLA.international}
          />
          <SpecRow label='Carriers' value={meta.carriers.join(', ')} />
          <SpecRow label='Custody Model' value={meta.custodyModel} />
          <SpecRow label='Assay Policy' value={meta.assayPolicy} />
          <SpecRow
            label='Insurance'
            value={meta.insuranceIncluded ? 'Included' : 'Optional'}
          />
        </div>
      </div>

      {/* Pricing & Fees */}
      <div>
        <h4 className='text-gray-300 text-lg font-semibold mb-4'>Fees</h4>
        <div className='space-y-0'>
          <SpecRow label='Maker Fee' value={`${meta.makerFee}%`} />
          <SpecRow label='Taker Fee' value={`${meta.takerFee}%`} />
          <SpecRow
            label='Physical Spread'
            value={`${meta.physicalSpread.buyBps}/${meta.physicalSpread.sellBps} bps`}
            tooltip='Buy/Sell spread in basis points'
          />
          {meta.storageFees && (
            <SpecRow
              label='Storage Fee'
              value={`${meta.storageFees.pctPerYear}% per year`}
            />
          )}
        </div>
      </div>

      {/* Compliance */}
      <div>
        <h4 className='text-gray-300 text-lg font-semibold mb-4'>Compliance</h4>
        <div className='space-y-0'>
          <SpecRow
            label='Standards'
            value={meta.conformityStandards.join(', ')}
          />
          <SpecRow label='Audit Frequency' value={meta.auditFrequency} />
          <SpecRow
            label='Price Lock Window'
            value={`${meta.priceLockWindowMins} minutes`}
          />
        </div>
      </div>
    </div>
  );
};

export default CommoditySpecs;
