import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SettlementDropdownProps {
  onSettlementChange: (settlement: string) => void;
}

const SettlementDropdown = ({ onSettlementChange }: SettlementDropdownProps) => {
  const [selectedSettlement, setSelectedSettlement] = useState("PAXG");

  const settlements = [
    { value: "PAXG", label: "PAXG (Gold)" },
    { value: "XAG", label: "XAG (Silver)" },
    { value: "OSP", label: "OSP (Oil-backed token)" },
    { value: "BTC", label: "BTC" },
    { value: "ETH", label: "ETH" },
    { value: "SOL", label: "SOL" },
    { value: "XRP", label: "XRP" },
    { value: "SUI", label: "SUI" },
  ];

  const handleSettlementChange = (value: string) => {
    setSelectedSettlement(value);
    onSettlementChange(value);
  };

  return (
    <div className="p-3 border-b border-gray-800 bg-black">
      <Label htmlFor="settlement" className="text-gray-300 text-xs mb-2 block">
        Settle In:
      </Label>
      <Select value={selectedSettlement} onValueChange={handleSettlementChange}>
        <SelectTrigger className="bg-gray-900 border-gray-700 text-white text-sm h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          {settlements.map((settlement) => (
            <SelectItem 
              key={settlement.value} 
              value={settlement.value}
              className="text-white hover:bg-gray-800 focus:bg-gray-800"
            >
              {settlement.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SettlementDropdown;