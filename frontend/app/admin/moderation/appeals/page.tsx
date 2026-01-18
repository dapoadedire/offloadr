"use client";

import { useState } from "react";
import { usePendingAppeals, useResolveAppeal } from "@/hooks/useModeration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppealStatusBadge, ModerationStatusBadge } from "@/components/moderation/moderation-status-badge";
import { ModerationAppealWithDetails } from "@/lib/types/moderation";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminAppealsPage() {
  const [page, setPage] = useState(1);
  const [selectedAppeal, setSelectedAppeal] = useState<ModerationAppealWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const { data, isLoading, refetch } = usePendingAppeals({ page, limit: 20 });
  const resolveAppealMutation = useResolveAppeal();

  const handleResolve = async (status: "approved" | "denied") => {
    if (!selectedAppeal) return;

    await resolveAppealMutation.mutateAsync({
      appealId: selectedAppeal.id,
      payload: {
        status,
        notes: notes || undefined,
      },
    });

    setDialogOpen(false);
    setSelectedAppeal(null);
    setNotes("");
    refetch();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Pending Appeals
        </h1>
        <p className="text-muted-foreground mt-1">
          Review user appeals for moderation decisions
        </p>
      </div>

      {/* Appeals List */}
      <Card>
        <CardHeader>
          <CardTitle>Appeals Queue</CardTitle>
          <CardDescription>
            {data?.pagination?.total_items ?? 0} appeals pending review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">No Pending Appeals</h3>
              <p className="text-muted-foreground">
                All appeals have been reviewed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.data?.map((appeal) => (
                <div
                  key={appeal.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={appeal.user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {appeal.user?.firstname?.[0]}
                          {appeal.user?.lastname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {appeal.user?.firstname} {appeal.user?.lastname}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{appeal.user?.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AppealStatusBadge status={appeal.status} size="sm" />
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(appeal.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Appeal Reason:</p>
                    <p className="text-sm text-muted-foreground">{appeal.reason}</p>
                  </div>

                  {appeal.moderation_result && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Original Decision:</span>
                      <ModerationStatusBadge
                        status={appeal.moderation_result.status}
                        size="sm"
                      />
                      {appeal.moderation_result.ai_explanation && (
                        <span className="text-muted-foreground">
                          - {appeal.moderation_result.ai_explanation.slice(0, 100)}...
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppeal(appeal);
                        setDialogOpen(true);
                      }}
                    >
                      Review Appeal
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.current_page} of {data.pagination.total_pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!data.pagination.has_previous_page}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.pagination.has_next_page}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Appeal</DialogTitle>
            <DialogDescription>
              Review the appeal and make a decision
            </DialogDescription>
          </DialogHeader>

          {selectedAppeal && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">User&apos;s Appeal:</p>
                <p className="text-sm">{selectedAppeal.reason}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Resolution Notes (Optional)</label>
                <Textarea
                  className="mt-2"
                  placeholder="Add notes about your decision..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleResolve("denied")}
              disabled={resolveAppealMutation.isPending}
            >
              {resolveAppealMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <XCircle className="h-4 w-4 mr-2" />
              Deny
            </Button>
            <Button
              onClick={() => handleResolve("approved")}
              disabled={resolveAppealMutation.isPending}
            >
              {resolveAppealMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
