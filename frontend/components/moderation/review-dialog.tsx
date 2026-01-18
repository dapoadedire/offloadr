"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ModerationStatusBadge,
  ConfidenceScore,
  FlagSeverityBadge,
} from "./moderation-status-badge";
import { ModerationResultWithDetails, ReviewDecision } from "@/lib/types/moderation";
import { useSubmitReview } from "@/hooks/useModeration";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Phone,
  Tag,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

const reviewSchema = z.object({
  notes: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moderationResult: ModerationResultWithDetails;
  onReviewComplete?: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  moderationResult,
  onReviewComplete,
}: ReviewDialogProps) {
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const submitReviewMutation = useSubmitReview();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      notes: "",
    },
  });

  const onSubmit = async (data: ReviewFormValues) => {
    if (!decision) return;

    await submitReviewMutation.mutateAsync({
      resultId: moderationResult.id,
      payload: {
        decision,
        notes: data.notes || undefined,
      },
    });

    form.reset();
    setDecision(null);
    onReviewComplete?.();
  };

  const flags = [
    {
      key: "flagged_inappropriate",
      label: "Inappropriate Content",
      icon: ShieldAlert,
      active: moderationResult.flagged_inappropriate,
    },
    {
      key: "flagged_scam",
      label: "Potential Scam",
      icon: AlertTriangle,
      active: moderationResult.flagged_scam,
    },
    {
      key: "flagged_prohibited",
      label: "Prohibited Item",
      icon: XCircle,
      active: moderationResult.flagged_prohibited,
    },
    {
      key: "flagged_price_anomaly",
      label: "Price Anomaly",
      icon: DollarSign,
      active: moderationResult.flagged_price_anomaly,
    },
    {
      key: "flagged_contact_leak",
      label: "Contact Info Leak",
      icon: Phone,
      active: moderationResult.flagged_contact_leak,
    },
    {
      key: "flagged_condition_mismatch",
      label: "Condition Mismatch",
      icon: Tag,
      active: moderationResult.flagged_condition_mismatch,
    },
  ];

  const activeFlags = flags.filter((f) => f.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Moderation Result
            <ModerationStatusBadge status={moderationResult.status} size="sm" />
          </DialogTitle>
          <DialogDescription>
            Review the flagged content and make a moderation decision.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Item Info */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Item Information
              </h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      href={`/items/${moderationResult.item_id}`}
                      target="_blank"
                      className="font-medium hover:underline flex items-center gap-1"
                    >
                      {moderationResult.item?.title || `Item #${moderationResult.item_id}`}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${moderationResult.item?.price?.toFixed(2)} -{" "}
                      {moderationResult.item?.condition}
                    </p>
                  </div>
                  <ConfidenceScore score={moderationResult.confidence_score} />
                </div>
                {moderationResult.item?.description && (
                  <p className="text-sm mt-3 text-muted-foreground line-clamp-3">
                    {moderationResult.item.description}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Flags */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Detected Issues ({activeFlags.length})
              </h4>
              {activeFlags.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {activeFlags.map((flag) => (
                    <div
                      key={flag.key}
                      className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg"
                    >
                      <flag.icon className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">{flag.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No flags detected</p>
              )}
            </div>

            <Separator />

            {/* AI Explanation */}
            {moderationResult.ai_explanation && (
              <div className="space-y-2">
                <h4 className="font-medium">AI Analysis</h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">{moderationResult.ai_explanation}</p>
                  {moderationResult.ai_suggested_condition && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      Suggested condition:{" "}
                      <Badge variant="outline">
                        {moderationResult.ai_suggested_condition}
                      </Badge>
                    </p>
                  )}
                  {moderationResult.ai_category_match !== null && (
                    <p className="text-sm mt-1 text-muted-foreground">
                      Category match:{" "}
                      {moderationResult.ai_category_match ? (
                        <CheckCircle className="h-4 w-4 inline text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 inline text-red-500" />
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Review Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes about your decision..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={decision === "approved" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setDecision("approved")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant={decision === "rejected" ? "destructive" : "outline"}
                    className="flex-1"
                    onClick={() => setDecision("rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={!decision || submitReviewMutation.isPending}
          >
            {submitReviewMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
