"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { motion } from "motion/react"
import { Calendar, MapPin, Star, Edit, Package, MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserById, getItemsBySeller, reviews } from "@/lib/dummy-data"

export default function ProfilePage({ params }: { params: { id: string } }) {
  const user = getUserById(params.id)
  const isOwnProfile = false // In real app, check if logged-in user matches

  if (!user) {
    notFound()
  }

  const userItems = getItemsBySeller(user.id)
  const userReviews = reviews.filter(r => r.sellerId === user.id)

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
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">
                    {user.firstName} {user.lastName}
                  </h1>
                  {user.emailVerified && (
                    <Badge variant="success" className="w-fit mx-auto sm:mx-0">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">@{user.username}</p>

                {/* Stats */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{user.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">
                      ({user.reviewCount} reviews)
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
                    <span>{user.school.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Link href="/profile/edit">
                    <Button>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <Button>
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
            <TabsTrigger value="listings">Listings ({userItems.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({userReviews.length})</TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            {userItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
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
                {userItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link href={`/items/${item.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <img
                            src={item.photos[0]}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
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
            {userReviews.length === 0 ? (
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
                {userReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
