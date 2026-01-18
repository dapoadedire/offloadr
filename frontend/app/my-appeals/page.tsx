"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserAppeals } from "@/hooks/useModeration";
import { AppealStatusBadge } from "@/components/moderation/moderation-status-badge";
import { ModerationAppealWithDetails, AppealStatus } from "@/lib/types/moderation";

export default function MyAppealsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "resolved">("all");

  const { data: appealsData, isLoading } = useUserAppeals();

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const appeals = appealsData?.data || [];

  const filteredAppeals = appeals.filter((appeal) => {
    if (activeTab === "pending") return appeal.status === "pending";
    if (activeTab === "resolved") return appeal.status !== "pending";
    return true;
  });

  const pendingCount = appeals.filter((a) => a.status === "pending").length;
  const resolvedCount = appeals.filter((a) => a.status !== "pending").length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/my-listings">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-2">
                <MessageSquare className="h-8 w-8" />
                My Appeals
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your moderation appeal requests
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Appeals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{appeals.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{resolvedCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appeals List */}
        <Card>
          <CardHeader>
            <CardTitle>Appeal History</CardTitle>
            <CardDescription>
              View the status of all your moderation appeals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">
                  All ({appeals.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({pendingCount})
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved ({resolvedCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {filteredAppeals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No appeals found</h3>
                    <p className="text-muted-foreground">
                      {activeTab === "pending"
                        ? "You don't have any pending appeals"
                        : activeTab === "resolved"
                        ? "You don't have any resolved appeals"
                        : "You haven't submitted any appeals yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppeals.map((appeal, index) => (
                      <AppealCard key={appeal.id} appeal={appeal} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

interface AppealCardProps {
  appeal: ModerationAppealWithDetails;
  index: number;
}

function AppealCard({ appeal, index }: AppealCardProps) {
  const getStatusIcon = (status: AppealStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "denied":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(appeal.status)}
            <div>
              <Link
                href={`/items/${appeal.item_id}`}
                className="font-medium hover:underline flex items-center gap-1"
              >
                {appeal.item?.title || `Item #${appeal.item_id}`}
                <ExternalLink className="h-3 w-3" />
              </Link>
              <p className="text-sm text-muted-foreground">
                Submitted {formatDistanceToNow(new Date(appeal.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <AppealStatusBadge status={appeal.status} />
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium mb-1">Your Appeal:</p>
          <p className="text-sm text-muted-foreground">{appeal.reason}</p>
        </div>

        {appeal.status !== "pending" && appeal.resolved_at && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Resolved {formatDistanceToNow(new Date(appeal.resolved_at), { addSuffix: true })}</span>
            </div>
            {appeal.resolution_notes && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Resolution Notes:</p>
                <p className="text-sm text-muted-foreground">{appeal.resolution_notes}</p>
              </div>
            )}
          </div>
        )}

        {appeal.status === "pending" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Your appeal is being reviewed by our moderation team</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
