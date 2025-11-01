"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Flag, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateReport } from "@/hooks/useReports";
import {
  ReportType,
  reportTypeLabels,
  reportTypeDescriptions,
} from "@/lib/types/report";

const reportSchema = z.object({
  report_type: z.enum(
    [
      "scam",
      "inappropriate",
      "spam",
      "sold",
      "wrong_category",
      "duplicate",
      "other",
    ],
    {
      message: "Please select a report reason",
    }
  ),
  comment: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  itemTitle: string;
}

export function ReportDialog({
  open,
  onOpenChange,
  itemId,
  itemTitle,
}: ReportDialogProps) {
  const createReportMutation = useCreateReport();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      report_type: undefined,
      comment: "",
    },
  });

  async function onSubmit(data: ReportFormValues) {
    try {
      await createReportMutation.mutateAsync({
        item_id: itemId,
        report_type: data.report_type,
        comment: data.comment || undefined,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Report submission error:", error);
    }
  }

  const reportTypes: ReportType[] = [
    "scam",
    "inappropriate",
    "spam",
    "sold",
    "wrong_category",
    "duplicate",
    "other",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report Item
          </DialogTitle>
          <DialogDescription>
            Reporting &quot;{itemTitle}&quot;. Please help us understand the
            issue.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Report Type Selection */}
            <FormField
              control={form.control}
              name="report_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Reason for Report *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-2"
                    >
                      {reportTypes.map((type) => (
                        <div
                          key={type}
                          className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <RadioGroupItem value={type} id={type} />
                          <label
                            htmlFor={type}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-sm">
                              {reportTypeLabels[type]}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {reportTypeDescriptions[type]}
                            </div>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Comments */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide any additional information that might help us review this report..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any extra context about why you&apos;re reporting this item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning */}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Please report responsibly
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    False reports may result in account restrictions. We take
                    all reports seriously and will review them carefully.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createReportMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createReportMutation.isPending}
                variant="destructive"
              >
                {createReportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
