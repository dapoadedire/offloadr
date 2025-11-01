"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Plus,
  Package,
  Eye,
  Heart,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  Archive,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUserItems } from "@/hooks/useUser";
import { useDeleteItem, useMarkAsSold, useUpdateItemStatus } from "@/hooks/useItems";
import { ItemWithDetails } from "@/lib/types";
import { MarkSoldDialog } from "@/components/dialogs/mark-sold-dialog";

export default function MyListingsPage() {
  const { data: itemsData, isLoading } = useCurrentUserItems();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem();
  const { mutate: markAsSold, isPending: isMarkingAsSold } = useMarkAsSold();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateItemStatus();

  // Mark as sold dialog state
  const [markSoldDialogOpen, setMarkSoldDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null);

  // Filter items by status
  const { publishedItems, draftItems, soldItems, archivedItems } = useMemo(() => {
    const myItems = itemsData?.data || [];
    return {
      publishedItems: myItems.filter((item) => item.status === "published"),
      draftItems: myItems.filter((item) => item.status === "draft"),
      soldItems: myItems.filter((item) => item.status === "sold"),
      archivedItems: myItems.filter((item) => item.status === "archived"),
    };
  }, [itemsData?.data]);

  const handleMarkAsSold = (item: ItemWithDetails) => {
    setSelectedItem(item);
    setMarkSoldDialogOpen(true);
  };

  const handleArchive = (itemId: number) => {
    updateStatus({ itemId, payload: { status: "archived" } });
  };

  const handleDelete = (itemId: number) => {
    if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      deleteItem(itemId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = isDeleting || isMarkingAsSold || isUpdatingStatus;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Listings</h1>
            <p className="text-muted-foreground">
              Manage all your items in one place
            </p>
          </div>
          <Link href="/items/new">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Post Item
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="published" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-4">
            <TabsTrigger value="published">
              Active ({publishedItems.length})
            </TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts ({draftItems.length})
            </TabsTrigger>
            <TabsTrigger value="sold">Sold ({soldItems.length})</TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({archivedItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Published Items */}
          <TabsContent value="published" className="mt-6">
            {publishedItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No active listings
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Post an item to start selling
                  </p>
                  <Link href="/items/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Post Item
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    onMarkAsSold={handleMarkAsSold}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    disabled={isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Draft Items */}
          <TabsContent value="drafts" className="mt-6">
            {draftItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No drafts</h3>
                  <p className="text-muted-foreground">
                    All your draft items will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {draftItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    onMarkAsSold={handleMarkAsSold}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    disabled={isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sold Items */}
          <TabsContent value="sold" className="mt-6">
            {soldItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No sold items</h3>
                  <p className="text-muted-foreground">
                    Items you mark as sold will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {soldItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    onMarkAsSold={handleMarkAsSold}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    disabled={isPending}
                    isSold
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Archived Items */}
          <TabsContent value="archived" className="mt-6">
            {archivedItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No archived items
                  </h3>
                  <p className="text-muted-foreground">
                    Archived items will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    onMarkAsSold={handleMarkAsSold}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    disabled={isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Mark as Sold Dialog */}
      {selectedItem && (
        <MarkSoldDialog
          open={markSoldDialogOpen}
          onOpenChange={setMarkSoldDialogOpen}
          itemId={selectedItem.id}
          itemTitle={selectedItem.title}
        />
      )}
    </div>
  );
}

interface ItemCardProps {
  item: ItemWithDetails;
  index: number;
  isSold?: boolean;
  disabled?: boolean;
  onMarkAsSold: (item: ItemWithDetails) => void;
  onArchive: (itemId: number) => void;
  onDelete: (itemId: number) => void;
}

function ItemCard({
  item,
  index,
  onMarkAsSold,
  onArchive,
  onDelete,
  disabled = false,
}: ItemCardProps) {
  const primaryPhoto = item.photos?.find((p) => p.is_primary) || item.photos?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden group">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryPhoto ? (
            <Image
              src={primaryPhoto.url}
              alt={item.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge
              variant={
                item.status === "published"
                  ? "default"
                  : item.status === "sold"
                  ? "default"
                  : "secondary"
              }
              className={
                item.status === "sold"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
            >
              {item.status}
            </Badge>
          </div>
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  disabled={disabled}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/items/${item.id}`}
                    className="w-full cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                {item.status !== "sold" && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/items/${item.id}/edit`}
                      className="w-full cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                {item.status === "published" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onMarkAsSold(item)}
                      disabled={disabled}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Sold
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onArchive(item.id)}
                      disabled={disabled}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(item.id)}
                  disabled={disabled}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {item.title}
          </h3>
          <p className="text-2xl font-bold text-primary mb-2">
            ${item.price.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{item.views_count}</span>
            </div>
            {item.status === "published" && (
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span>0</span>
              </div>
            )}
          </div>
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
