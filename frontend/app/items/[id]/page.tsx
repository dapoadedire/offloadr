"use client";

import { useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Star,
  User,
  Loader2,
  Mail,
} from "lucide-react";
import { FaWhatsapp, FaSnapchat } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useItem, useRelatedItems, useItemContact } from "@/hooks/useItems";
import { useUserReviews, useUserRating } from "@/hooks/useUser";
import { useCheckFavorite, useToggleFavorite } from "@/hooks/useFavorites";
import { useItemReviews } from "@/hooks/useReviews";
import { useAuthStore } from "@/store/authStore";
import { ReviewDialog } from "@/components/dialogs/review-dialog";
import { ReportDialog } from "@/components/dialogs/report-dialog";

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const itemId = parseInt(id);

  // Fetch item data first
  const { data: item, isLoading, error } = useItem(itemId);

  // Only fetch dependent data if item exists
  const { data: relatedItemsData } = useRelatedItems(itemId, {
    enabled: !!item,
  });
  const { data: sellerReviewsData } = useUserReviews(
    item?.seller?.id || 0,
    1,
    3,
    { enabled: !!item?.seller?.id }
  );
  const { data: sellerRating } = useUserRating(item?.seller?.id || 0, {
    enabled: !!item?.seller?.id,
  });
  const {
    data: contactInfo,
    refetch: fetchContact,
    isFetching: isFetchingContact,
  } = useItemContact(itemId);

  const { data: isFavorited, isLoading: checkingFavorite } = useCheckFavorite(
    itemId,
    { enabled: !!item }
  );
  const { toggle, isPending: togglingFavorite } = useToggleFavorite();

  // Reviews
  const { data: itemReviews, isLoading: loadingReviews } = useItemReviews(
    itemId,
    { enabled: !!item }
  );
  const { user } = useAuthStore();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !item) {
    notFound();
  }

  const relatedItems = relatedItemsData || [];
  const sellerReviews = sellerReviewsData?.data?.slice(0, 3) || [];
  const reviews = itemReviews || [];

  // Check if current user can leave a review
  const userExistingReview = Array.isArray(reviews)
    ? reviews.find((r) => r.buyer_id === user?.id)
    : undefined;
  const canLeaveReview =
    user &&
    item.status === "sold" &&
    item.buyer_id === user.id &&
    item.seller?.id !== user.id;

  const nextImage = () => {
    if (item.photos && item.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % item.photos.length);
    }
  };

  const prevImage = () => {
    if (item.photos && item.photos.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + item.photos.length) % item.photos.length
      );
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleFavorite = () => {
    toggle(itemId, isFavorited || false);
  };

  const handleContactSeller = async () => {
    if (!showContact) {
      await fetchContact();
    }
    setShowContact(true);
  };

  const handleReport = () => {
    setReportDialogOpen(true);
  };

  // Sort photos by position
  const sortedPhotos = item.photos
    ? [...item.photos].sort((a, b) => a.position - b.position)
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/marketplace" className="hover:text-primary">
          Marketplace
        </Link>
        {" / "}
        {item.category && (
          <>
            <Link
              href={`/marketplace?category=${item.category.id}`}
              className="hover:text-primary"
            >
              {item.category.name}
            </Link>
            {" / "}
          </>
        )}
        <span className="text-foreground">{item.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Carousel */}
          <Card className="overflow-hidden">
            {sortedPhotos.length > 0 ? (
              <>
                <div className="relative aspect-square bg-muted">
                  <motion.div
                    key={currentImageIndex}
                    className="w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={sortedPhotos[currentImageIndex].url}
                      alt={`${item.title} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover"
                    />
                  </motion.div>

                  {sortedPhotos.length > 1 && (
                    <>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {sortedPhotos.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex
                                ? "bg-white w-8"
                                : "bg-white/50"
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Grid */}
                {sortedPhotos.length > 1 && (
                  <div className="grid grid-cols-6 gap-2 p-2">
                    {sortedPhotos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? "border-primary"
                            : "border-transparent"
                        }`}
                      >
                        <Image
                          src={photo.url}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">No images available</p>
              </div>
            )}
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">
                {item.description}
              </p>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.category && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{item.category.name}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Condition</span>
                <Badge variant="secondary">
                  {item.condition.replace("_", " ")}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{item.location}</span>
              </div>
              <Separator />
              {item.school && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">School</span>
                    <span className="font-medium">{item.school.name}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">
                  {item.negotiable ? "Negotiable" : "Fixed"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Views</span>
                <span className="font-medium">{item.views_count}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Posted</span>
                <span className="font-medium">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Seller Reviews */}
          {sellerReviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Seller Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sellerReviews.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium">
                      {review.buyer_firstname} {review.buyer_lastname}
                    </p>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    <Separator />
                  </div>
                ))}
                {item.seller && (
                  <Link href={`/profile/${item.seller.id}`}>
                    <Button variant="outline" className="w-full">
                      View all reviews
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Item Reviews */}
          {(reviews.length > 0 || canLeaveReview) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reviews for this Item</CardTitle>
                {canLeaveReview && (
                  <Button
                    onClick={() => setReviewDialogOpen(true)}
                    variant={userExistingReview ? "outline" : "default"}
                    size="sm"
                  >
                    {userExistingReview ? "Edit Review" : "Leave Review"}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingReviews ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {review.buyer_firstname} {review.buyer_lastname}
                        </p>
                        {review.buyer_id === item.buyer_id && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Buyer
                          </Badge>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                      <Separator />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No reviews yet. Be the first to review!
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Pricing and Seller Info */}
        <div className="space-y-6">
          {/* Price and Actions */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="text-4xl font-bold text-primary mb-1">
                  ₦{item.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {item.negotiable && (
                  <p className="text-sm text-muted-foreground">
                    Price is negotiable
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleContactSeller}
                  disabled={isFetchingContact}
                >
                  {isFetchingContact ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  Contact Seller
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleFavorite}
                  disabled={togglingFavorite || checkingFavorite}
                  className="h-11 w-11"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFavorited ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>

              {showContact && contactInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 p-4 bg-muted/50 rounded-lg"
                >
                  <p className="text-sm font-medium mb-2">
                    Contact Information:
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="hover:text-primary"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                  {contactInfo.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="hover:text-primary"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  )}
                  {contactInfo.whatsapp && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaWhatsapp className="h-4 w-4 text-green-500" />
                      <a
                        href={`https://wa.me/${contactInfo.whatsapp.replace(
                          /[^0-9]/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        {contactInfo.whatsapp}
                      </a>
                    </div>
                  )}
                  {contactInfo.snapchat && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaSnapchat className="h-4 w-4 text-yellow-400" />
                      <span>{contactInfo.snapchat}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Seller Info */}
          {item.seller && (
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/profile/${item.seller.id}`}>
                  <div className="flex items-center gap-3 group cursor-pointer">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.seller.avatar_url || undefined} />
                      <AvatarFallback>
                        {item.seller.firstname[0]}
                        {item.seller.lastname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold group-hover:text-primary transition-colors">
                        {item.seller.firstname} {item.seller.lastname}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{item.seller.username}
                      </p>
                    </div>
                  </div>
                </Link>

                <Separator />

                <div className="space-y-2 text-sm">
                  {sellerRating && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {sellerRating.average_rating.toFixed(1)} (
                          {sellerRating.total_reviews})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Link href={`/profile/${item.seller.id}`}>
                  <Button variant="outline" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Report */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={handleReport}
          >
            <Flag className="mr-2 h-4 w-4" />
            Report this listing
          </Button>
        </div>
      </div>

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Similar Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedItems.map((relatedItem) => {
              const relatedPrimaryPhoto =
                relatedItem.photos?.find((p) => p.is_primary) ||
                relatedItem.photos?.[0];
              return (
                <Link key={relatedItem.id} href={`/items/${relatedItem.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {relatedPrimaryPhoto ? (
                        <Image
                          src={relatedPrimaryPhoto.url}
                          alt={relatedItem.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground text-sm">
                            No image
                          </p>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                        {relatedItem.title}
                      </h3>
                      <p className="text-2xl font-bold text-primary">
                        ₦{relatedItem.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        itemId={itemId}
        itemTitle={item.title}
        existingReview={userExistingReview || null}
      />

      {/* Report Dialog */}
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        itemId={itemId}
        itemTitle={item.title}
      />
    </div>
  );
}
