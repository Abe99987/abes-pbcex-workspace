import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Clock, Shield, Building } from 'lucide-react';
import { Branch } from '@/types/branch';

interface BranchLocatorProps {
  onSelectBranch: (branch: Branch) => void;
  selectedBranch: Branch | null;
}

const BranchLocator = ({
  onSelectBranch,
  selectedBranch,
}: BranchLocatorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock branch data
  const branches: Branch[] = [
    {
      id: 'nyc-001',
      name: 'PBCex Manhattan Vault',
      address: '150 Broadway, Suite 1801',
      city: 'New York',
      state: 'NY',
      zip: '10038',
      phone: '(212) 555-0123',
      hours: 'Mon-Fri 9AM-6PM',
      vaultSize: '50,000 oz capacity',
      spread: '0.5% above spot',
      distance: '0.2 miles',
    },
    {
      id: 'nyc-002',
      name: 'PBCex Financial District',
      address: '40 Wall Street, Floor 52',
      city: 'New York',
      state: 'NY',
      zip: '10005',
      phone: '(212) 555-0456',
      hours: 'Mon-Fri 8AM-7PM, Sat 10AM-4PM',
      vaultSize: '75,000 oz capacity',
      spread: '0.3% above spot',
      distance: '0.8 miles',
    },
    {
      id: 'nj-001',
      name: 'PBCex Jersey City',
      address: '101 Hudson Street, Suite 2100',
      city: 'Jersey City',
      state: 'NJ',
      zip: '07302',
      phone: '(201) 555-0789',
      hours: 'Mon-Fri 9AM-5PM',
      vaultSize: '25,000 oz capacity',
      spread: '0.7% above spot',
      distance: '3.2 miles',
    },
  ];

  const filteredBranches = branches.filter(
    branch =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.zip.includes(searchTerm)
  );

  return (
    <div className='space-y-4'>
      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search by ZIP, city, or branch name...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Mock Map */}
      <Card className='h-48 bg-muted flex items-center justify-center'>
        <div className='text-center text-muted-foreground'>
          <MapPin className='w-8 h-8 mx-auto mb-2' />
          <div className='text-sm'>Interactive Map</div>
          <div className='text-xs'>
            Showing {filteredBranches.length} branches near you
          </div>
        </div>
      </Card>

      {/* Branch List */}
      <div className='space-y-3 max-h-64 overflow-y-auto'>
        {filteredBranches.map(branch => (
          <Card
            key={branch.id}
            className={`cursor-pointer transition-all ${
              selectedBranch?.id === branch.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:shadow-md'
            }`}
            onClick={() => onSelectBranch(branch)}
          >
            <CardContent className='p-4'>
              <div className='flex justify-between items-start mb-2'>
                <div>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <Building className='w-4 h-4' />
                    {branch.name}
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    {branch.address}
                    <br />
                    {branch.city}, {branch.state} {branch.zip}
                  </p>
                </div>
                <Badge variant='outline' className='text-xs'>
                  {branch.distance}
                </Badge>
              </div>

              <div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3'>
                <div className='flex items-center gap-1'>
                  <Clock className='w-3 h-3' />
                  {branch.hours}
                </div>
                <div className='flex items-center gap-1'>
                  <Shield className='w-3 h-3' />
                  {branch.vaultSize}
                </div>
              </div>

              <div className='flex justify-between items-center'>
                <div className='text-xs'>
                  <span className='text-muted-foreground'>Spread: </span>
                  <span className='font-medium text-green-600'>
                    {branch.spread}
                  </span>
                </div>
                <Button
                  size='sm'
                  variant={
                    selectedBranch?.id === branch.id ? 'default' : 'outline'
                  }
                  onClick={e => {
                    e.stopPropagation();
                    onSelectBranch(branch);
                  }}
                >
                  {selectedBranch?.id === branch.id ? 'Selected' : 'Select'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBranches.length === 0 && (
        <div className='text-center py-8 text-muted-foreground'>
          <MapPin className='w-8 h-8 mx-auto mb-2 opacity-50' />
          <div>No branches found</div>
          <div className='text-sm'>Try a different search term</div>
        </div>
      )}
    </div>
  );
};

export default BranchLocator;
