import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { UTApi } from "uploadthing/server";

const f = createUploadthing();
const utapi = new UTApi();

// Real authentication using token from headers
const auth = async (req: Request) => {
  // UploadThing passes custom headers from the client
  // We need to get the token from the x-uploadthing-* headers or cookies
  const authHeader = req.headers.get("authorization");
  const customAuthHeader = req.headers.get("x-uploadthing-authorization");

  const token = customAuthHeader || authHeader?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    // Fetch user data from backend API using the token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return { id: user.id, avatar_url: user.avatar_url };
  } catch {
    return null;
  }
};

export const ourFileRouter = {
  // Avatar upload route
  avatarUploader: f({
    image: {
      maxFileSize: "1MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id, oldAvatarUrl: user.avatar_url };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      // Delete old avatar if it exists and is from UploadThing
      if (metadata.oldAvatarUrl && metadata.oldAvatarUrl.includes("utfs.io")) {
        try {
          // Extract file key from URL
          const urlParts = metadata.oldAvatarUrl.split("/");
          const fileKey = urlParts[urlParts.length - 1];

          await utapi.deleteFiles(fileKey);
        } catch {
          // Don't throw error, upload was successful
        }
      }

      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Item images upload route (for marketplace items)
  itemImageUploader: f({
    image: {
      maxFileSize: "1MB",
      maxFileCount: 4, // Allow up to 4 images per item
    },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
