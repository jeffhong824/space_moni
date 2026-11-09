/**
 * NASA Open Data API Integration
 * 
 * This module fetches real space environment data from NASA's public APIs:
 * - DONKI (Space Weather Database): Solar flares, CMEs, geomagnetic storms
 * - APOD API: Astronomy Picture of the Day (optional context)
 * 
 * All endpoints are free and require no API key for basic usage.
 * Rate limit: ~1000 requests/hour with DEMO_KEY
 */

const NASA_API_KEY = 'DEMO_KEY'; // Public demo key, no registration required
const DONKI_BASE = 'https://api.nasa.gov/DONKI';
const NASA_API_BASE = 'https://api.nasa.gov';

export interface SolarFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  classType: string; // e.g., "C2.5", "M1.0", "X1.2"
  sourceLocation: string;
  activeRegionNum: number;
}

export interface GeomagneticStorm {
  gstID: string;
  startTime: string;
  kpIndex: number; // 0-9 scale
  observedTime: string;
  allKpIndex: Array<{ observedTime: string; kpIndex: number }>;
}

export interface CoronalMassEjection {
  activityID: string;
  startTime: string;
  sourceLocation: string;
  note: string;
  instruments: Array<{ displayName: string }>;
}

export interface SpaceEnvironmentData {
  timestamp: string;
  solarFlares: SolarFlare[];
  geomagneticStorms: GeomagneticStorm[];
  coronalMassEjections: CoronalMassEjection[];
  summary: {
    totalEvents: number;
    highestSolarFlareClass: string;
    maxKpIndex: number;
    radiationRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  };
}

/**
 * Fetch recent solar flares from NASA DONKI
 */
export async function fetchSolarFlares(startDate: string, endDate: string): Promise<SolarFlare[]> {
  try {
    const url = `${DONKI_BASE}/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`;
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`DONKI FLR API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch solar flares:', error);
    return [];
  }
}

/**
 * Fetch geomagnetic storm data from NASA DONKI
 */
export async function fetchGeomagneticStorms(startDate: string, endDate: string): Promise<GeomagneticStorm[]> {
  try {
    const url = `${DONKI_BASE}/GST?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`;
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`DONKI GST API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch geomagnetic storms:', error);
    return [];
  }
}

/**
 * Fetch coronal mass ejections from NASA DONKI
 */
export async function fetchCoronalMassEjections(startDate: string, endDate: string): Promise<CoronalMassEjection[]> {
  try {
    const url = `${DONKI_BASE}/CME?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`;
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`DONKI CME API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch CMEs:', error);
    return [];
  }
}

/**
 * Aggregate comprehensive space environment data for the operations console
 */
export async function fetchSpaceEnvironmentData(): Promise<SpaceEnvironmentData> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const startDate = formatDate(sevenDaysAgo);
  const endDate = formatDate(now);

  try {
    // Fetch all data in parallel
    const [solarFlares, geomagneticStorms, coronalMassEjections] = await Promise.all([
      fetchSolarFlares(startDate, endDate),
      fetchGeomagneticStorms(startDate, endDate),
      fetchCoronalMassEjections(startDate, endDate),
    ]);

    // Calculate summary metrics
    const highestFlare = solarFlares.reduce((max, flare) => {
      const current = flare.classType || 'A0.0';
      const maxClass = max || 'A0.0';
      return current > maxClass ? current : maxClass;
    }, 'A0.0');

    const maxKp = geomagneticStorms.reduce((max, storm) => {
      const stormMax = Math.max(
        storm.kpIndex || 0,
        ...(storm.allKpIndex || []).map(k => k.kpIndex || 0)
      );
      return Math.max(max, stormMax);
    }, 0);

    // Assess radiation risk based on solar activity
    let radiationRisk: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
    const flareClass = highestFlare.charAt(0);
    
    if (flareClass === 'X' || maxKp >= 7) {
      radiationRisk = 'Severe';
    } else if (flareClass === 'M' || maxKp >= 5) {
      radiationRisk = 'High';
    } else if (flareClass === 'C' || maxKp >= 3) {
      radiationRisk = 'Moderate';
    }

    return {
      timestamp: now.toISOString(),
      solarFlares: solarFlares.slice(0, 10), // Most recent 10
      geomagneticStorms: geomagneticStorms.slice(0, 5),
      coronalMassEjections: coronalMassEjections.slice(0, 5),
      summary: {
        totalEvents: solarFlares.length + geomagneticStorms.length + coronalMassEjections.length,
        highestSolarFlareClass: highestFlare,
        maxKpIndex: maxKp,
        radiationRisk,
      },
    };
  } catch (error) {
    console.error('Failed to fetch space environment data:', error);
    
    // Return fallback data structure
    return {
      timestamp: now.toISOString(),
      solarFlares: [],
      geomagneticStorms: [],
      coronalMassEjections: [],
      summary: {
        totalEvents: 0,
        highestSolarFlareClass: 'N/A',
        maxKpIndex: 0,
        radiationRisk: 'Low',
      },
    };
  }
}
