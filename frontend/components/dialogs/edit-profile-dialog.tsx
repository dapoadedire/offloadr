"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, Link as LinkIcon, Camera } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateProfile } from "@/hooks/useUser";
import { UpdateProfilePayload } from "@/lib/types";
import { useUploadThing } from "@/lib/uploadthing";
import { isValidImageUrl } from "@/lib/image-utils";

const editProfileSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  snapchat: z.string().optional(),
  whatsapp: z.string().optional(),
  avatar_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues: {
    firstname: string;
    lastname: string;
    phone?: string | null;
    snapchat?: string | null;
    whatsapp?: string | null;
    avatar_url?: string | null;
  };
}

export function EditProfileDialog({
  open,
  onOpenChange,
  defaultValues,
}: EditProfileDialogProps) {
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState(
    defaultValues.avatar_url || ""
  );

  const { startUpload } = useUploadThing("avatarUploader", {
    headers: () => {
      // Get token from localStorage and pass it to UploadThing
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      return {
        "x-uploadthing-authorization": token || "",
      };
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const uploadedUrl = res[0].url;
        setPreviewAvatar(uploadedUrl);
        form.setValue("avatar_url", uploadedUrl);
        toast.dismiss(); // Dismiss the loading toast
        toast.success("Avatar uploaded successfully!");
      }
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (error: Error) => {
      toast.dismiss(); // Dismiss the loading toast
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const form = useForm<z.infer<typeof editProfileSchema>>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstname: defaultValues.firstname,
      lastname: defaultValues.lastname,
      phone: defaultValues.phone || "",
      snapchat: defaultValues.snapchat || "",
      whatsapp: defaultValues.whatsapp || "",
      avatar_url: defaultValues.avatar_url || "",
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      toast.error("Image size must be less than 1MB");
      return;
    }

    setIsUploading(true);
    toast.loading("Uploading avatar...");

    try {
      await startUpload([file]);
    } catch {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!avatarUrlInput.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    const loadingToast = toast.loading("Validating image URL...");

    const isValid = await isValidImageUrl(avatarUrlInput);

    toast.dismiss(loadingToast);

    if (!isValid) {
      toast.error("Invalid image URL. Please enter a valid image URL.");
      return;
    }

    setPreviewAvatar(avatarUrlInput);
    form.setValue("avatar_url", avatarUrlInput);
    setAvatarUrlInput("");
    setShowUrlInput(false);
    toast.success("Avatar URL updated!");
  };

  const onSubmit = (data: z.infer<typeof editProfileSchema>) => {
    // Remove empty strings and convert to undefined
    const payload: UpdateProfilePayload = {};
    if (data.firstname) payload.firstname = data.firstname;
    if (data.lastname) payload.lastname = data.lastname;
    if (data.phone) payload.phone = data.phone;
    if (data.snapchat) payload.snapchat = data.snapchat;
    if (data.whatsapp) payload.whatsapp = data.whatsapp;
    if (data.avatar_url) payload.avatar_url = data.avatar_url;

    updateProfile(payload, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center gap-4 pb-4 border-b">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewAvatar} />
                  <AvatarFallback className="text-2xl">
                    {defaultValues.firstname[0]}
                    {defaultValues.lastname[0]}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload-dialog"
                  className={`absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors ${
                    isUploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </label>
                <Input
                  id="avatar-upload-dialog"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading || isPending}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("avatar-upload-dialog")?.click()
                  }
                  disabled={isUploading || isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? `Uploading ${uploadProgress}%` : "Upload"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  disabled={isUploading || isPending}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  {showUrlInput ? "Hide URL" : "Use URL"}
                </Button>
              </div>

              {isUploading && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uploading...</span>
                    <span className="text-muted-foreground">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {showUrlInput && (
                <div className="w-full p-3 border rounded-lg bg-muted/50">
                  <FormLabel className="mb-2 block text-sm">
                    Image URL
                  </FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      className="flex-1"
                      disabled={isPending}
                    />
                    <Button
                      type="button"
                      onClick={handleUrlSubmit}
                      size="sm"
                      disabled={isPending}
                    >
                      Apply
                    </Button>
                  </div>
                  <FormDescription className="mt-2 text-xs">
                    Paste a direct link to an image (max 1MB)
                  </FormDescription>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="snapchat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Snapchat (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="@username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending || isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isUploading}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
