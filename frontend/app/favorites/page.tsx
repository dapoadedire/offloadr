"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Heart, X, MapPin, Eye, Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFavorites, useRemoveFavorite } from "@/hooks/useFavorites";
import { ItemWithDetails, ItemCondition } from "@/lib/types";

export default function FavoritesPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { data: favoritesData, isLoading, error } = useFavorites(1, 50);
  const removeFavoriteMutation = useRemoveFavorite();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const favoriteItems = useMemo(
    () => favoritesData?.data || [],
    [favoritesData?.data]
  );

  const filteredItems = useMemo(() => {
    return favoriteItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "available" && item.status === "published") ||
        (filterStatus === "sold" && item.status === "sold");

      return matchesSearch && matchesStatus;
    });
  }, [favoriteItems, searchQuery, filterStatus]);

  const removeFavorite = (itemId: number) => {
    removeFavoriteMutation.mutate(itemId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-4xl font-bold">My Favorites</h1>
          </div>
          <p className="text-muted-foreground">
            {isLoading
              ? "Loading favorites..."
              : `Items you've saved for later (${favoriteItems.length})`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Error loading favorites
            </h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && favoriteItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent className="py-16 text-center">
                <div className="rounded-full bg-muted w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  No favorites yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start browsing the marketplace and save items you&apos;re
                  interested in. They&apos;ll appear here for easy access.
                </p>
                <Link href="/marketplace">
                  <Button size="lg">Browse Marketplace</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search and Filter */}
        {!isLoading && !error && favoriteItems.length > 0 && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search favorites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* No Search Results */}
            {filteredItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="rounded-full bg-muted w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No items found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </motion.div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-4 text-sm text-muted-foreground">
                  {filteredItems.length}{" "}
                  {filteredItems.length === 1 ? "item" : "items"}
                </div>

                {/* Items Grid */}
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredItems.map((item, index) => (
                      <FavoriteItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        onRemove={removeFavorite}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

interface FavoriteItemCardProps {
  item: ItemWithDetails;
  index: number;
  onRemove: (id: number) => void;
}

function FavoriteItemCard({ item, index, onRemove }: FavoriteItemCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(item.id);
    }, 300);
  };

  // Get primary photo or first photo
  const primaryPhoto =
    item.photos?.find((p) => p.is_primary) || item.photos?.[0];
  const photoUrl = primaryPhoto?.url || "/placeholder-image.jpg";

  const conditionDisplayName = (condition: ItemCondition) => {
    return condition.replace("_", " ");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isRemoving ? 0 : 1,
        y: 0,
        scale: isRemoving ? 0.9 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/items/${item.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={photoUrl}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-2 left-2 flex gap-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {conditionDisplayName(item.condition)}
              </Badge>
              {item.status === "sold" && (
                <Badge variant="destructive" className="text-xs">
                  Sold
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-2xl font-bold text-primary mb-2">
              ${item.price.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>
          </CardContent>

          <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{item.school?.name || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{item.views_count}</span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
