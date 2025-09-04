type DemandRecord = {
  city: string;
  country: string;
  weight: number;
  source: 'vote' | 'franchise';
  email?: string;
  timestamp: number;
};

type AggregatedDemand = {
  city: string;
  country: string;
  votes: number;
  sources: {
    vote: number;
    franchise: number;
  };
};

class FranchiseDemandStore {
  private records: DemandRecord[] = [];
  private listeners: (() => void)[] = [];
  private sessionVotes = new Set<string>(); // email+city+country for deduplication

  // Subscribe to changes
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Add a new record
  addRecord(record: Omit<DemandRecord, 'timestamp'>) {
    // Check for duplicates in session
    if (record.email) {
      const key = `${record.email}-${record.city}-${record.country}`;
      if (this.sessionVotes.has(key)) {
        return {
          success: false,
          message: 'Vote already counted for this location.',
        };
      }
      this.sessionVotes.add(key);
    }

    this.records.push({
      ...record,
      timestamp: Date.now(),
    });
    this.notify();
    return { success: true };
  }

  // Get aggregated data
  getAgg(): AggregatedDemand[] {
    const grouped = new Map<string, AggregatedDemand>();

    this.records.forEach(record => {
      const key = `${record.city}-${record.country}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          city: record.city,
          country: record.country,
          votes: 0,
          sources: { vote: 0, franchise: 0 },
        });
      }

      const entry = grouped.get(key)!;
      entry.votes += record.weight;
      entry.sources[record.source] += record.weight;
    });

    return Array.from(grouped.values()).sort((a, b) => b.votes - a.votes);
  }

  // Get all records
  getRecords() {
    return [...this.records];
  }

  // Seed demo data
  seedDemoData() {
    if (this.records.length > 0) return; // Only seed once

    const demoData = [
      {
        city: 'Lagos',
        country: 'Nigeria',
        weight: 42,
        source: 'vote' as const,
      },
      { city: 'Mumbai', country: 'India', weight: 26, source: 'vote' as const },
      {
        city: 'Mumbai',
        country: 'India',
        weight: 5,
        source: 'franchise' as const,
      },
      {
        city: 'Dubai',
        country: 'United Arab Emirates',
        weight: 18,
        source: 'vote' as const,
      },
      {
        city: 'Pittsburgh',
        country: 'United States',
        weight: 12,
        source: 'vote' as const,
      },
      {
        city: 'Austin',
        country: 'United States',
        weight: 9,
        source: 'vote' as const,
      },
      {
        city: 'London',
        country: 'United Kingdom',
        weight: 14,
        source: 'vote' as const,
      },
      {
        city: 'Singapore',
        country: 'Singapore',
        weight: 11,
        source: 'vote' as const,
      },
      {
        city: 'Toronto',
        country: 'Canada',
        weight: 8,
        source: 'vote' as const,
      },
      {
        city: 'São Paulo',
        country: 'Brazil',
        weight: 15,
        source: 'vote' as const,
      },
      { city: 'Tokyo', country: 'Japan', weight: 13, source: 'vote' as const },
      {
        city: 'Sydney',
        country: 'Australia',
        weight: 7,
        source: 'vote' as const,
      },
      {
        city: 'Frankfurt',
        country: 'Germany',
        weight: 10,
        source: 'vote' as const,
      },
      {
        city: 'Hong Kong',
        country: 'Hong Kong',
        weight: 16,
        source: 'vote' as const,
      },
      {
        city: 'Riyadh',
        country: 'Saudi Arabia',
        weight: 6,
        source: 'vote' as const,
      },
    ];

    demoData.forEach(data => {
      this.records.push({
        ...data,
        timestamp: Date.now() - Math.random() * 86400000 * 7, // Random timestamp within last week
      });
    });

    this.notify();
  }

  // Clear all data
  clear() {
    this.records = [];
    this.sessionVotes.clear();
    this.notify();
  }

  // Get unique countries
  getCountries() {
    const countries = new Set(this.records.map(r => r.country));
    return Array.from(countries).sort();
  }

  // Get today's stats
  getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecords = this.records.filter(
      r => r.timestamp >= today.getTime()
    );

    const todayAgg = new Map<
      string,
      { city: string; country: string; votes: number }
    >();
    todayRecords.forEach(record => {
      const key = `${record.city}-${record.country}`;
      if (!todayAgg.has(key)) {
        todayAgg.set(key, {
          city: record.city,
          country: record.country,
          votes: 0,
        });
      }
      todayAgg.get(key)!.votes += record.weight;
    });

    const todayCities = Array.from(todayAgg.values()).sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.city.localeCompare(b.city); // Alphabetical tie-breaker
    });

    return {
      totalVotes: todayRecords.reduce((sum, r) => sum + r.weight, 0),
      topCity: todayCities[0] || null,
    };
  }
}

// Create and export singleton instance
export const franchiseDemandStore = new FranchiseDemandStore();
