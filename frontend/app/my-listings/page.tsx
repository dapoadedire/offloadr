"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Plus, Package, Eye, Heart, Edit, Trash2, MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { items, users } from "@/lib/dummy-data"

export default function MyListingsPage() {
  // In real app, get current user from auth context
  const currentUser = users[0]
  const myItems = items.filter(item => item.seller.id === currentUser.id)

  const publishedItems = myItems.filter(item => item.status === "published")
  const draftItems = myItems.filter(item => item.status === "draft")
  const soldItems = myItems.filter(item => item.status === "sold")
  const archivedItems = myItems.filter(item => item.status === "archived")

  const handleMarkAsSold = () => {
    toast.success("Item marked as sold")
  }

  const handleDelete = () => {
    toast.success("Item deleted")
  }

  const handleArchive = () => {
    toast.success("Item archived")
  }

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
            <TabsTrigger value="sold">
              Sold ({soldItems.length})
            </TabsTrigger>
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
                  <h3 className="text-lg font-semibold mb-2">No active listings</h3>
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
                  <h3 className="text-lg font-semibold mb-2">No archived items</h3>
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
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

interface ItemCardProps {
  item: {
    id: string
    title: string
    description: string
    price: number
    photos: string[]
    status: string
    viewsCount: number
    favoritesCount: number
    createdAt: string
  }
  index: number
  isSold?: boolean
  onMarkAsSold: () => void
  onArchive: () => void
  onDelete: () => void
}

function ItemCard({ item, index, onMarkAsSold, onArchive, onDelete }: ItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden group">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={item.photos[0]}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2">
            <Badge
              variant={
                item.status === "published"
                  ? "default"
                  : item.status === "sold"
                  ? "success"
                  : "secondary"
              }
            >
              {item.status}
            </Badge>
          </div>
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="secondary" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/items/${item.id}`} className="w-full cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                {item.status !== "sold" && (
                  <DropdownMenuItem asChild>
                    <Link href={`/items/${item.id}/edit`} className="w-full cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                {item.status === "published" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onMarkAsSold}>
                      Mark as Sold
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onArchive}>
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
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
              <span>{item.viewsCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{item.favoritesCount}</span>
            </div>
          </div>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
