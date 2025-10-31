import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Simulate auth - in production, get from session/JWT
const auth = () => {
  // TODO: Replace with actual auth check
  return { id: "user-123" };
};

export const ourFileRouter = {
  // Avatar upload route
  avatarUploader: f({
    image: {
      maxFileSize: "1MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const user = await auth();

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url:", file.url);

      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Item images upload route (for marketplace items)
  itemImageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5, // Allow up to 5 images per item
    },
  })
    .middleware(async () => {
      const user = await auth();

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Item image upload complete for userId:", metadata.userId);
      console.log("file url:", file.url);

      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
