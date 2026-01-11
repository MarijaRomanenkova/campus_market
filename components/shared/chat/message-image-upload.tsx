'use client';

/**
 * Message Image Upload Component
 * @module Components
 * @group Shared/Chat
 * 
 * This client-side component provides an interface for uploading images in the chat.
 * It uses UploadThing for handling the image uploads.
 */

import { useState } from 'react';
import { UploadButton } from '@/lib/uploadthing';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

/**
 * Props for the MessageImageUpload component
 * @interface MessageImageUploadProps
 * @property {(url: string) => void} onImageUpload - Callback for when an image is uploaded
 * @property {() => void} onCancel - Callback for when the upload is cancelled
 * @property {string|null} currentImage - Currently selected image URL, if any
 */
interface MessageImageUploadProps {
  onImageUpload: (url: string) => void;
  onCancel: () => void;
  currentImage: string | null;
}

/**
 * MessageImageUpload Component
 * 
 * Provides a UI for uploading and previewing images in the chat interface.
 * 
 * @param {MessageImageUploadProps} props - Component properties
 * @returns {JSX.Element} The rendered image upload interface
 */
export default function MessageImageUpload({ 
  onImageUpload, 
  onCancel,
  currentImage 
}: MessageImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="p-2 border rounded-md bg-muted/30">
      {currentImage ? (
        <div className="relative">
          <div className="relative h-48 w-full">
            <Image 
              src={currentImage} 
              alt="Message attachment" 
              className="object-contain rounded-md"
              fill
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center p-4">
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res && res.length > 0) {
                onImageUpload(res[0].url);
                toast({
                  description: 'Image uploaded successfully',
                });
              }
            }}
            onUploadError={(error) => {
              toast({
                variant: 'destructive',
                description: `Error uploading image: ${error.message}`,
              });
            }}
            onUploadBegin={() => setIsUploading(true)}
            appearance={{
              button: "bg-success text-success-foreground hover:bg-success/90 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors",
              allowedContent: "hidden"
            }}
            content={{
              button({ ready }) {
                if (ready) return <span className="flex items-center justify-center gap-2"><ImageIcon className="h-4 w-4" /> Upload</span>;
                return <span>Loading...</span>;
              }
            }}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Max file size: 4MB
          </p>
        </div>
      )}
    </div>
  );
} 
