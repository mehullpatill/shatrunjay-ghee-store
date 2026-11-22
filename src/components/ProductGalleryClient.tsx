"use client";
import { useState } from "react";

interface GalleryImage { id: string; url: string; alt: string | null; }

export default function ProductGalleryClient({ productName, images, fallbackImage }: { productName: string; images: GalleryImage[]; fallbackImage: string }) {
  const [activeImage, setActiveImage] = useState(images[0]?.url || fallbackImage);
  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-3xl border border-line bg-butter p-8">
        <img src={activeImage} alt={productName} className="pack h-full w-full object-contain" />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img) => (
            <button key={img.id} type="button" onClick={() => setActiveImage(img.url)} aria-label={`View ${img.alt || productName}`} aria-pressed={activeImage === img.url} className={`aspect-square overflow-hidden rounded-2xl border bg-butter p-2 ${activeImage === img.url ? "border-maroon ring-1 ring-maroon" : "border-line"}`}>
              <img src={img.url} alt={img.alt || productName} className="h-full w-full rounded-xl object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
