"use client";



import { useState } from "react";



interface PostMediaProps {

  imageUrl?: string | null;

  videoUrl?: string | null;

  mediaType?: string | null;

  className?: string;

  maxHeight?: string;

  locale?: string;

}



export default function PostMedia({

  imageUrl,

  videoUrl,

  mediaType,

  className = "mt-3 w-full rounded-xl border border-white/5 object-cover max-h-72",

  maxHeight,

  locale = "ar",

}: PostMediaProps) {

  const ar = locale === "ar";

  const [loadFailed, setLoadFailed] = useState(false);

  const style = maxHeight ? { maxHeight } : undefined;

  const type = mediaType ?? (videoUrl ? "video" : imageUrl ? "image" : null);



  if (type === "video" && videoUrl) {

    return (

      <video

        src={videoUrl}

        controls

        playsInline

        className={className.replace("object-cover", "object-contain bg-black/40")}

        style={style}

        onError={() => setLoadFailed(true)}

      />

    );

  }



  if (imageUrl) {

    if (loadFailed) {

      return (

        <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/3 py-8 text-xs text-white/40">

          {ar ? "تعذّر تحميل المرفق" : "Could not load attachment"}

        </div>

      );

    }

    return (

      // eslint-disable-next-line @next/next/no-img-element

      <img

        src={imageUrl}

        alt=""

        className={className}

        style={style}

        onError={() => setLoadFailed(true)}

      />

    );

  }



  return null;

}

