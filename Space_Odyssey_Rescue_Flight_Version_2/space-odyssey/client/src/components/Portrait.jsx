import React from 'react';
import crew from '../assets/crew.webp';
import wardens from '../assets/wardens.webp';

const crewNames = ['Guardian', 'Commander Reyes', 'Ship AI', 'Crimson Warden', 'Storm Warden'];
const wardenNames = ['Ringkeeper', 'Frost Sentinel', 'Tide Warden', 'Sulfur Warden', 'Solar Warden', 'The Architect'];

export default function Portrait({ speaker, compact = false }) {
  const crewIndex = crewNames.indexOf(speaker === 'Defense System' ? 'Ship AI' : speaker);
  const index = crewIndex === -1 ? wardenNames.indexOf(speaker) : crewIndex;
  const sheet = crewIndex === -1 ? wardens : crew;
  if (index === -1) return null;

  return (
    <span
      className={compact ? 'portrait portrait-compact' : 'portrait'}
      aria-hidden="true"
      style={{
        backgroundImage: `url("${sheet}")`,
        backgroundPosition: `${(index % 3) * 50}% ${index >= 3 ? 100 : 0}%`
      }}
    />
  );
}
