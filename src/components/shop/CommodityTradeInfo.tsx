import { Badge } from '@/components/ui/badge';
import { CommodityMeta } from '@/types/commodities';

interface CommodityTradeInfoProps {
  meta: CommodityMeta;
}

const CommodityTradeInfo = ({ meta }: CommodityTradeInfoProps) => {
  return (
    <div className='space-y-6 text-white p-4'>
      {/* Settlement Options */}
      <div>
        <h4 className='text-gray-300 text-lg font-semibold mb-4'>Settlement</h4>
        <div className='space-y-3'>
          <div>
            <span className='text-gray-400 text-sm block mb-2'>
              Accepted Tender
            </span>
            <div className='flex flex-wrap gap-2'>
              {meta.acceptedTender.map(tender => (
                <Badge key={tender} variant='outline' className='text-xs'>
                  {tender}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className='text-gray-400 text-sm block mb-2'>
              Order Types
            </span>
            <div className='flex flex-wrap gap-2'>
              {meta.supportedOrderTypes.map(type => (
                <Badge key={type} variant='secondary' className='text-xs'>
                  {type}
                </Badge>
              ))}
            </div>
          </div>
          {meta.barterRules.allow && (
            <div>
              <span className='text-gray-400 text-sm block mb-1'>
                Barter Orders
              </span>
              <p className='text-xs text-gray-300'>{meta.barterRules.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Risk & Hedging */}
      <div>
        <h4 className='text-gray-300 text-lg font-semibold mb-4'>
          Risk Management
        </h4>
        <div className='space-y-3'>
          <div>
            <span className='text-gray-400 text-sm block mb-1'>
              Hedge Methods
            </span>
            <p className='text-xs text-gray-300'>
              {meta.hedgeMethod.join(', ')}
            </p>
          </div>
          <div>
            <span className='text-gray-400 text-sm block mb-1'>
              Hedge Latency
            </span>
            <p className='text-xs text-gray-300'>{meta.hedgeLatencyTarget}</p>
          </div>
          <div>
            <span className='text-gray-400 text-sm block mb-1'>
              Inventory Policy
            </span>
            <p className='text-xs text-gray-300'>{meta.inventoryPolicy}</p>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-gray-400 text-sm'>
              Provider Co-Market Making
            </span>
            <Badge
              variant={meta.providerCoMM ? 'default' : 'secondary'}
              className='text-xs'
            >
              {meta.providerCoMM ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Shipping & Logistics */}
      <div>
        <h4 className='text-gray-300 text-lg font-semibold mb-4'>Logistics</h4>
        <div className='space-y-3'>
          <div>
            <span className='text-gray-400 text-sm block mb-2'>
              Shipping Options
            </span>
            <div className='flex flex-wrap gap-2'>
              {meta.shippingOptions.map(option => (
                <Badge key={option} variant='outline' className='text-xs'>
                  {option}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className='text-gray-400 text-sm block mb-1'>Warehouses</span>
            {meta.vaultsOrWarehouses.map((location, index) => (
              <p key={index} className='text-xs text-gray-300'>
                {location.name} ({location.city}, {location.country})
              </p>
            ))}
          </div>
          <div>
            <span className='text-gray-400 text-sm block mb-1'>Redemption</span>
            <p className='text-xs text-gray-300'>{meta.redemption}</p>
          </div>
        </div>
      </div>

      {/* Disclosures */}
      {meta.disclosures.length > 0 && (
        <div>
          <h4 className='text-gray-300 text-lg font-semibold mb-4'>
            Disclosures
          </h4>
          <div className='space-y-2'>
            {meta.disclosures.map((disclosure, index) => (
              <p key={index} className='text-xs text-gray-400 italic'>
                {disclosure}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommodityTradeInfo;
