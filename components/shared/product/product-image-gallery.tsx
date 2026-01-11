'use client';

import Image from 'next/image';
import { useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from 'react';

interface ProductImageGalleryProps {
  images: string[];
}

export default function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('select', () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();
  const scrollTo = (index: number) => emblaApi?.scrollTo(index);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Main Image Carousel */}
      <div className="relative rounded-lg overflow-hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {images.map((image, index) => (
              <div 
                key={index} 
                className="relative flex-[0_0_100%] min-w-0"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={image}
                    alt={`Product image ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/70 hover:bg-white"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/70 hover:bg-white"
          onClick={scrollNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "relative flex-shrink-0 cursor-pointer overflow-hidden rounded-md transition-all",
                "ring-1 ring-gray-200 hover:ring-gray-300",
                selectedIndex === index && "ring-2 ring-primary"
              )}
              style={{ width: '70px', height: '52px' }}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="70px"
              />
            </button>
          ))}
          {images.length > 4 && (
            <div 
              className="relative flex-shrink-0 rounded-md bg-muted flex items-center justify-center text-sm text-muted-foreground ring-1 ring-gray-200" 
              style={{ width: '70px', height: '52px' }}
            >
              +{images.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
