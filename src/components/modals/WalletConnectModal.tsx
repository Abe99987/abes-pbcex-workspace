import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WalletConnectModal = ({
  open,
  onOpenChange,
}: WalletConnectModalProps) => {
  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect to your MetaMask wallet',
      popular: true,
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect to your Coinbase wallet',
      popular: true,
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect to any WalletConnect compatible wallet',
      popular: false,
    },
    {
      id: 'ledger',
      name: 'Ledger',
      description: 'Connect to your Ledger hardware wallet',
      popular: false,
    },
    {
      id: 'trezor',
      name: 'Trezor',
      description: 'Connect to your Trezor hardware wallet',
      popular: false,
    },
    {
      id: 'phantom',
      name: 'Phantom',
      description: 'Connect to your Phantom wallet (Solana)',
      popular: false,
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      description: 'Connect to your Trust Wallet',
      popular: false,
    },
  ];

  const handleWalletClick = (walletId: string) => {
    // Here you would implement the wallet connection logic
    console.log('Selected wallet:', walletId);
    // For now, just close the modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md bg-background border-border'>
        <DialogHeader>
          <DialogTitle className='text-foreground'>Connect Wallet</DialogTitle>
          <DialogDescription className='text-muted-foreground'>
            Choose a wallet to connect to your account
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 mt-6'>
          {wallets.map(wallet => (
            <Button
              key={wallet.id}
              variant='outline'
              className='w-full h-auto p-4 flex items-center justify-between hover:bg-accent group'
              onClick={() => handleWalletClick(wallet.id)}
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center'>
                  <div className='w-6 h-6 rounded bg-primary/20'></div>
                </div>
                <div className='text-left'>
                  <div className='font-medium text-foreground flex items-center gap-2'>
                    {wallet.name}
                    {wallet.popular && (
                      <Badge variant='secondary' className='text-xs'>
                        Popular
                      </Badge>
                    )}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {wallet.description}
                  </div>
                </div>
              </div>
              <ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors' />
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectModal;
