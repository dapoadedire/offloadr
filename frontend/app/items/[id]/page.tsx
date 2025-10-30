"use client";

import { useState } from "react";
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
} from "lucide-react";
import { FaWhatsapp, FaSnapchat } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getItemById, items, reviews } from "@/lib/dummy-data";

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const item = getItemById(params.id);

  if (!item) {
    notFound();
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const itemReviews = reviews
    .filter((r) => r.sellerId === item.seller.id)
    .slice(0, 3);
  const relatedItems = items
    .filter((i) => i.category.id === item.category.id && i.id !== item.id)
    .slice(0, 4);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % item.photos.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + item.photos.length) % item.photos.length
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast.success(
      isFavorited ? "Removed from favorites" : "Added to favorites"
    );
  };

  const handleContactSeller = () => {
    setShowContact(true);
    toast.success("Seller contact information revealed");
  };

  const handleReport = () => {
    toast.success("Item reported. We'll review it shortly.");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/marketplace" className="hover:text-primary">
          Marketplace
        </Link>
        {" / "}
        <Link
          href={`/marketplace?category=${item.category.id}`}
          className="hover:text-primary"
        >
          {item.category.name}
        </Link>
        {" / "}
        <span className="text-foreground">{item.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Carousel */}
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              <motion.img
                key={currentImageIndex}
                src={item.photos[currentImageIndex]}
                alt={`${item.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />

              {item.photos.length > 1 && (
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
                    {item.photos.map((_, index) => (
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
            {item.photos.length > 1 && (
              <div className="grid grid-cols-6 gap-2 p-2">
                {item.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{item.category.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Condition</span>
                <Badge variant="secondary">
                  {item.condition.replace("-", " ")}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{item.location}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">School</span>
                <span className="font-medium">{item.school.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">
                  {item.isNegotiable ? "Negotiable" : "Fixed"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Views</span>
                <span className="font-medium">{item.viewsCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Posted</span>
                <span className="font-medium">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Seller Reviews */}
          {itemReviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Seller Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {itemReviews.map((review) => (
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
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    <Separator />
                  </div>
                ))}
                <Link href={`/profile/${item.seller.id}`}>
                  <Button variant="outline" className="w-full">
                    View all reviews
                  </Button>
                </Link>
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
                  ${item.price.toFixed(2)}
                </div>
                {item.isNegotiable && (
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
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Seller
                </Button>
                <Button
                  size="icon-lg"
                  variant="outline"
                  onClick={handleFavorite}
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

              {showContact && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 p-4 bg-muted/50 rounded-lg"
                >
                  <p className="text-sm font-medium mb-2">
                    Contact Information:
                  </p>
                  {item.seller.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${item.seller.phone}`}
                        className="hover:text-primary"
                      >
                        {item.seller.phone}
                      </a>
                    </div>
                  )}
                  {item.seller.whatsapp && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaWhatsapp className="h-4 w-4 text-green-500" />
                      <a
                        href={`https://wa.me/${item.seller.whatsapp.replace(
                          /[^0-9]/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        {item.seller.whatsapp}
                      </a>
                    </div>
                  )}
                  {item.seller.snapchat && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaSnapchat className="h-4 w-4 text-yellow-400" />
                      <span>{item.seller.snapchat}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/profile/${item.seller.id}`}>
                <div className="flex items-center gap-3 group cursor-pointer">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.seller.avatarUrl} />
                    <AvatarFallback>
                      {item.seller.firstName[0]}
                      {item.seller.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {item.seller.firstName} {item.seller.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{item.seller.username}
                    </p>
                  </div>
                </div>
              </Link>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {item.seller.averageRating.toFixed(1)} (
                      {item.seller.reviewCount})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">School</span>
                  <span className="font-medium">{item.seller.school.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {new Date(item.seller.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Link href={`/profile/${item.seller.id}`}>
                <Button variant="outline" className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

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
            {relatedItems.map((relatedItem) => (
              <Link key={relatedItem.id} href={`/items/${relatedItem.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={relatedItem.photos[0]}
                      alt={relatedItem.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {relatedItem.title}
                    </h3>
                    <p className="text-2xl font-bold text-primary">
                      ${relatedItem.price.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
