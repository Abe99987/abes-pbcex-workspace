import { Badge } from "@/components/ui/badge";

const CopperInfoPanel = () => {
  const ratingData = [
    { category: "Roadmap & Progress", value: 82.0, color: "from-green-500 to-green-400" },
    { category: "Ecosystem Development", value: 72.1, color: "from-blue-500 to-blue-400" },
    { category: "Token Economics", value: 51.3, color: "from-yellow-500 to-yellow-400" },
    { category: "Underlying Tech & Security", value: 48.2, color: "from-orange-500 to-orange-400" },
    { category: "Performance", value: 48.9, color: "from-red-500 to-red-400" },
    { category: "Team, Partners, Investors", value: 75.3, color: "from-purple-500 to-purple-400" },
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
        {/* Header - BloFin style */}
        <div className="border-b border-gray-800 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white">Copper (COPPER) Rating</h2>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">$8,900</div>
              <div className="text-sm text-gray-400">+2.4%</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="text-3xl font-bold text-white">BBB</div>
              <Badge variant="secondary" className="bg-blue-600 text-white">
                Stable
              </Badge>
            </div>
            <div className="text-gray-400 text-sm flex items-center space-x-1">
              <span>🛡️ TokenInsight</span>
              <span>|</span>
              <span>Last Review: April 26, 2025</span>
            </div>
          </div>
        </div>

        {/* Rating Breakdown - BloFin radar style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Copper (COPPER) Rating Breakdown: 62.72/100</h3>
            <div className="space-y-4">
              {ratingData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">{item.category}</span>
                    <span className="text-white font-mono text-sm font-bold">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-4 text-xs text-gray-500">
                Data Updated in 37 minutes
              </div>
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