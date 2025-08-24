import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  MapPin, 
  Trophy, 
  Search, 
  Download, 
  Copy,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { franchiseDemandStore } from "@/stores/franchiseDemandStore";
import { useToast } from "@/hooks/use-toast";

const FranchiseDemandCounter = () => {
  const { toast } = useToast();
  const [data, setData] = useState(franchiseDemandStore.getAgg());
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("votes");
  const [countFranchiseAsFive, setCountFranchiseAsFive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Subscribe to store changes
  useEffect(() => {
    franchiseDemandStore.seedDemoData();
    
    const unsubscribe = franchiseDemandStore.subscribe(() => {
      setData(franchiseDemandStore.getAgg());
    });

    return unsubscribe;
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      const matchesSearch = 
        item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "all" || item.country === countryFilter;
      return matchesSearch && matchesCountry;
    });

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "votes":
          return b.votes - a.votes;
        case "city":
          return a.city.localeCompare(b.city);
        case "country":
          return a.country.localeCompare(b.country);
        default:
          return b.votes - a.votes;
      }
    });

    return filtered;
  }, [data, searchTerm, countryFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, countryFilter, sortBy]);

  // Calculate KPIs
  const totalVotes = data.reduce((sum, item) => sum + item.votes, 0);
  const uniqueCities = data.length;
  const todayStats = franchiseDemandStore.getTodayStats();
  const maxVotes = Math.max(...data.map(item => item.votes), 1);

  // Get unique countries for filter
  const countries = franchiseDemandStore.getCountries();

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["city", "country", "votes", "vote_count", "franchise_weight"];
    const csvData = data.map(item => [
      item.city,
      item.country,
      item.votes,
      item.sources.vote,
      item.sources.franchise
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "franchise-demand.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Franchise demand data exported to CSV.",
    });
  };

  // Copy JSON to clipboard
  const copyJSON = async () => {
    const jsonData = data.map(item => ({
      city: item.city,
      country: item.country,
      votes: item.votes,
      sources: item.sources
    }));

    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      toast({
        title: "Copied to Clipboard",
        description: "Franchise demand data copied as JSON.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  // Expose store methods globally for form integration
  useEffect(() => {
    (window as any).franchiseDemandStore = franchiseDemandStore;
    (window as any).countFranchiseAsFive = countFranchiseAsFive;
  }, [countFranchiseAsFive]);

  if (data.length === 0) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-border/50 rounded-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Franchise Demand (Live)</CardTitle>
                <CardDescription>
                  No votes yet — be the first to nominate your city.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-xl border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Franchise Demand (Live)
              </CardTitle>
              <CardDescription>
                Real-time visualization of franchise interest by location
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* KPI Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{totalVotes}</p>
                      <p className="text-sm text-muted-foreground">Total Votes</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary/60" />
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-2xl font-bold text-secondary-foreground">{uniqueCities}</p>
                      <p className="text-sm text-muted-foreground">Unique Cities</p>
                    </div>
                    <MapPin className="w-8 h-8 text-secondary/60" />
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-gold/5 to-gold/10 border-gold/20">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {todayStats.topCity ? `${todayStats.topCity.city}` : "No votes today"}
                      </p>
                      <p className="text-sm text-muted-foreground">Top City Today</p>
                    </div>
                    <Trophy className="w-8 h-8 text-gold/60" />
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cities or countries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Country Filter */}
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="votes">Votes (desc)</SelectItem>
                      <SelectItem value="city">City A–Z</SelectItem>
                      <SelectItem value="country">Country A–Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Controls Row 2 */}
                <div className="flex items-center gap-4">
                  {/* Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="franchise-multiplier"
                      checked={countFranchiseAsFive}
                      onCheckedChange={setCountFranchiseAsFive}
                    />
                    <Label htmlFor="franchise-multiplier" className="text-sm whitespace-nowrap">
                      Count Franchise Applicants ×5
                    </Label>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToCSV}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyJSON}
                      className="flex items-center gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      JSON
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-4 font-semibold">Rank</th>
                        <th className="text-left p-4 font-semibold">City</th>
                        <th className="text-left p-4 font-semibold">Country</th>
                        <th className="text-left p-4 font-semibold">Votes</th>
                        <th className="text-left p-4 font-semibold">Breakdown</th>
                        <th className="text-left p-4 font-semibold w-32">Demand</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item, index) => {
                        const rank = (currentPage - 1) * itemsPerPage + index + 1;
                        const heatPercent = (item.votes / maxVotes) * 100;
                        
                        return (
                          <tr 
                            key={`${item.city}-${item.country}`}
                            className="border-t hover:bg-muted/30 transition-colors animate-fade-in"
                          >
                            <td className="p-4">
                              <Badge variant={rank <= 3 ? "default" : "secondary"}>
                                #{rank}
                              </Badge>
                            </td>
                            <td className="p-4 font-medium">{item.city}</td>
                            <td className="p-4 text-muted-foreground">{item.country}</td>
                            <td className="p-4">
                              <span className="font-semibold text-lg">{item.votes}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {item.sources.vote > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Vote {item.sources.vote}
                                  </Badge>
                                )}
                                {item.sources.franchise > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Franchise {item.sources.franchise}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${heatPercent}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} cities
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FranchiseDemandCounter;