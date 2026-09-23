import React, { useState } from 'react';
import { UserRound } from 'lucide-react';

interface CharacterPortraitProps {
  character: 'akim' | 'advisor-social' | 'advisor-transport' | 'advisor-environment';
  alt: string;
}

export const CharacterPortrait = ({ character, alt }: CharacterPortraitProps) => {
  const [attempt, setAttempt] = useState(0);
  const sources = [
    `/initiatives/optimized/${character}.webp`,
    `/initiatives/${character}.png`,
  ];
  return <div className="character-portrait">
    <UserRound size={30} strokeWidth={1.3} aria-hidden="true" />
    {attempt < sources.length
      ? <img src={sources[attempt]} alt={alt} width={192} height={256} decoding="async"
        onError={() => setAttempt((value) => value + 1)} />
      : <span className="sr-only">{alt}</span>}
  </div>;
};
