"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, X, Heart, MapPin, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { items, categories, schools, type Item } from "@/lib/dummy-data";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (item) => item.category.id === selectedCategory
      );
    }

    // School filter
    if (selectedSchool !== "all") {
      filtered = filtered.filter((item) => item.school?.id === selectedSchool);
    }

    // Condition filter
    if (selectedCondition !== "all") {
      filtered = filtered.filter(
        (item) => item.condition === selectedCondition
      );
    }

    // Price range filter
    if (priceRange !== "all") {
      filtered = filtered.filter((item) => {
        switch (priceRange) {
          case "under-50":
            return item.price < 50;
          case "50-100":
            return item.price >= 50 && item.price <= 100;
          case "100-500":
            return item.price >= 100 && item.price <= 500;
          case "over-500":
            return item.price > 500;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "popular":
          return b.viewsCount - a.viewsCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    searchQuery,
    selectedCategory,
    selectedSchool,
    selectedCondition,
    priceRange,
    sortBy,
  ]);

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedSchool !== "all",
    selectedCondition !== "all",
    priceRange !== "all",
  ].filter(Boolean).length;

  function clearAllFilters() {
    setSelectedCategory("all");
    setSelectedSchool("all");
    setSelectedCondition("all");
    setPriceRange("all");
    setSearchQuery("");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
        <p className="text-muted-foreground">
          Browse {items.length} items from students across campuses
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* School Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">School</label>
                      <Select
                        value={selectedSchool}
                        onValueChange={setSelectedSchool}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Schools" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Schools</SelectItem>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Condition Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Condition</label>
                      <Select
                        value={selectedCondition}
                        onValueChange={setSelectedCondition}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Conditions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Conditions</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="like-new">Like New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price Range</label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Prices" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Prices</SelectItem>
                          <SelectItem value="under-50">Under $50</SelectItem>
                          <SelectItem value="50-100">$50 - $100</SelectItem>
                          <SelectItem value="100-500">$100 - $500</SelectItem>
                          <SelectItem value="over-500">Over $500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <>
                      <Separator className="my-4" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="w-full sm:w-auto"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear all filters
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {filteredAndSortedItems.length}{" "}
        {filteredAndSortedItems.length === 1 ? "item" : "items"} found
      </div>

      {/* Items Grid */}
      {filteredAndSortedItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="rounded-full bg-muted w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters
          </p>
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredAndSortedItems.map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ItemCard({ item, index }: { item: Item; index: number }) {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/items/${item.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={item.photos[0]}
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
                setIsFavorited(!isFavorited);
              }}
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorited ? "fill-red-500 text-red-500" : ""
                }`}
              />
            </Button>
            <div className="absolute bottom-2 left-2 flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {item.condition.replace("-", " ")}
              </Badge>
              {item.isNegotiable && (
                <Badge variant="outline" className="text-xs bg-background/80">
                  Negotiable
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
              <span className="line-clamp-1">
                {item.school?.name || item.location}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{item.viewsCount}</span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
