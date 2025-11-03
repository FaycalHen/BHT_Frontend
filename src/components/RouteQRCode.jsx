
import React from 'react';

/**
 * Generates a Google Maps directions link from an array of coordinates.
 * @param {Array} coords - Array of [lat, lng] pairs
 * @returns {string} Google Maps directions URL
 */
export function getGoogleMapsDirectionsUrl(coords) {
  if (!coords || coords.length < 2) return '';
  const origin = coords[0].join(',');
  const destination = coords[coords.length - 1].join(',');
  const waypoints = coords.slice(1, -1).map(pair => pair.join(',')).join('|');
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
  url += '&travelmode=driving';
  return url;
}

/**
 * Renders a QR code for a given URL.
 */
// This module only exports the URL builder helper for Google Maps directions.
