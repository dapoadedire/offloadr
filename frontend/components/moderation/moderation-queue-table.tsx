"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ModerationStatusBadge,
  ConfidenceScore,
} from "./moderation-status-badge";
import { ModerationResultWithDetails } from "@/lib/types/moderation";
import {
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { ReviewDialog } from "./review-dialog";
import { cn } from "@/lib/utils";

interface ModerationQueueTableProps {
  items: ModerationResultWithDetails[];
  isLoading?: boolean;
  onReviewComplete?: () => void;
}

export function ModerationQueueTable({
  items,
  isLoading,
  onReviewComplete,
}: ModerationQueueTableProps) {
  const [selectedItem, setSelectedItem] = useState<ModerationResultWithDetails | null>(
    null
  );
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const handleReview = (item: ModerationResultWithDetails) => {
    setSelectedItem(item);
    setReviewDialogOpen(true);
  };

  const getFlagCount = (item: ModerationResultWithDetails) => {
    let count = 0;
    if (item.flagged_inappropriate) count++;
    if (item.flagged_scam) count++;
    if (item.flagged_prohibited) count++;
    if (item.flagged_price_anomaly) count++;
    if (item.flagged_contact_leak) count++;
    if (item.flagged_condition_mismatch) count++;
    return count;
  };

  const getFlagTypes = (item: ModerationResultWithDetails) => {
    const flags = [];
    if (item.flagged_inappropriate) flags.push("Inappropriate");
    if (item.flagged_scam) flags.push("Scam");
    if (item.flagged_prohibited) flags.push("Prohibited");
    if (item.flagged_price_anomaly) flags.push("Price");
    if (item.flagged_contact_leak) flags.push("Contact Leak");
    if (item.flagged_condition_mismatch) flags.push("Condition");
    return flags;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium">Queue is empty</h3>
        <p className="text-muted-foreground">
          No items are waiting for moderation review.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const flagCount = getFlagCount(item);
              const flagTypes = getFlagTypes(item);

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/items/${item.item_id}`}
                        className="font-medium hover:underline flex items-center gap-1"
                        target="_blank"
                      >
                        {item.item?.title || `Item #${item.item_id}`}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        ${item.item?.price?.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.seller && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.seller.avatar_url || undefined} />
                          <AvatarFallback>
                            {item.seller.firstname?.[0]}
                            {item.seller.lastname?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{item.seller.username}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <ModerationStatusBadge status={item.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <AlertTriangle
                          className={cn(
                            "h-4 w-4",
                            flagCount > 0 ? "text-orange-500" : "text-muted-foreground"
                          )}
                        />
                        <span className="text-sm font-medium">{flagCount}</span>
                      </div>
                      {flagTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {flagTypes.slice(0, 2).map((flag) => (
                            <span
                              key={flag}
                              className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded"
                            >
                              {flag}
                            </span>
                          ))}
                          {flagTypes.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{flagTypes.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ConfidenceScore score={item.confidence_score} showLabel={false} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(item)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedItem && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          moderationResult={selectedItem}
          onReviewComplete={() => {
            setReviewDialogOpen(false);
            setSelectedItem(null);
            onReviewComplete?.();
          }}
        />
      )}
    </>
  );
}
