import { useState, useEffect } from 'react';
import { dcaStore, DCARule } from '@/lib/dcaStore';

export const useDCAStore = () => {
  const [rules, setRules] = useState<DCARule[]>([]);

  useEffect(() => {
    setRules(dcaStore.getRules());
    
    const unsubscribe = dcaStore.subscribe(() => {
      setRules(dcaStore.getRules());
    });

    return unsubscribe;
  }, []);

  const addRule = (rule: Omit<DCARule, 'id'>) => {
    dcaStore.addRule(rule);
  };

  const deleteRule = (id: string) => {
    dcaStore.deleteRule(id);
  };

  return {
    rules,
    addRule,
    deleteRule,
  };
};