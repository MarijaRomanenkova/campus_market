/**
 * UploadThing Integration Module
 * @module Lib/UploadThing
 * 
 * This module exports reusable UI components for file uploads using the UploadThing service.
 * It provides both button and dropzone interfaces for file uploading that are properly typed
 * to work with the application's file router configuration.
 */

import {
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/react';

import type { OurFileRouter } from '@/app/api/uploadthing/core';

/**
 * Upload Button Component
 * 
 * A button component that opens the UploadThing file selector.
 * Properly typed to work with the application's file router configuration.
 */
export const UploadButton = generateUploadButton<OurFileRouter>();

/**
 * Upload Dropzone Component
 * 
 * A dropzone component that allows files to be dragged and dropped for upload.
 * Properly typed to work with the application's file router configuration.
 */
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
