/**
 * Nationality data export for backend consumption
 * This file exports the nationality data in a format suitable for Python backend
 */

import { NATIONALITIES, NATIONALITY_WEIGHTS } from './nationalities';

/**
 * Export nationality data as JSON for backend to consume
 */
export function getNationalitiesJSON(): string {
  const data = {
    nationalities: NATIONALITIES,
    weights: NATIONALITY_WEIGHTS,
  };
  return JSON.stringify(data, null, 2);
}
