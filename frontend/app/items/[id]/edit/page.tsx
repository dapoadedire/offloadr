"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Loader2, Upload, X, ImagePlus, Trash2, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useItem, useUpdateItem, useDeleteItem } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useUploadThing } from "@/lib/uploadthing";
import { ItemCondition } from "@/lib/types";

const itemSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000),
  price: z.number().min(0, "Price must be greater than 0"),
  category_id: z.number().min(1, "Please select a category"),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]),
  location: z.string().min(1, "Location is required"),
  negotiable: z.boolean(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const itemId = parseInt(id);
  const router = useRouter();

  // Fetch item data
  const { data: item, isLoading: itemLoading, error: itemError } = useItem(itemId);
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Mutations
  const updateItemMutation = useUpdateItem(itemId);
  const deleteItemMutation = useDeleteItem();

  // Image upload state
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { startUpload } = useUploadThing("itemImageUploader", {
    onClientUploadComplete: (res) => {
      const urls = res.map((file) => file.url);
      setUploadedUrls((prev) => [...prev, ...urls]);
      setIsUploading(false);
      toast.dismiss();
      toast.success("Images uploaded successfully!");
    },
    onUploadError: (error: Error) => {
      console.error("Upload error:", error);
      setIsUploading(false);
      toast.dismiss();
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
  });

  // Initialize form and images when item loads
  useEffect(() => {
    if (item) {
      form.reset({
        title: item.title,
        description: item.description,
        price: item.price,
        category_id: item.category_id,
        condition: item.condition,
        location: item.location,
        negotiable: item.negotiable,
      });

      // Sort photos by position and extract URLs
      const sortedPhotos = [...item.photos].sort((a, b) => a.position - b.position);
      setUploadedUrls(sortedPhotos.map((p) => p.url));
    }
  }, [item, form]);

  if (itemLoading || categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (itemError || !item) {
    return notFound();
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      if (file.size > 4 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 4MB`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    if (uploadedUrls.length + validFiles.length > 4) {
      toast.error("Maximum 4 images allowed");
      return;
    }

    // Auto-upload immediately
    setIsUploading(true);
    toast.loading("Uploading images...");

    try {
      await startUpload(validFiles);
    } catch (error) {
      console.error("Upload error:", error);
      toast.dismiss();
      toast.error("Upload failed");
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Image reordering handlers
  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newUrls = [...uploadedUrls];
    const draggedUrl = newUrls[draggedIndex];
    newUrls.splice(draggedIndex, 1);
    newUrls.splice(index, 0, draggedUrl);

    setUploadedUrls(newUrls);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  async function onSubmit(data: ItemFormValues) {
    if (uploadedUrls.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    // Prepare photos array with proper position and primary flag
    const photos = uploadedUrls.map((url, index) => ({
      url,
      position: index,
      is_primary: index === 0, // First image is always primary
    }));

    const payload = {
      ...data,
      photos,
    };

    try {
      await updateItemMutation.mutateAsync(payload);
      router.push(`/items/${itemId}`);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Update error:", error);
    }
  }

  async function handleDelete() {
    try {
      await deleteItemMutation.mutateAsync(itemId);
      router.push("/my-listings");
    } catch (error) {
      // Error handling is done in the hook
      console.error("Delete error:", error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Edit Item</h1>
            <p className="text-muted-foreground">Update your listing details</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Item</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this item? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteItemMutation.isPending}
                >
                  {deleteItemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>
                  Upload up to 4 photos. Drag to reorder - first photo will be the cover image.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDraggingFile
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25"
                  }`}
                  onDragOver={handleFileDragOver}
                  onDragLeave={handleFileDragLeave}
                  onDrop={handleFileDrop}
                >
                  <ImagePlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop images here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PNG, JPG up to 4MB (max 4 images)
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={isUploading || uploadedUrls.length >= 4}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                    disabled={isUploading || uploadedUrls.length >= 4}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Files
                      </>
                    )}
                  </Button>
                </div>

                {uploadedUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    {uploadedUrls.map((url, index) => (
                      <motion.div
                        key={url}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: draggedIndex === index ? 0.5 : 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative aspect-square rounded-lg overflow-hidden group cursor-move"
                        draggable
                        onDragStart={() => handleImageDragStart(index)}
                        onDragOver={(e) => handleImageDragOver(e, index)}
                        onDragEnd={handleImageDragEnd}
                      >
                        <Image
                          src={url}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2 flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="MacBook Pro 14 inch M3 Pro"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A clear, descriptive title helps buyers find your item
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your item in detail. Include condition, features, reason for selling, etc."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/1000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100.00"
                            step="0.01"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="like_new">Like New</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Dorm 5, Room 301" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="negotiable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Price is negotiable</FormLabel>
                        <FormDescription>
                          Allow buyers to make offers
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/items/${itemId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateItemMutation.isPending || isUploading}
              >
                {updateItemMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Item"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
