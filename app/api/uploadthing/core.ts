/**
 * UploadThing Core Configuration
 * @module API
 * @group File Uploads
 * 
 * This module defines the file upload routes and handlers using UploadThing.
 * It configures upload limitations, authentication, and post-upload processing.
 */

import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { auth } from '@/auth';

const f = createUploadthing();

/**
 * File router defining upload endpoints and their configurations
 * 
 * @property {Object} imageUploader - Configuration for image uploads
 * @property {Function} imageUploader.middleware - Authentication check before upload
 * @property {Function} imageUploader.onUploadComplete - Handler called after successful upload
 */
export const ourFileRouter = {
  imageUploader: f({
    image: { maxFileSize: '4MB' },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError('Unauthorized');
      return { userId: session?.user?.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;
export type OurFileRouter = typeof ourFileRouter;
