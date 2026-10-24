import React, { useState } from 'react';

/** A small photo. The file is full resolution so the thumbnail stays sharp. */
export const StillThumb: React.FC<{ src: string }> = ({ src }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="h-11 w-11 shrink-0 rounded-xl bg-o1-well" aria-hidden="true" />;
  }
  return (
    <img
      src={src}
      alt=""
      width={256}
      height={256}
      loading="lazy"
      decoding="async"
      className="h-11 w-11 shrink-0 rounded-xl object-cover object-center"
      onError={() => setFailed(true)}
    />
  );
};
