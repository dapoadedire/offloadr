"use client";

import { Badge } from "@/components/ui/badge";
import { ModerationStatus, AppealStatus, FlagSeverity } from "@/lib/types/moderation";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModerationStatusBadgeProps {
  status: ModerationStatus;
  size?: "sm" | "md" | "lg";
}

export function ModerationStatusBadge({
  status,
  size = "md",
}: ModerationStatusBadgeProps) {
  const config = {
    pending: {
      label: "Pending",
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    passed: {
      label: "Passed",
      variant: "default" as const,
      icon: ShieldCheck,
      className: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    flagged: {
      label: "Flagged",
      variant: "destructive" as const,
      icon: ShieldAlert,
      className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    },
    rejected: {
      label: "Rejected",
      variant: "destructive" as const,
      icon: ShieldX,
      className: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  const { label, icon: Icon, className } = config[status];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <Badge variant="outline" className={cn(className, sizeClasses[size])}>
      <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {label}
    </Badge>
  );
}

interface AppealStatusBadgeProps {
  status: AppealStatus;
  size?: "sm" | "md" | "lg";
}

export function AppealStatusBadge({ status, size = "md" }: AppealStatusBadgeProps) {
  const config = {
    pending: {
      label: "Pending Review",
      icon: Clock,
      className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    approved: {
      label: "Approved",
      icon: CheckCircle,
      className: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    denied: {
      label: "Denied",
      icon: XCircle,
      className: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  const { label, icon: Icon, className } = config[status];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <Badge variant="outline" className={cn(className, sizeClasses[size])}>
      <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {label}
    </Badge>
  );
}

interface FlagSeverityBadgeProps {
  severity: FlagSeverity;
  label?: string;
}

export function FlagSeverityBadge({ severity, label }: FlagSeverityBadgeProps) {
  const config = {
    low: {
      className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      icon: Shield,
    },
    medium: {
      className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      icon: AlertTriangle,
    },
    high: {
      className: "bg-red-500/10 text-red-500 border-red-500/20",
      icon: ShieldAlert,
    },
  };

  const { className, icon: Icon } = config[severity];

  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      <Icon className="h-3 w-3 mr-1" />
      {label || severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

interface ConfidenceScoreProps {
  score: number | null;
  showLabel?: boolean;
}

export function ConfidenceScore({ score, showLabel = true }: ConfidenceScoreProps) {
  if (score === null) return null;

  const percentage = Math.round(score * 100);
  const getColor = () => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && <span className="text-sm text-muted-foreground">Confidence:</span>}
      <span className={cn("font-medium", getColor())}>{percentage}%</span>
    </div>
  );
}
