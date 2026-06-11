import { useState } from 'react';

interface ImageViewerProps {
  src: string;
  alt?: string;
}

export function ImageViewer({ src, alt = 'Slide' }: ImageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="flex-1 overflow-auto flex items-start justify-center p-2 bg-gray-950">
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
        </div>
      )}
      {error ? (
        <div className="text-red-400 text-sm p-4">图片加载失败</div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          className={`max-w-full h-auto shadow-lg ${loading ? 'hidden' : 'block'}`}
        />
      )}
    </div>
  );
}
