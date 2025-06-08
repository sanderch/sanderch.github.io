// Utility for direction calculation
// Converts an angle (radians) to sprite direction index and mirroring info
export function getDirectionIndex(angle) {
  const deg = angle * (180 / Math.PI);
  if (deg >= -22.5 && deg < 22.5) return { index: 2, mirrored: false }; // Right
  if (deg >= 22.5 && deg < 67.5) return { index: 3, mirrored: false }; // Down-Right
  if (deg >= 67.5 && deg < 112.5) return { index: 4, mirrored: false }; // Down
  if (deg >= 112.5 && deg < 157.5) return { index: 3, mirrored: true }; // Down-Left
  if (deg >= 157.5 || deg < -157.5) return { index: 2, mirrored: true }; // Left
  if (deg >= -157.5 && deg < -112.5) return { index: 1, mirrored: true }; // Up-Left
  if (deg >= -112.5 && deg < -67.5) return { index: 0, mirrored: false }; // Up
  if (deg >= -67.5 && deg < -22.5) return { index: 1, mirrored: false }; // Up-Right
  return { index: 2, mirrored: false };
}
