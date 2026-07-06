'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { getEnginePinnedTokenFallbackIconSrc } from '../../../domain/engine-pinned-token-icon';

type EngineWalletTokenIconProps = {
  symbol: string;
  iconUrl: string | null;
};

export function EngineWalletTokenIcon({
  symbol,
  iconUrl,
}: EngineWalletTokenIconProps) {
  const fallbackSrc = getEnginePinnedTokenFallbackIconSrc(symbol);
  const [remoteFailed, setRemoteFailed] = useState(false);

  useEffect(() => {
    setRemoteFailed(false);
  }, [iconUrl, symbol]);

  const remoteSrc = iconUrl && !remoteFailed ? iconUrl : null;
  const src = remoteSrc ?? fallbackSrc;

  if (!src) {
    return (
      <div
        aria-hidden
        className="flex h-full w-full items-center justify-center text-caption text-muted"
      >
        {symbol.slice(0, 1)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover"
      sizes="40px"
      unoptimized={Boolean(remoteSrc)}
      onError={() => {
        if (remoteSrc) {
          setRemoteFailed(true);
        }
      }}
    />
  );
}
