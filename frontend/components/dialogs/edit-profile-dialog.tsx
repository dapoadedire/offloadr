"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateProfile } from "@/hooks/useUser";
import { UpdateProfilePayload } from "@/lib/types";

const editProfileSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  snapchat: z.string().optional(),
  whatsapp: z.string().optional(),
  avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      {...field}
                    />
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
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
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
