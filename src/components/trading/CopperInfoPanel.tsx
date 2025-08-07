import { Badge } from "@/components/ui/badge";

const CopperInfoPanel = () => {
  const ratingData = [
    { category: "Roadmap & Progress", value: 79.0 },
    { category: "Ecosystem Development", value: 71.5 },
    { category: "Token Economics", value: 53.2 },
    { category: "Underlying Tech & Security", value: 49.8 },
    { category: "Performance", value: 52.9 },
    { category: "Team, Partners, Investors", value: 76.0 },
  ];

  const copperGrades = [
    "Electrolytic Copper Cathode",
    "Blister Copper", 
    "Wire Rods",
    "Ingots"
  ];

  return (
    <div className="h-full bg-black p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-gray-800 pb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Copper Market Information</h2>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-yellow-600 text-white">
              BBB (Stable)
            </Badge>
            <span className="text-gray-400 text-sm">Last Review: August 6, 2025</span>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Rating Breakdown</h3>
            <div className="space-y-3">
              {ratingData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">{item.category}</span>
                    <span className="text-white font-mono text-sm">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-gold to-gold-light h-2 rounded-full"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fulfillment & Trade Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Fulfillment & Trade Info</h3>
            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum Order:</span>
                <span className="text-white font-medium">100 tons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bulk Orders:</span>
                <span className="text-green-400 font-medium">up to 6% below market</span>
              </div>
              <div className="space-y-2">
                <span className="text-gray-400 block">Order Types:</span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-gray-600 text-gray-300">Limit</Badge>
                  <Badge variant="outline" className="border-gray-600 text-gray-300">Market</Badge>
                  <Badge variant="outline" className="border-gold text-gold">Direct Fulfill (bulk only)</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Copper Grades */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Available Copper Grades</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {copperGrades.map((grade, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <span className="text-gray-300 text-sm font-medium">{grade}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-gray-400 text-sm mb-2">Global Reserves</h4>
            <p className="text-white text-2xl font-bold">870M tons</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-gray-400 text-sm mb-2">Annual Production</h4>
            <p className="text-white text-2xl font-bold">21M tons</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-gray-400 text-sm mb-2">Market Cap</h4>
            <p className="text-white text-2xl font-bold">$1.2T</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopperInfoPanel;