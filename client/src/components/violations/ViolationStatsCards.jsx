import React from 'react';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';

const ViolationStatsCards = ({ stats, loading = false }) => {
  const statsConfig = [
    {
      title: 'Total Violations',
      value: stats.total || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: stats.totalChange,
      changeType: 'increase'
    },
    {
      title: 'Pending',
      value: stats.pending || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: stats.pendingChange,
      changeType: 'neutral'
    },
    {
      title: 'Resolved',
      value: stats.resolved || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: stats.resolvedChange,
      changeType: 'decrease'
    },
    {
      title: 'Total Penalties',
      value: `KES ${(stats.totalPenalties || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: stats.penaltiesChange,
      changeType: 'increase'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  {stat.change !== undefined && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className={`h-3 w-3 mr-1 ${
                        stat.changeType === 'increase' ? 'text-red-500' : 
                        stat.changeType === 'decrease' ? 'text-green-500' : 
                        'text-gray-500'
                      }`} />
                      <span className={`text-xs ${
                        stat.changeType === 'increase' ? 'text-red-500' : 
                        stat.changeType === 'decrease' ? 'text-green-500' : 
                        'text-gray-500'
                      }`}>
                        {stat.change > 0 ? '+' : ''}{stat.change}% from last month
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ViolationStatsCards;
