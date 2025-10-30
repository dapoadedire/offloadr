"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Loader2, Upload, User, Phone, Camera } from "lucide-react"
import { FaWhatsapp, FaSnapchat } from "react-icons/fa"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { users } from "@/lib/dummy-data"

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  snapchat: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function EditProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // In real app, get current user from auth context
  const currentUser = users[0]
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      phone: currentUser.phone || "",
      whatsapp: currentUser.whatsapp || "",
      snapchat: currentUser.snapchat || "",
    },
  })

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string)
      toast.success("Avatar updated! Don't forget to save changes.")
    }
    reader.readAsDataURL(file)
  }

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log("Profile data:", { ...data, avatarUrl })
    toast.success("Profile updated successfully!")
    setIsLoading(false)

    // Redirect to profile
    router.push(`/profile/${currentUser.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your profile information and contact details
          </p>
        </div>

        {/* Avatar Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a profile picture (JPG, PNG up to 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl">
                    {currentUser.firstName[0]}{currentUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Click the camera icon to upload a new profile picture
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Picture
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your name will be visible to other users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
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
                    name="lastName"
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Username: @{currentUser.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Email: {currentUser.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Username and email cannot be changed for security reasons
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Add ways for buyers to reach you. This information will only be shown to interested buyers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="+1 (555) 123-4567" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Optional: Your phone number for buyers to contact you
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FaWhatsapp className="absolute left-3 top-2.5 h-4 w-4 text-green-500" />
                          <Input placeholder="+1 (555) 123-4567" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Optional: Your WhatsApp number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="snapchat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Snapchat</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FaSnapchat className="absolute left-3 top-2.5 h-4 w-4 text-yellow-400" />
                          <Input placeholder="username" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Optional: Your Snapchat username
                      </FormDescription>
                      <FormMessage />
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
                onClick={() => router.push(`/profile/${currentUser.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  )
}
