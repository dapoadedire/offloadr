"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMarkItemAsSold } from "@/hooks/useItems";

const markSoldSchema = z.object({
  buyer_identifier: z.string().optional(),
});

type MarkSoldFormValues = z.infer<typeof markSoldSchema>;

interface MarkSoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  itemTitle: string;
}

export function MarkSoldDialog({
  open,
  onOpenChange,
  itemId,
  itemTitle,
}: MarkSoldDialogProps) {
  const markSoldMutation = useMarkItemAsSold(itemId);

  const form = useForm<MarkSoldFormValues>({
    resolver: zodResolver(markSoldSchema),
    defaultValues: {
      buyer_identifier: "",
    },
  });

  async function onSubmit() {
    try {
      // TODO: Convert buyer_identifier to buyer_id when user lookup is implemented
      await markSoldMutation.mutateAsync({
        // buyer_id: undefined, // Optional buyer_id field
      });
      form.reset();
      onOpenChange(false);
    } catch {
      // Error handling is done in the hook
    }
  }

  function handleSkip() {
    form.setValue("buyer_identifier", "");
    form.handleSubmit(onSubmit)();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark Item as Sold</DialogTitle>
          <DialogDescription>
            Marking &quot;{itemTitle}&quot; as sold. This will remove it from
            active listings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="buyer_identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who bought this item? (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter buyer's username or email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    If you provide the buyer&apos;s username or email,
                    they&apos;ll be able to leave a review for this transaction.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">What happens next?</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Item will be marked as &quot;Sold&quot;</li>
                    <li>• Removed from active marketplace listings</li>
                    <li>
                      • Still visible in your &quot;Sold Items&quot; history
                    </li>
                    <li>• Buyer can leave a review (if identified)</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={markSoldMutation.isPending}
              >
                Skip & Mark Sold
              </Button>
              <Button type="submit" disabled={markSoldMutation.isPending}>
                {markSoldMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Sale"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
