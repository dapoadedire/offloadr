"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Star,
  Edit,
  Package,
  MessageCircle,
  Loader2,
  Settings,
  Lock,
  ChevronDown,
  Phone,
  Mail,
} from "lucide-react";
import { FaWhatsapp, FaSnapchat } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import {
  useUserProfile,
  useUserRating,
  useUserItems,
  useUserReviews,
  useCurrentUser,
} from "@/hooks/useUser";
import { ItemWithDetails, Review } from "@/lib/types";
import { EditProfileDialog } from "@/components/dialogs/edit-profile-dialog";
import { ChangePasswordDialog } from "@/components/dialogs/change-password-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const userId = parseInt(id);
  const { user: currentUser } = useAuthStore();

  const isOwnProfile = currentUser?.id === userId;

  // Fetch user data
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUserProfile(userId);
  const { data: currentUserProfile } = useCurrentUser();
  const { data: rating } = useUserRating(userId);
  const { data: itemsData, isLoading: itemsLoading } = useUserItems(userId);
  const { data: reviewsData, isLoading: reviewsLoading } =
    useUserReviews(userId);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (userError || !user) {
    notFound();
  }

  const userItems = Array.isArray(itemsData?.data) ? itemsData.data : [];
  const userReviews = Array.isArray(reviewsData?.data) ? reviewsData.data : [];

  // Use currentUserProfile for own profile to get all contact details
  const displayUser =
    isOwnProfile && currentUserProfile ? currentUserProfile : user;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24">
                <AvatarImage src={displayUser.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {displayUser.firstname[0]}
                  {displayUser.lastname[0]}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">
                    {displayUser.firstname} {displayUser.lastname}
                  </h1>
                  <Badge
                    variant="default"
                    className="w-fit mx-auto sm:mx-0 bg-green-600 hover:bg-green-700"
                  >
                    Verified
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  @{displayUser.username}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {rating?.average_rating
                        ? rating.average_rating.toFixed(1)
                        : "0.0"}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({rating?.total_reviews || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{userItems.length}</span>
                    <span className="text-muted-foreground text-sm">items</span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{displayUser.school.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined{" "}
                      {new Date(
                        isOwnProfile && currentUserProfile
                          ? currentUserProfile.created_at
                          : user.joined_at
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Contact Details - Only show for own profile or if user has set them */}
                {(isOwnProfile ||
                  displayUser.phone ||
                  displayUser.whatsapp ||
                  displayUser.snapchat) && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold mb-2">
                      Contact Information
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm">
                      {displayUser.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{displayUser.phone}</span>
                        </div>
                      )}
                      {displayUser.whatsapp && (
                        <div className="flex items-center gap-2 text-green-600">
                          <FaWhatsapp className="h-4 w-4" />
                          <span>{displayUser.whatsapp}</span>
                        </div>
                      )}
                      {displayUser.snapchat && (
                        <div className="flex items-center gap-2 text-yellow-500">
                          <FaSnapchat className="h-4 w-4" />
                          <span>{displayUser.snapchat}</span>
                        </div>
                      )}
                      {isOwnProfile && displayUser.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{displayUser.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => setEditProfileOpen(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setChangePasswordOpen(true)}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Change Password
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button onClick={() => setContactDialogOpen(true)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="listings">
              Listings ({userItems.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({userReviews.length})
            </TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            {itemsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No listings yet
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "Start selling by posting your first item"
                      : "This user hasn't posted any items yet"}
                  </p>
                  {isOwnProfile && (
                    <Link href="/items/new">
                      <Button className="mt-4">Post an Item</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userItems.map((item: ItemWithDetails, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link href={`/items/${item.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          {item.photos && item.photos[0] && (
                            <Image
                              src={item.photos[0].url}
                              alt={item.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-2xl font-bold text-primary">
                            ${item.price.toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            {reviewsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userReviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "Complete your first sale to start receiving reviews"
                      : "This user hasn't received any reviews yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userReviews.map((review: Review, index: number) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm font-medium">
                              {review.buyer_firstname} {review.buyer_lastname}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{review.buyer_username}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground mt-2">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Item: {review.item_title}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialogs */}
      {isOwnProfile && currentUserProfile && (
        <>
          <EditProfileDialog
            open={editProfileOpen}
            onOpenChange={setEditProfileOpen}
            defaultValues={{
              firstname: currentUserProfile.firstname,
              lastname: currentUserProfile.lastname,
              phone: currentUserProfile.phone,
              snapchat: currentUserProfile.snapchat,
              whatsapp: currentUserProfile.whatsapp,
              avatar_url: currentUserProfile.avatar_url,
            }}
          />
          <ChangePasswordDialog
            open={changePasswordOpen}
            onOpenChange={setChangePasswordOpen}
          />
        </>
      )}

      {/* Contact Dialog for other users' profiles */}
      {!isOwnProfile && (
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Contact {displayUser.firstname}</DialogTitle>
              <DialogDescription>
                Here are the available contact methods for this seller.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {displayUser.phone && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {displayUser.phone}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(displayUser.phone!);
                      toast.success("Phone number copied!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              )}
              {displayUser.whatsapp && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FaWhatsapp className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      {displayUser.whatsapp}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open(
                        `https://wa.me/${displayUser.whatsapp!.replace(
                          /\D/g,
                          ""
                        )}`,
                        "_blank"
                      );
                    }}
                  >
                    Chat
                  </Button>
                </div>
              )}
              {displayUser.snapchat && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FaSnapchat className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Snapchat</p>
                    <p className="text-sm text-muted-foreground">
                      {displayUser.snapchat}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(displayUser.snapchat!);
                      toast.success("Snapchat username copied!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              )}
              {!displayUser.phone &&
                !displayUser.whatsapp &&
                !displayUser.snapchat && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      This seller hasn&apos;t added any contact information yet.
                    </p>
                  </div>
                )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
