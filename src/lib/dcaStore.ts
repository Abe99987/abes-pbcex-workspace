// Shared DCA rules store for syncing between pages
export interface DCARule {
  id: string;
  amount: number;
  cadence: 'Day' | 'Month';
  asset: string;
  sourceAccount: 'Funding' | 'Trading';
  createdAt: Date;
}

const STORAGE_KEY = 'pbcex.dcaRules';

// Sample rules to start with
const DEFAULT_RULES: DCARule[] = [
  {
    id: '1',
    amount: 100,
    cadence: 'Month',
    asset: 'Gold',
    sourceAccount: 'Funding',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    amount: 50,
    cadence: 'Month', 
    asset: 'Silver',
    sourceAccount: 'Trading',
    createdAt: new Date('2024-02-01'),
  },
];

class DCAStore {
  private listeners: (() => void)[] = [];

  getRules(): DCARule[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const rules = JSON.parse(stored);
        return rules.map((rule: any) => ({
          ...rule,
          createdAt: new Date(rule.createdAt),
        }));
      }
      // Initialize with default rules if none exist
      this.setRules(DEFAULT_RULES);
      return DEFAULT_RULES;
    } catch {
      return DEFAULT_RULES;
    }
  }

  setRules(rules: DCARule[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save DCA rules:', error);
    }
  }

  addRule(rule: Omit<DCARule, 'id'>): void {
    const rules = this.getRules();
    const newRule: DCARule = {
      ...rule,
      id: Date.now().toString(),
    };
    this.setRules([...rules, newRule]);
  }

  deleteRule(id: string): void {
    const rules = this.getRules();
    this.setRules(rules.filter(rule => rule.id !== id));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const dcaStore = new DCAStore();