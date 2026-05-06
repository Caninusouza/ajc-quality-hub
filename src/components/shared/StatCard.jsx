import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, className, to }) {
  const Wrapper = to ? Link : 'div';
  return (
    <Wrapper to={to}>
    <Card className={cn("p-5 relative overflow-hidden group transition-shadow duration-300", to ? "hover:shadow-lg cursor-pointer hover:ring-2 hover:ring-primary/30" : "hover:shadow-lg", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn(
              "text-xs font-medium",
              trend > 0 ? "text-emerald-600" : "text-red-500"
            )}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
    </Wrapper>
  );
}