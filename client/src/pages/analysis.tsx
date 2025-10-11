import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { formatTimeSlot } from "@/lib/utils";
import LoadingSpinner from "@/components/loading-spinner";
import BottomNav from "@/components/bottom-nav";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Fuel,
  IndianRupee,
  Award,
  Target,
} from "lucide-react";

/**
 * Analysis Page - All data is dynamic and comes from backend API
 *
 * Data Sources:
 * - consumption.totalLiters: Sum of all delivered orders' quantities
 * - consumption.monthlyAverage: totalLiters divided by selected period months
 * - consumption.trend: Compares last month to monthly average (±10% threshold)
 * - costs.totalSpent: Sum of all delivered orders' total amounts
 * - costs.averagePerLiter: totalSpent divided by totalLiters
 * - quality.deliverySuccess: (completed orders / total orders) * 100
 * - quality.qualityScore: Average of delivery success and on-time delivery rates
 * - orders.averageOrderSize: totalLiters divided by number of completed orders
 * - orders.frequentDeliveryTime: Most common scheduled time from completed orders
 *
 * All calculations are done server-side in /api/analysis endpoint
 * Only delivered orders are counted for meaningful analysis
 */

export default function AnalysisScreen() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("3months");

  const { data: analysisData, isLoading } = useQuery({
    queryKey: ["/api/analysis", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analysis?period=${selectedPeriod}`, {
        headers: { "x-user-id": user?.id || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch analysis data");
      return response.json();
    },
    enabled: !!user,
  });

  const data = analysisData;

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No analysis data available</p>
          <Button onClick={() => setLocation("/home")}>Go Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="analysis-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mr-3"
            data-testid="back-button"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-lg font-medium" data-testid="page-title">
            Fuel Analysis Report
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="p-4 pb-20">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs px-2 py-1.5">
              Overview
            </TabsTrigger>
            <TabsTrigger value="consumption" className="text-xs px-2 py-1.5">
              Consumption
            </TabsTrigger>
            <TabsTrigger value="costs" className="text-xs px-1 py-1.5">
              Costs & Savings
            </TabsTrigger>
            <TabsTrigger value="quality" className="text-xs px-2 py-1.5">
              Quality
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {data.orders.completedOrders === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-gray-400 mb-4">
                    <BarChart3 size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No Analysis Data Available
                  </h3>
                  <p className="text-gray-500 mb-4">
                    You need to have completed orders to view your fuel analysis
                    report.
                  </p>
                  <Button onClick={() => setLocation("/new-order")}>
                    Place Your First Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Fuel</p>
                          <p className="text-2xl font-bold">
                            {data.consumption.totalLiters}L
                          </p>
                        </div>
                        <Fuel className="text-blue-600" size={24} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Spent</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{data.costs.totalSpent.toLocaleString()}
                          </p>
                        </div>
                        <IndianRupee className="text-blue-600" size={24} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Quality Score</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {data.quality.qualityScore}%
                          </p>
                        </div>
                        <Award className="text-blue-600" size={24} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Orders</p>
                          <p className="text-2xl font-bold">
                            {data.orders.completedOrders}/
                            {data.orders.totalOrders}
                          </p>
                        </div>
                        <Target className="text-purple-600" size={24} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <BarChart3 className="text-blue-600" size={20} />
                      Your Fuel Journey Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">
                          Average Order Size:
                        </span>
                        <span className="font-semibold">
                          {data.orders.averageOrderSize}L
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">
                          Monthly Average Consumption:
                        </span>
                        <span className="font-semibold">
                          {data.consumption.monthlyAverage}L
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">
                          Preferred Delivery Time:
                        </span>
                        <span className="font-semibold">
                          {formatTimeSlot(data.orders.frequentDeliveryTime)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Consumption Tab */}
          <TabsContent value="consumption" className="space-y-4">
            {data.orders.completedOrders === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Fuel size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No Consumption Data
                  </h3>
                  <p className="text-gray-500">
                    Complete some orders to see your fuel consumption analysis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 size={20} />
                    Fuel Consumption Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Total Consumption</p>
                      <p className="text-3xl font-bold">
                        {data.consumption.totalLiters} L
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Monthly Average</p>
                      <p className="text-3xl font-bold">
                        {data.consumption.monthlyAverage || 0} L
                      </p>
                      <p className="text-xs text-gray-500">
                        Based on {selectedPeriod.replace(/(\d+)/, "$1 ")} of
                        data
                      </p>
                    </div>
                  </div>

                  {data.consumption.trend !== "stable" && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      {data.consumption.trend === "up" ? (
                        <TrendingUp className="text-blue-600" size={20} />
                      ) : (
                        <TrendingDown className="text-green-600" size={20} />
                      )}
                      <span className="text-sm">
                        Consumption{" "}
                        {data.consumption.trend === "up"
                          ? "increased"
                          : "decreased"}{" "}
                        by{" "}
                        <span className="font-semibold">
                          {data.consumption.trendPercentage}%
                        </span>{" "}
                        compared to monthly average
                      </span>
                    </div>
                  )}

                  {data.consumption.trend === "stable" && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <BarChart3 className="text-gray-600" size={20} />
                      <span className="text-sm text-gray-600">
                        Your consumption pattern is stable and consistent
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Average Order Size:</span>
                      <span className="font-semibold">
                        {data.orders.averageOrderSize || 0} L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Most Frequent Delivery Time:</span>
                      <span className="font-semibold">
                        {data.orders.frequentDeliveryTime === "Not available"
                          ? "Not available"
                          : formatTimeSlot(data.orders.frequentDeliveryTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Month Consumption:</span>
                      <span className="font-semibold">
                        {data.consumption.lastMonthLiters || 0} L
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Costs & Savings Tab */}
          <TabsContent value="costs" className="space-y-4">
            {data.orders.completedOrders === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <IndianRupee
                    size={48}
                    className="mx-auto text-gray-400 mb-4"
                  />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No Cost Data
                  </h3>
                  <p className="text-gray-500">
                    Complete some orders to see your cost analysis and savings.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee size={20} />
                    Cost Analysis & Savings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Total Amount Spent
                      </p>
                      <p className="text-3xl font-bold">
                        ₹{data.costs.totalSpent.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Average per Litre</p>
                      <p className="text-3xl font-bold">
                        ₹{data.costs.averagePerLiter}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">
                      💰 Your Spending Pattern
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Average Cost per Litre:</span>
                        <span className="font-semibold">
                          ₹{data.costs.averagePerLiter}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Month Spending:</span>
                        <span className="font-semibold">
                          ₹{data.costs.lastMonthSpent.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-blue-300 pt-2">
                        <div className="flex justify-between font-bold text-blue-800 text-lg">
                          <span>Total Investment:</span>
                          <span>₹{data.costs.totalSpent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality" className="space-y-4">
            {data.orders.completedOrders === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Award size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No Quality Data
                  </h3>
                  <p className="text-gray-500">
                    Complete some orders to see your service quality metrics.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award size={20} />
                    Service Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Overall Rating</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {data.quality.rating}/5
                      </p>
                      <div className="flex justify-center mt-1">
                        {"⭐".repeat(Math.floor(data.quality.rating))}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Quality Score</p>
                      <p className="text-3xl font-bold text-green-600">
                        {data.quality.qualityScore}%
                      </p>
                      <Badge
                        variant="secondary"
                        className="mt-1 bg-green-100 text-green-800"
                      >
                        Excellent
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Delivery Success Rate:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${data.quality.deliverySuccess}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-semibold">
                          {data.quality.deliverySuccess}%
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>On-Time Delivery:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${data.quality.onTimeDelivery}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">
                          {data.quality.onTimeDelivery}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      📊 Service Performance Summary
                    </h4>
                    <p className="text-sm text-blue-700">
                      {data.orders.completedOrders === data.orders.totalOrders
                        ? `Perfect record! All ${data.orders.totalOrders} orders delivered successfully.`
                        : `${data.orders.completedOrders} successful deliveries out of ${data.orders.totalOrders} orders placed.`}
                      {data.quality.deliverySuccess >= 95
                        ? " Excellent service reliability!"
                        : data.quality.deliverySuccess >= 80
                        ? " Good service performance."
                        : " We're working to improve our service quality."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav activeTab="analytics" />
    </div>
  );
}
