import React, { useState } from 'react';
import { Bus, TrafficCone, TrainFront, Trees, House, TreePine, School, Hospital, Dumbbell, Cctv, Footprints, Monitor, Pipette, Truck } from 'lucide-react';

const images: Record<string, { filename: string; Icon: typeof Bus }> = {
  M1: { filename: 'm1-bus-lane', Icon: Bus }, M2: { filename: 'm2-smart-traffic-lights', Icon: TrafficCone },
  M3: { filename: 'm3-light-rail', Icon: TrainFront }, M4: { filename: 'm4-city-park', Icon: Trees },
  M5: { filename: 'm5-clean-heating', Icon: House }, M6: { filename: 'm6-green-belt', Icon: TreePine },
  M7: { filename: 'm7-school-kindergarten', Icon: School }, M8: { filename: 'm8-health-clinic', Icon: Hospital },
  M9: { filename: 'm9-sports-court', Icon: Dumbbell }, M10: { filename: 'm10-lighting-cameras', Icon: Cctv },
  M11: { filename: 'm11-safe-crossing', Icon: Footprints }, M12: { filename: 'm12-citizen-platform', Icon: Monitor },
  M13: { filename: 'm13-utility-pipes', Icon: Pipette }, M14: { filename: 'm14-utility-response', Icon: Truck },
};

export const InitiativeThumbnail = ({ measureId }: { measureId: string }) => {
  const [attempt, setAttempt] = useState(0);
  const image = images[measureId];
  if (!image) return null;
  const { Icon } = image;
  const sources = [
    `/initiatives/optimized/${image.filename}.webp`,
    `/initiatives/${image.filename}.png`,
    `/initiatives/${image.filename}.webp`,
  ];
  return <div className={`initiative__thumbnail initiative__thumbnail--${measureId}`} aria-hidden="true">
    <Icon size={33} strokeWidth={1.35} /><small>{measureId}</small>
    {attempt < sources.length && <img src={sources[attempt]}
      alt="" loading="lazy" onError={() => setAttempt((value) => value + 1)} />}
  </div>;
};
