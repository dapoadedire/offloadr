"use client";

import { useState } from "react";
import { useModerationAnalytics, useModerationTrends } from "@/hooks/useModeration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingDown,
  Calendar,
  BarChart3,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function ModerationAnalyticsPage() {
  const [dateRange, setDateRange] = useState<"7" | "14" | "30">("30");

  const fromDate = format(subDays(new Date(), parseInt(dateRange)), "yyyy-MM-dd");
  const toDate = format(new Date(), "yyyy-MM-dd");

  const { data: analytics, isLoading: analyticsLoading } = useModerationAnalytics({
    from_date: fromDate,
    to_date: toDate,
  });

  const { data: trends } = useModerationTrends();

  const TrendIndicator = ({
    value,
    inverse = false,
  }: {
    value: number;
    inverse?: boolean;
  }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNegative = inverse ? value > 0 : value < 0;

    return (
      <div
        className={cn(
          "flex items-center gap-1 text-sm",
          isPositive && "text-green-500",
          isNegative && "text-red-500",
          !isPositive && !isNegative && "text-muted-foreground"
        )}
      >
        {value > 0 ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : value < 0 ? (
          <ArrowDownRight className="h-4 w-4" />
        ) : null}
        {Math.abs(value).toFixed(1)}%
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Moderation Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track moderation performance and trends
          </p>
        </div>
        <Select
          value={dateRange}
          onValueChange={(v) => setDateRange(v as "7" | "14" | "30")}
        >
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scanned
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {analytics?.summary?.total_scanned ?? 0}
                </span>
                {trends && (
                  <TrendIndicator value={trends.changes.total_scanned} />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Auto Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {analytics?.summary?.auto_approved ?? 0}
                </span>
                {trends && (
                  <TrendIndicator value={trends.changes.auto_approved} />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Flagged for Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {analytics?.summary?.flagged_for_review ?? 0}
                </span>
                {trends && (
                  <TrendIndicator value={trends.changes.flagged_for_review} inverse />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {analytics?.summary?.rejected ?? 0}
                </span>
                {trends && (
                  <TrendIndicator value={trends.changes.rejected} inverse />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Approval Rates</CardTitle>
            <CardDescription>
              Percentage breakdown of moderation outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {analyticsLoading ? (
              <>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Auto-Approval Rate</span>
                    <span className="font-medium text-green-500">
                      {analytics?.rates?.auto_approval_rate?.toFixed(1) ?? 0}%
                    </span>
                  </div>
                  <Progress
                    value={analytics?.rates?.auto_approval_rate ?? 0}
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Flag Rate</span>
                    <span className="font-medium text-orange-500">
                      {analytics?.rates?.flag_rate?.toFixed(1) ?? 0}%
                    </span>
                  </div>
                  <Progress
                    value={analytics?.rates?.flag_rate ?? 0}
                    className="h-2 [&>div]:bg-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Rejection Rate</span>
                    <span className="font-medium text-red-500">
                      {analytics?.rates?.reject_rate?.toFixed(1) ?? 0}%
                    </span>
                  </div>
                  <Progress
                    value={analytics?.rates?.reject_rate ?? 0}
                    className="h-2 [&>div]:bg-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Appeal Success Rate</span>
                    <span className="font-medium text-blue-500">
                      {analytics?.rates?.appeal_success_rate?.toFixed(1) ?? 0}%
                    </span>
                  </div>
                  <Progress
                    value={analytics?.rates?.appeal_success_rate ?? 0}
                    className="h-2 [&>div]:bg-blue-500"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flag Types Breakdown</CardTitle>
            <CardDescription>Most common reasons for flagging content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span>Scam Indicators</span>
                  </div>
                  <Badge variant="secondary">
                    {analytics?.summary?.flagged_scam ?? 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span>Inappropriate Content</span>
                  </div>
                  <Badge variant="secondary">
                    {analytics?.summary?.flagged_inappropriate ?? 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    <span>Prohibited Items</span>
                  </div>
                  <Badge variant="secondary">
                    {analytics?.summary?.flagged_prohibited ?? 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-yellow-500" />
                    <span>Price Anomalies</span>
                  </div>
                  <Badge variant="secondary">
                    {analytics?.summary?.flagged_price ?? 0}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appeals Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Appeals Overview</CardTitle>
          <CardDescription>
            User appeals for moderation decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">
                  {analytics?.summary?.appeals_submitted ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Appeals Submitted
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-green-500">
                  {analytics?.summary?.appeals_approved ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Appeals Approved
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-blue-500">
                  {analytics?.rates?.appeal_success_rate?.toFixed(1) ?? 0}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Success Rate</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
