import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Building, 
  DollarSign, 
  Tag,
  Repeat,
  History,
  Settings,
  Split,
  FileText
} from 'lucide-react';
import { Transaction, CATEGORIES } from '@/hooks/useSpendingData';

interface TransactionDrawerProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory: (id: string, categoryId: string) => void;
  onCreateRule: (transaction: Transaction) => void;
}

const TransactionDrawer = ({ 
  transaction, 
  isOpen, 
  onClose, 
  onUpdateCategory,
  onCreateRule 
}: TransactionDrawerProps) => {
  const [selectedCategory, setSelectedCategory] = useState(transaction?.categoryId || '');
  const [tags, setTags] = useState((transaction?.tags || []).join(', '));
  const [memo, setMemo] = useState(transaction?.memo || '');
  const [isRecurring, setIsRecurring] = useState(transaction?.isRecurring || false);
  const [note, setNote] = useState('');

  if (!transaction) return null;

  const category = CATEGORIES.find(c => c.id === transaction.categoryId);
  
  const handleSave = () => {
    if (selectedCategory && selectedCategory !== transaction.categoryId) {
      onUpdateCategory(transaction.id, selectedCategory);
    }
    // Save other changes...
    onClose();
  };

  const handleCreateRule = () => {
    onCreateRule(transaction);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Transaction Details</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Transaction Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{category?.icon || '💳'}</div>
                <div>
                  <h3 className="font-semibold text-lg">{transaction.merchant}</h3>
                  <p className="text-sm text-muted-foreground flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  transaction.amount < 0 ? 'text-destructive' : 'text-primary'
                }`}>
                  {transaction.amount < 0 ? '-' : '+'}$
                  {Math.abs(transaction.amount).toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {transaction.currency}
                </div>
              </div>
            </div>
            
            {transaction.isRecurring && (
              <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
                <Repeat className="w-3 h-3" />
                <span>Recurring</span>
              </Badge>
            )}
          </div>

          <Separator />

          {/* Edit Category */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span>Category</span>
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center space-x-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tags</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
          </div>

          {/* Memo */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Memo</Label>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Transaction memo"
            />
          </div>

          {/* Account */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span>Account</span>
            </Label>
            <Input
              value={transaction.accountName || 'Main Account'}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Note */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this transaction"
              rows={3}
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <h4 className="font-semibold">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={handleCreateRule}>
                <Settings className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
              <Button variant="outline" size="sm">
                <Split className="w-4 h-4 mr-2" />
                Split Transaction
              </Button>
              <Button variant="outline" size="sm">
                <Repeat className="w-4 h-4 mr-2" />
                Mark Recurring
              </Button>
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                Merchant History
              </Button>
            </div>
          </div>

          {/* Auto-categorization info */}
          {transaction.confidence !== undefined && transaction.confidence < 0.8 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Low Confidence:</strong> This transaction was auto-categorized with 
                {' '}{(transaction.confidence * 100).toFixed(0)}% confidence. Please verify the category.
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionDrawer;