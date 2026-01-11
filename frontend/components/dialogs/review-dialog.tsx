"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Star } from "lucide-react";

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateReview, useUpdateReview } from "@/hooks/useReviews";
import { Review } from "@/lib/types/user";

const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required").max(5),
  comment: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  itemTitle: string;
  existingReview?: Review | null;
}

export function ReviewDialog({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  existingReview,
}: ReviewDialogProps) {
  const isEditing = !!existingReview;
  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview(existingReview?.id || 0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      comment: existingReview?.comment || "",
    },
  });

  // Update form when existing review changes
  useEffect(() => {
    if (existingReview) {
      form.reset({
        rating: existingReview.rating,
        comment: existingReview.comment || "",
      });
    } else {
      form.reset({
        rating: 0,
        comment: "",
      });
    }
  }, [existingReview, form]);

  async function onSubmit(data: ReviewFormValues) {
    try {
      if (isEditing) {
        await updateReviewMutation.mutateAsync({
          rating: data.rating,
          comment: data.comment || undefined,
        });
      } else {
        await createReviewMutation.mutateAsync({
          item_id: itemId,
          rating: data.rating,
          comment: data.comment || undefined,
        });
      }
      form.reset();
      onOpenChange(false);
    } catch {
      // Error handling is done in the hook
    }
  }

  const isPending = createReviewMutation.isPending || updateReviewMutation.isPending;
  const selectedRating = form.watch("rating");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Review" : "Leave a Review"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update your review for "${itemTitle}"`
              : `Share your experience with "${itemTitle}"`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Star Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          className="transition-all hover:scale-110"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= selectedRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                      {selectedRating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {selectedRating} star{selectedRating !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Click a star to set your rating (1-5)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts about this item and transaction..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your review helps other buyers make informed decisions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || selectedRating === 0}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  <>{isEditing ? "Update Review" : "Submit Review"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
