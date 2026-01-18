"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { useItemModeration } from "@/hooks/useModeration";
import { AppealDialog } from "./appeal-dialog";
import { ModerationStatusBadge, ConfidenceScore } from "./moderation-status-badge";
import { cn } from "@/lib/utils";

interface ItemModerationAlertProps {
  itemId: number;
  itemTitle: string;
  isOwner: boolean;
}

export function ItemModerationAlert({
  itemId,
  itemTitle,
  isOwner,
}: ItemModerationAlertProps) {
  const { data: moderation, isLoading, error } = useItemModeration(itemId);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);

  // Only show to item owners
  if (!isOwner) return null;

  if (isLoading) {
    return <Skeleton className="h-20 w-full mb-6" />;
  }

  // If no moderation result exists, don't show anything
  if (error || !moderation) {
    return null;
  }

  const getAlertIcon = () => {
    switch (moderation.status) {
      case "passed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "flagged":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getAlertTitle = () => {
    switch (moderation.status) {
      case "passed":
        return "Moderation Passed";
      case "flagged":
        return "Item Flagged for Review";
      case "rejected":
        return "Item Rejected";
      case "pending":
      default:
        return "Moderation Pending";
    }
  };

  const getAlertDescription = () => {
    switch (moderation.status) {
      case "passed":
        return "Your item has passed our content moderation review and is visible to buyers.";
      case "flagged":
        return "Your item has been flagged for manual review. It may be visible with limited reach until approved.";
      case "rejected":
        return "Your item did not pass moderation and is not visible to buyers. You can appeal this decision.";
      case "pending":
      default:
        return "Your item is being reviewed by our moderation system. This usually takes a few minutes.";
    }
  };

  const getFlags = () => {
    const flags = [];
    if (moderation.flagged_inappropriate) flags.push("Inappropriate Content");
    if (moderation.flagged_scam) flags.push("Potential Scam");
    if (moderation.flagged_prohibited) flags.push("Prohibited Item");
    if (moderation.flagged_price_anomaly) flags.push("Price Anomaly");
    if (moderation.flagged_contact_leak) flags.push("Contact Information");
    if (moderation.flagged_condition_mismatch) flags.push("Condition Mismatch");
    return flags;
  };

  const flags = getFlags();
  const canAppeal = moderation.status === "flagged" || moderation.status === "rejected";
  const hasDetails = flags.length > 0 || moderation.ai_explanation;

  return (
    <>
      <Alert
        className={cn(
          "mb-6",
          moderation.status === "passed" && "border-green-500/50 bg-green-50 dark:bg-green-950/20",
          moderation.status === "pending" && "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20",
          moderation.status === "flagged" && "border-orange-500/50 bg-orange-50 dark:bg-orange-950/20",
          moderation.status === "rejected" && "border-red-500/50 bg-red-50 dark:bg-red-950/20"
        )}
      >
        <div className="flex items-start justify-between w-full">
          <div className="flex items-start gap-3">
            {getAlertIcon()}
            <div className="space-y-1">
              <AlertTitle className="flex items-center gap-2">
                {getAlertTitle()}
                <ModerationStatusBadge status={moderation.status} size="sm" />
              </AlertTitle>
              <AlertDescription>{getAlertDescription()}</AlertDescription>
            </div>
          </div>
          {moderation.status === "pending" && (
            <Loader2 className="h-5 w-5 animate-spin text-yellow-500 flex-shrink-0" />
          )}
        </div>

        {/* Details Toggle */}
        {hasDetails && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-between"
            onClick={() => setDetailsOpen(!detailsOpen)}
          >
            <span>{detailsOpen ? "Hide Details" : "View Details"}</span>
            {detailsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Animated Details Section */}
        <AnimatePresence>
          {detailsOpen && hasDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3 pt-3 border-t">
                {/* Confidence Score */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <ConfidenceScore score={moderation.confidence_score} />
                </div>

                {/* Flags */}
                {flags.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Detected Issues:</span>
                    <div className="flex flex-wrap gap-2">
                      {flags.map((flag) => (
                        <Badge
                          key={flag}
                          variant="outline"
                          className="text-xs bg-destructive/10"
                        >
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Explanation */}
                {moderation.ai_explanation && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Analysis:</span>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {moderation.ai_explanation}
                    </p>
                  </div>
                )}

                {/* Suggested Condition */}
                {moderation.ai_suggested_condition &&
                  moderation.ai_suggested_condition !== moderation.item?.condition && (
                    <div className="text-sm">
                      <span className="font-medium">Suggested Condition:</span>{" "}
                      <Badge variant="secondary">
                        {moderation.ai_suggested_condition.replace("_", " ")}
                      </Badge>
                    </div>
                  )}

                {/* Manual Review Info */}
                {moderation.reviewed_by && (
                  <div className="text-sm text-muted-foreground">
                    Reviewed by moderator on{" "}
                    {moderation.reviewed_at &&
                      new Date(moderation.reviewed_at).toLocaleDateString()}
                    {moderation.review_notes && (
                      <p className="mt-1 bg-muted/50 p-2 rounded">
                        Notes: {moderation.review_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {canAppeal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppealDialogOpen(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Appeal Decision
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/my-appeals">
              <ExternalLink className="h-4 w-4 mr-2" />
              View My Appeals
            </Link>
          </Button>
        </div>
      </Alert>

      {/* Appeal Dialog */}
      <AppealDialog
        open={appealDialogOpen}
        onOpenChange={setAppealDialogOpen}
        moderationResultId={moderation.id}
        itemTitle={itemTitle}
      />
    </>
  );
}
