'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const DEFAULT_COVER = '/fazenda_sol_nascente.png';

type Props = {
  farmId: string;
  token: string;
  coverImage?: string | null;
  previewSrc?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

function directCoverSource(value?: string | null) {
  if (!value) return DEFAULT_COVER;
  if (value.startsWith('data:image/') || value.startsWith('/')) return value;
  if (value.startsWith('fazenda_')) return `/${value}`;
  return DEFAULT_COVER;
}

export default function FarmCoverImage({
  farmId,
  token,
  coverImage,
  previewSrc,
  alt,
  width,
  height,
  className,
}: Props) {
  const [source, setSource] = useState(previewSrc ?? directCoverSource(coverImage));

  useEffect(() => {
    if (previewSrc) {
      setSource(previewSrc);
      return;
    }
    if (!coverImage?.startsWith('farm-covers/')) {
      setSource(directCoverSource(coverImage));
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;
    setSource(DEFAULT_COVER);
    fetch(`${API_URL}/farms/${encodeURIComponent(farmId)}/cover`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar a capa.');
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSource(DEFAULT_COVER);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [coverImage, farmId, previewSrc, token]);

  return (
    <Image
      src={source}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className={className}
    />
  );
}
