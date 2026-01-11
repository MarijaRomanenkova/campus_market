/**
 * UploadThing API Route
 * @module API
 * @group File Uploads
 * 
 * This API endpoint handles file upload requests via UploadThing.
 * It creates the necessary route handlers for GET and POST operations
 * by connecting to the file router defined in core.ts.
 */

import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

/**
 * Exported GET and POST handlers for the UploadThing route
 * 
 * These handlers automatically manage file uploads, including:
 * - Generating presigned URLs for direct client uploads
 * - Processing upload metadata
 * - Executing post-upload callbacks
 */
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
