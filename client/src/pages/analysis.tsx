import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { formatTimeSlot } from "@/lib/utils";
import LoadingSpinner from "@/components/loading-spinner";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Fuel,
  IndianRupee,
  Award,
  Target,
  Zap,
} from "lucide-react";

interface AnalysisData {
  consumption: {
    totalLiters: number;
    monthlyAverage: number;
    lastMonthLiters: number;
    trend: "up" | "down" | "stable";
    trendPercentage: number;
  };
  costs: {
    totalSpent: number;
    averagePerLiter: number;
    lastMonthSpent: number;
    marketPrice: number;
    savingsPerLiter: number;
    totalSavings: number;
  };
  quality: {
    rating: number;
    deliverySuccess: number;
    onTimeDelivery: number;
    qualityScore: number;
  };
  orders: {
    totalOrders: number;
    completedOrders: number;
    averageOrderSize: number;
    frequentDeliveryTime: string;
  };
}

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
    <div
      className="min-h-screen flex flex-col bg-gray-50"
      data-testid="analysis-screen"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/profile")}
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

      <div className="flex-1 p-4">
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
                          <p className="text-sm text-gray-600">Total Savings</p>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{data.costs.totalSavings.toLocaleString()}
                          </p>
                        </div>
                        <IndianRupee className="text-green-600" size={24} />
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

                {/* Savings Highlight */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Zap className="text-green-600" size={20} />
                      Your Savings with Zapygo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700">
                          Market Price per Litre:
                        </span>
                        <span className="font-semibold">
                          ₹{data.costs.marketPrice}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-green-700">
                          Zapygo Price per Litre:
                        </span>
                        <span className="font-semibold">
                          ₹{data.costs.averagePerLiter}
                        </span>
                      </div>
                      <div className="border-t border-green-200 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-medium">
                            You Save per Litre:
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            ₹{data.costs.savingsPerLiter}
                          </span>
                        </div>
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
                        {data.consumption.monthlyAverage} L
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    {data.consumption.trend === "up" ? (
                      <TrendingUp className="text-blue-600" size={20} />
                    ) : (
                      <TrendingDown className="text-green-600" size={20} />
                    )}
                    <span className="text-sm">
                      {data.consumption.trend === "up"
                        ? "Increased"
                        : "Decreased"}{" "}
                      by{" "}
                      <span className="font-semibold">
                        {data.consumption.trendPercentage}%
                      </span>{" "}
                      from last month
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Average Order Size:</span>
                      <span className="font-semibold">
                        {data.orders.averageOrderSize} L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Most Frequent Delivery Time:</span>
                      <span className="font-semibold">
                        {formatTimeSlot(data.orders.frequentDeliveryTime)}
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

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">
                      💰 Your Savings Breakdown
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Market Rate:</span>
                        <span>₹{data.costs.marketPrice}/L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Zapygo Rate:</span>
                        <span>₹{data.costs.averagePerLiter}/L</span>
                      </div>
                      <div className="border-t border-green-300 pt-2">
                        <div className="flex justify-between font-semibold text-green-700">
                          <span>Savings per Litre:</span>
                          <span>₹{data.costs.savingsPerLiter}</span>
                        </div>
                        <div className="flex justify-between font-bold text-green-800 text-lg">
                          <span>Total Savings:</span>
                          <span>
                            ₹{data.costs.totalSavings.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {data.costs.totalSavings > 0 && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        🎉 You've saved enough to buy{" "}
                        <span className="font-bold">
                          {Math.floor(
                            data.costs.totalSavings /
                              (data.costs.averagePerLiter || 1)
                          )}{" "}
                          litres
                        </span>{" "}
                        of free fuel!
                      </p>
                    </div>
                  )}
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

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">
                      📊 Performance Summary
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Your service experience has been excellent with{" "}
                      {data.orders.completedOrders} successful deliveries out of{" "}
                      {data.orders.totalOrders} orders. Keep up the great
                      partnership with Zapygo!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
