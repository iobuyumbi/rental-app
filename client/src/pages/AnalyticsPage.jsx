import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { analyticsAPI } from "../services/analyticsAPI";
import { toast } from "sonner";

const AnalyticsPage = () => {
  const [kpiData, setKpiData] = useState(null);
  const [utilizationData, setUtilizationData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [inventoryPerformance, setInventoryPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [kpi, utilization, revenue, inventory] = await Promise.all([
        analyticsAPI.getKPIMetrics(),
        analyticsAPI.getUtilizationMetrics(),
        analyticsAPI.getRevenueAnalytics(),
        analyticsAPI.getInventoryPerformance(),
      ]);

      setKpiData(kpi);
      setUtilizationData(utilization);
      setRevenueData(revenue);
      setInventoryPerformance(inventory);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success("Analytics data refreshed");
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    );
  }

  const getUtilizationColor = (rate) => {
    if (rate >= 80) return "text-red-600 bg-red-50";
    if (rate >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getUtilizationIcon = (rate) => {
    if (rate >= 80) return <AlertTriangle className="h-4 w-4" />;
    if (rate >= 50) return <Activity className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Key performance indicators and business insights
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {kpiData?.totalRevenue?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Rentals
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData?.activeRentals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilization Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData?.utilizationRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Inventory utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Rental Duration
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData?.averageRentalDuration || 0} days
            </div>
            <p className="text-xs text-muted-foreground">
              Average rental period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue per Rental</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              KES {kpiData?.revenuePerRental?.toLocaleString() || "0"}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Average revenue per completed rental
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {kpiData?.totalOrders > 0
                ? Math.round(
                    (kpiData.completedOrders / kpiData.totalOrders) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {kpiData?.completedOrders || 0} of {kpiData?.totalOrders || 0}{" "}
              orders completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Items:</span>
                <span className="font-semibold">
                  {kpiData?.totalProducts || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Currently Rented:</span>
                <span className="font-semibold text-orange-600">
                  {kpiData?.rentedProducts || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Available:</span>
                <span className="font-semibold text-green-600">
                  {kpiData?.availableProducts || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Inventory Utilization Analysis
          </CardTitle>
          <CardDescription>
            Track how efficiently your inventory is being utilized
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {utilizationData?.summary?.highUtilization || 0}
              </div>
              <div className="text-sm text-red-700">
                High Utilization (&gt;80%)
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {utilizationData?.summary?.mediumUtilization || 0}
              </div>
              <div className="text-sm text-yellow-700">
                Medium Utilization (50-80%)
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {utilizationData?.summary?.lowUtilization || 0}
              </div>
              <div className="text-sm text-green-700">
                Low Utilization (&lt;50%)
              </div>
            </div>
          </div>

          {/* Top Utilized Items */}
          <div className="space-y-3">
            <h4 className="font-semibold">Top Utilized Items</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {utilizationData?.products
                ?.sort((a, b) => b.utilizationRate - a.utilizationRate)
                ?.slice(0, 10)
                ?.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{product.productName}</div>
                      <div className="text-sm text-gray-600">
                        {product.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {product.rentedQuantity}/{product.totalQuantity} rented
                      </div>
                      <Badge
                        className={`${getUtilizationColor(
                          product.utilizationRate
                        )} border-0`}
                      >
                        {getUtilizationIcon(product.utilizationRate)}
                        {Math.round(product.utilizationRate)}%
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Items
          </CardTitle>
          <CardDescription>Items generating the most revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inventoryPerformance?.topPerformers
              ?.slice(0, 10)
              ?.map((item, index) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-600">
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      KES {item.revenue?.toLocaleString() || "0"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.timesRented} rentals
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Underperforming Items */}
      {inventoryPerformance?.lowPerformers?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Underperforming Items
            </CardTitle>
            <CardDescription>
              Items that haven't been rented recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryPerformance.lowPerformers.slice(0, 10).map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-gray-600">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">Never Rented</Badge>
                    <div className="text-sm text-gray-600 mt-1">
                      {item.totalQuantity} in stock
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;
