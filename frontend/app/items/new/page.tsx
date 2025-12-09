"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Loader2, X, ImagePlus, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/useRequireAuth";
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
import { useCategories } from "@/hooks/useCategories";
import { useCreateItem } from "@/hooks/useItems";
import { useUploadThing } from "@/lib/uploadthing";
import { ItemCondition } from "@/lib/types";

const itemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  category_id: z.number().min(1, "Please select a category"),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]),
  location: z.string().min(2, "Location is required").max(255),
  negotiable: z.boolean(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface UploadingImage {
  id: string;
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export default function NewItemPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { mutate: createItem, isPending: isCreating } = useCreateItem();
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const { startUpload } = useUploadThing("itemImageUploader", {
    headers: () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      return {
        "x-uploadthing-authorization": token || "",
      };
    },
  });

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      category_id: 0,
      condition: "good",
      location: "",
      negotiable: true,
    },
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const totalImages = uploadedUrls.length + uploadingImages.length;

    // Validate files
    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > 1 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 1MB`);
        continue;
      }

      if (totalImages + validFiles.length >= 4) {
        toast.error("Maximum 4 images allowed");
        break;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Process each file individually in the background
    validFiles.forEach((file) => {
      uploadSingleFile(file);
    });
  };

  const uploadSingleFile = async (file: File) => {
    const uploadId = `${Date.now()}-${Math.random()}`;

    // Add to uploading queue
    const newUploadingImage: UploadingImage = {
      id: uploadId,
      file,
      progress: 0,
    };

    setUploadingImages((prev) => [...prev, newUploadingImage]);

    try {
      // Simulate progress updates (UploadThing doesn't provide granular progress)
      const progressInterval = setInterval(() => {
        setUploadingImages((prev) =>
          prev.map((img) =>
            img.id === uploadId && img.progress < 90
              ? { ...img, progress: img.progress + 10 }
              : img
          )
        );
      }, 200);

      const res = await startUpload([file]);
      clearInterval(progressInterval);

      if (res && res[0]) {
        // Update to 100% and mark as complete
        setUploadingImages((prev) =>
          prev.map((img) =>
            img.id === uploadId
              ? { ...img, progress: 100, url: res[0].url }
              : img
          )
        );

        // Move to uploaded list after a brief moment
        setTimeout(() => {
          setUploadedUrls((prev) => [...prev, res[0].url]);
          setUploadingImages((prev) =>
            prev.filter((img) => img.id !== uploadId)
          );
          toast.success(`${file.name} uploaded!`);
        }, 300);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadingImages((prev) =>
        prev.map((img) =>
          img.id === uploadId
            ? {
                ...img,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : img
        )
      );
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const removeImage = (index: number) => {
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const cancelUpload = (uploadId: string) => {
    setUploadingImages((prev) => prev.filter((img) => img.id !== uploadId));
    toast.info("Upload cancelled");
  };

  const retryUpload = (uploadId: string) => {
    const uploadingImage = uploadingImages.find((img) => img.id === uploadId);
    if (uploadingImage) {
      setUploadingImages((prev) => prev.filter((img) => img.id !== uploadId));
      uploadSingleFile(uploadingImage.file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
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

  async function onSubmit(data: ItemFormValues, status: "draft" | "published") {
    if (uploadingImages.length > 0) {
      toast.error("Please wait for all images to finish uploading");
      return;
    }

    if (uploadedUrls.length === 0 && status === "published") {
      toast.error("Please upload at least one image before publishing");
      return;
    }

    // Prepare photos array with proper position based on current order
    const photos = uploadedUrls.map((url, index) => ({
      url,
      position: index,
      is_primary: index === 0, // First image is always primary
    }));

    createItem({
      title: data.title,
      description: data.description,
      price: data.price,
      condition: data.condition as ItemCondition,
      category_id: data.category_id,
      negotiable: data.negotiable,
      location: data.location,
      status,
      photos,
    });
  }

  const isLoading = isCreating || categoriesLoading;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2">Post an Item</h1>
        <p className="text-muted-foreground mb-8">
          Fill in the details below to list your item on the marketplace
        </p>

        <Form {...form}>
          <form className="space-y-8">
            {/* Photos Section */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>
                  Upload up to 4 photos (max 1MB each). Drag to reorder - first
                  image is the primary photo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Upload Dropzone */}
                {uploadedUrls.length + uploadingImages.length < 4 && (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop images here, or click to select files
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                      id="file-input"
                      disabled={
                        uploadedUrls.length + uploadingImages.length >= 4
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-input")?.click()
                      }
                      disabled={
                        uploadedUrls.length + uploadingImages.length >= 4
                      }
                    >
                      Select Files
                    </Button>
                  </div>
                )}

                {/* Uploading Images with Individual Progress */}
                {uploadingImages.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Uploading...</p>
                    {uploadingImages.map((upload) => (
                      <div
                        key={upload.id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary" />
                            <span className="text-sm truncate">
                              {upload.file.name}
                            </span>
                          </div>
                          {upload.error ? (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => retryUpload(upload.id)}
                              >
                                Retry
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelUpload(upload.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => cancelUpload(upload.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {upload.error ? (
                          <p className="text-xs text-destructive">
                            {upload.error}
                          </p>
                        ) : (
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-300"
                              style={{ width: `${upload.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Uploaded Images Grid - Draggable */}
                {uploadedUrls.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Drag images to reorder. First image is the primary photo.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedUrls.map((url, index) => (
                        <div
                          key={url}
                          draggable={uploadingImages.length === 0}
                          onDragStart={() => handleImageDragStart(index)}
                          onDragOver={(e) => handleImageDragOver(e, index)}
                          onDragEnd={handleImageDragEnd}
                          className={`relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-move ${
                            draggedIndex === index ? "opacity-50" : ""
                          }`}
                        >
                          <Image
                            src={url}
                            alt={`Upload ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {/* Primary Badge */}
                          {index === 0 && (
                            <div className="absolute top-2 left-2">
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                Primary
                              </span>
                            </div>
                          )}
                          {/* Drag Handle */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-background/80 p-1 rounded">
                              <GripVertical className="h-4 w-4" />
                            </div>
                          </div>
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute bottom-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={uploadingImages.length > 0}
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {/* Position Number */}
                          <div className="absolute bottom-2 left-2 bg-background/80 text-xs px-2 py-1 rounded">
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <CardDescription>
                  Provide accurate information about your item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., iPhone 13 Pro" {...field} />
                      </FormControl>
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
                          placeholder="Describe your item in detail..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include condition, features, and any important details
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₦)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50000.00"
                            {...field}
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
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value ? field.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                          <Input
                            placeholder="e.g., Awo Hall, Block 7, Room 204"
                            {...field}
                          />
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
                          Buyers can make offers on your item
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading || uploadingImages.length > 0}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit((data) => onSubmit(data, "draft"))}
                disabled={isLoading || uploadingImages.length > 0}
              >
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit((data) =>
                  onSubmit(data, "published")
                )}
                disabled={isLoading || uploadingImages.length > 0}
              >
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Publish Item
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
