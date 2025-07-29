import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface OrderHistoryProps {
  type: "active" | "history";
}

const activeOrders = [
  {
    id: "1",
    pair: "GOLD/USD",
    side: "buy",
    type: "limit",
    amount: "1.250",
    price: "2375.00",
    filled: "0.000",
    status: "open",
    time: "14:32:15",
  },
  {
    id: "2",
    pair: "SILVER/USD",
    side: "sell",
    type: "limit",
    amount: "10.000",
    price: "31.50",
    filled: "3.250",
    status: "partial",
    time: "14:28:42",
  },
];

const orderHistory = [
  {
    id: "3",
    pair: "GOLD/USD",
    side: "buy",
    type: "market",
    amount: "0.500",
    price: "2380.50",
    filled: "0.500",
    status: "filled",
    time: "13:45:23",
  },
  {
    id: "4",
    pair: "OIL/USD",
    side: "sell",
    type: "limit",
    amount: "5.000",
    price: "85.00",
    filled: "5.000",
    status: "filled",
    time: "12:15:18",
  },
  {
    id: "5",
    pair: "LYD/USD",
    side: "buy",
    type: "limit",
    amount: "1000.000",
    price: "0.21",
    filled: "0.000",
    status: "cancelled",
    time: "11:30:45",
  },
];

const OrderHistory = ({ type }: OrderHistoryProps) => {
  const orders = type === "active" ? activeOrders : orderHistory;

  const getStatusBadge = (status: string) => {
    const statusColors = {
      open: "bg-blue-500/20 text-blue-400",
      partial: "bg-yellow-500/20 text-yellow-400",
      filled: "bg-green-500/20 text-green-400",
      cancelled: "bg-red-500/20 text-red-400",
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status}
      </Badge>
    );
  };

  const handleCancelOrder = (orderId: string) => {
    console.log("Cancelling order:", orderId);
  };

  return (
    <div className="h-full bg-slate-950 p-4 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800">
            <TableHead className="text-slate-400 text-xs">Pair</TableHead>
            <TableHead className="text-slate-400 text-xs">Side</TableHead>
            <TableHead className="text-slate-400 text-xs">Type</TableHead>
            <TableHead className="text-slate-400 text-xs">Amount</TableHead>
            <TableHead className="text-slate-400 text-xs">Price</TableHead>
            <TableHead className="text-slate-400 text-xs">Filled</TableHead>
            <TableHead className="text-slate-400 text-xs">Status</TableHead>
            <TableHead className="text-slate-400 text-xs">Time</TableHead>
            {type === "active" && <TableHead className="text-slate-400 text-xs">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="border-slate-800 hover:bg-slate-900/50">
              <TableCell className="text-slate-100 text-xs">{order.pair}</TableCell>
              <TableCell>
                <span
                  className={`text-xs font-medium ${
                    order.side === "buy" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {order.side.toUpperCase()}
                </span>
              </TableCell>
              <TableCell className="text-slate-300 text-xs">{order.type}</TableCell>
              <TableCell className="text-slate-300 text-xs">{order.amount}</TableCell>
              <TableCell className="text-slate-300 text-xs">${order.price}</TableCell>
              <TableCell className="text-slate-300 text-xs">{order.filled}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-slate-400 text-xs">{order.time}</TableCell>
              {type === "active" && (
                <TableCell>
                  {order.status === "open" || order.status === "partial" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  ) : null}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderHistory;