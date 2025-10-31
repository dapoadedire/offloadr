# UploadThing Integration for Avatar Upload

## What Was Implemented

### 1. **UploadThing Setup**

- Installed `uploadthing` and `@uploadthing/react` packages
- Created FileRouter with two routes:
  - `avatarUploader`: For profile pictures (max 4MB, 1 file)
  - `itemImageUploader`: For marketplace items (max 4MB, 5 files)

### 2. **API Routes Created**

- `/app/api/uploadthing/core.ts`: FileRouter configuration
- `/app/api/uploadthing/route.ts`: Next.js API route handler

### 3. **Utility Functions**

- `/lib/uploadthing.ts`: Upload components and hooks
- `/lib/image-utils.ts`: Image URL validation functions

### 4. **Profile Edit Page Updates**

The edit profile page now supports TWO ways to set an avatar:

#### Option 1: Upload Image File

- Click the camera icon or "Upload Image" button
- Select an image from your device
- File is uploaded to UploadThing cloud storage
- URL is automatically populated

#### Option 2: Paste Image URL

- Click "Use URL" button
- Paste a direct link to an image
- System validates it's a real image URL
- Image must have extension (.jpg, .png, .gif, .webp, etc.)

## Image URL Validation

We validate image URLs in two ways:

### 1. **Synchronous Check** (`isImageUrl`)

- Validates URL format
- Checks for image file extensions

### 2. **Asynchronous Check** (`isValidImageUrl`)

- Same as above, plus:
- Attempts to load the image
- Confirms it's actually an image file

## How to Use in Edit Profile

1. **Upload from device:**

   - Click camera icon on avatar
   - OR click "Upload Image" button
   - Select image file (JPG, PNG, GIF, WebP)
   - Max size: 4MB
   - File uploads to UploadThing
   - Avatar updates automatically

2. **Use existing URL:**
   - Click "Use URL" button
   - Paste image URL (e.g., `https://example.com/avatar.jpg`)
   - Click "Apply"
   - System validates the URL
   - If valid, avatar updates
   - If invalid, shows error

## Environment Variables

Already configured in `/frontend/.env`:

```env
UPLOADTHING_TOKEN='eyJhcGlLZXkiOiJza19...'
```

## Security Notes

- File size limited to 4MB
- Only image types accepted
- URL validation prevents broken images
- Middleware can be updated with real authentication
- Current auth is mocked (see TODO in `core.ts`)

## Next Steps (Optional)

1. ~~**Add authentication:** Update `auth()` function in `/app/api/uploadthing/core.ts`~~ ✅ **COMPLETED** - Now uses real token-based authentication
2. ~~**Delete old avatars:** When user uploads new avatar, delete old one from UploadThing~~ ✅ **COMPLETED** - Automatically deletes old avatar from UploadThing storage
3. **Image cropping:** Add image cropper before upload for better avatar control
4. **More validation:** Add dimension checks (min/max width/height)
5. ~~**Progress indicator:** Show upload progress percentage~~ ✅ **COMPLETED** - Shows real-time upload progress with percentage

## Completed Improvements

### ✅ Real Authentication (Task #1)

- Replaced mock auth with actual token-based authentication
- Middleware now validates user from Authorization header
- Fetches user data from backend API to verify authentication
- Returns null for unauthorized requests

### ✅ Automatic Old Avatar Deletion (Task #2)

- When uploading a new avatar, the old one is automatically deleted
- Only deletes files hosted on UploadThing (`utfs.io`)
- Prevents storage bloat and unnecessary costs
- Gracefully handles errors (upload still succeeds even if deletion fails)

### ✅ Upload Progress Indicator (Task #5)

- Real-time progress bar showing upload percentage
- Visual feedback during upload process
- Button text updates to show current progress
- Progress bar with smooth animations

## Files Modified/Created

### Created:

- `/app/api/uploadthing/core.ts` - FileRouter config
- `/app/api/uploadthing/route.ts` - API route handler
- `/lib/uploadthing.ts` - Upload utilities
- `/lib/image-utils.ts` - Image validation helpers

### Modified:

- `/app/profile/edit/page.tsx` - Added upload + URL input
- `/app/layout.tsx` - Added NextSSRPlugin for better SSR
- `/package.json` - Added uploadthing dependencies

## Testing

1. Go to `/profile/edit`
2. Try uploading an image file
3. Try pasting an image URL
4. Try pasting an invalid URL (should show error)
5. Save profile and check if avatar persists

## Troubleshooting

**Upload fails:**

- Check UPLOADTHING_TOKEN in .env
- Check browser console for errors
- Verify file is under 4MB

**URL validation fails:**

- Make sure URL includes image extension
- Try a different image URL
- Check browser console for CORS issues

**Avatar doesn't save:**

- Make sure to click "Save Changes" after updating avatar
- Check that avatarUrl is included in the form submission
