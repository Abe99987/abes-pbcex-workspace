import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";

// Mock data
const mockAcceptedAssets = [
  { id: "PAXG", label: "PAXG (Gold, redeemable)", checked: true, badge: "Redeemable (External)", tooltip: "Externally portable token; 1:1 backed; custody only—retail fulfillment via JM/DG." },
  { id: "XAU-s", label: "PBcex Synthetic Gold (XAU-s)", checked: true, badge: "Trade-Only (Internal)", tooltip: "Internal PBcex token; secure, freeze/burn capable; not transferable off PBcex." },
  { id: "XAG-s", label: "PBcex Synthetic Silver (XAG-s)", checked: false, badge: "Trade-Only (Internal)", tooltip: "Internal PBcex token; secure, freeze/burn capable; not transferable off PBcex." },
  { id: "XPT-s", label: "PBcex Synthetic Platinum (XPT-s)", checked: true, badge: "Trade-Only (Internal)", tooltip: "Internal PBcex token; secure, freeze/burn capable; not transferable off PBcex." },
  { id: "XPD-s", label: "PBcex Synthetic Palladium (XPD-s)", checked: false, badge: "Trade-Only (Internal)", tooltip: "Internal PBcex token; secure, freeze/burn capable; not transferable off PBcex." },
  { id: "XCU-s", label: "PBcex Synthetic Copper (XCU-s)", checked: false, badge: "Trade-Only (Internal)", tooltip: "Internal PBcex token; secure, freeze/burn capable; not transferable off PBcex." },
  { id: "USD", label: "USD", checked: true, badge: "Redeemable (External)", tooltip: "US Dollar" },
  { id: "USDC", label: "Stablecoins (USDC/USDT)", checked: true, badge: "Redeemable (External)", tooltip: "USD-backed stablecoins" },
];

const mockDiscountTiers = [
  { tier: 1, minUnits: "1,000", discount: "2%" },
  { tier: 2, minUnits: "5,000", discount: "5%" },
  { tier: 3, minUnits: "10,000", discount: "8%" },
];

const ProviderSettings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Provider Settings</h1>
          <p className="text-muted-foreground">Configure your provider account preferences and payment options.</p>
        </div>

        <div className="space-y-6">
          {/* Accepted Payment Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Accepted Payment Assets
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Backend required. This is a preview.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Select which assets you accept as payment from buyers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAcceptedAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox 
                      id={asset.id} 
                      checked={asset.checked} 
                      disabled
                      className="opacity-50"
                    />
                    <div className="flex-1">
                      <Label htmlFor={asset.id} className="text-sm font-medium cursor-not-allowed opacity-50">
                        {asset.label}
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {asset.badge}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoIcon className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{asset.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preferred Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Preferred Assets</CardTitle>
              <CardDescription>
                Drag to reorder your preferred payment assets (optional priority order).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockAcceptedAssets.filter(a => a.checked).map((asset, index) => (
                  <div key={asset.id} className="flex items-center p-2 border rounded bg-muted/30">
                    <div className="text-sm font-medium opacity-50 cursor-not-allowed">
                      {index + 1}. {asset.label}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Drag functionality disabled in preview mode.
              </p>
            </CardContent>
          </Card>

          {/* Min Lot Size */}
          <Card>
            <CardHeader>
              <CardTitle>Min Lot Size</CardTitle>
              <CardDescription>
                Set minimum order size requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="min-lot">Minimum lot size description</Label>
                  <Input
                    id="min-lot"
                    placeholder="e.g., min 1,000 oz silver per fill"
                    value="min 5 oz gold per fill"
                    disabled
                    className="mt-1 opacity-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Volume Discount Tiers */}
          <Card>
            <CardHeader>
              <CardTitle>Volume Discount Tiers (optional)</CardTitle>
              <CardDescription>
                Configure volume-based discounts for larger orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Min Units</TableHead>
                    <TableHead>Discount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDiscountTiers.map((tier) => (
                    <TableRow key={tier.tier}>
                      <TableCell>Tier {tier.tier}</TableCell>
                      <TableCell>≥ {tier.minUnits} oz</TableCell>
                      <TableCell>{tier.discount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Toggle Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Features</CardTitle>
              <CardDescription>
                Enable or disable provider-specific features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="direct-fill">Direct Fill</Label>
                    <p className="text-sm text-muted-foreground">Allow direct fulfillment of orders</p>
                  </div>
                  <Switch id="direct-fill" checked={true} disabled />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="large-limit">Large-Limit Posting</Label>
                    <p className="text-sm text-muted-foreground">Post to the Large-Limit board</p>
                  </div>
                  <Switch id="large-limit" checked={true} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button size="lg" disabled className="w-full opacity-50 cursor-not-allowed">
                    Save Provider Settings
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Backend required. This is a preview.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default ProviderSettings;