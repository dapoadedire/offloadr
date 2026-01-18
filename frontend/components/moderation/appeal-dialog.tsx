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
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitAppeal } from "@/hooks/useModeration";
import { Loader2, AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";

const appealSchema = z.object({
  reason: z
    .string()
    .min(20, "Please provide at least 20 characters explaining your appeal")
    .max(1000, "Appeal reason cannot exceed 1000 characters"),
});

type AppealFormValues = z.infer<typeof appealSchema>;

interface AppealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moderationResultId: number;
  itemTitle: string;
  onAppealSubmitted?: () => void;
}

export function AppealDialog({
  open,
  onOpenChange,
  moderationResultId,
  itemTitle,
  onAppealSubmitted,
}: AppealDialogProps) {
  const submitAppealMutation = useSubmitAppeal();

  const form = useForm<AppealFormValues>({
    resolver: zodResolver(appealSchema),
    defaultValues: {
      reason: "",
    },
  });

  const onSubmit = async (data: AppealFormValues) => {
    try {
      await submitAppealMutation.mutateAsync({
        moderationResultId,
        payload: {
          reason: data.reason,
        },
      });

      toast.success("Appeal submitted successfully", {
        description: "We will review your appeal and get back to you soon.",
      });

      form.reset();
      onOpenChange(false);
      onAppealSubmitted?.();
    } catch {
      toast.error("Failed to submit appeal", {
        description: "Please try again later.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Appeal Moderation Decision
          </DialogTitle>
          <DialogDescription>
            Submit an appeal for the moderation decision on &quot;{itemTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appeal Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please explain why you believe this moderation decision should be reconsidered..."
                      className="min-h-[150px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about why you think the item should be approved.
                    Include any relevant context that may help our team review your appeal.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your appeal will be reviewed by our moderation team</li>
                <li>You&apos;ll be notified once a decision is made</li>
                <li>If approved, your item will be published</li>
              </ul>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitAppealMutation.isPending}
              >
                {submitAppealMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Appeal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
