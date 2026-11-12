import { fetchSpaceEnvironment } from './fetchSpaceEnvironment.ts';
import { queryFlag, type ApiRequest, type ApiResponse } from './http.ts';

export async function handleSpaceEnvironment(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const force = queryFlag(req.query, 'refresh');
    const payload = await fetchSpaceEnvironment(force);
    return res.status(200).json(payload);
  } catch (error: unknown) {
    console.error('Space environment API error:', error);
    return res.status(503).json({
      fetchedAt: new Date().toISOString(),
      overallStatus: 'unavailable',
      notices: ['Official space-weather feed unavailable. No NASA/NOAA values were filled in.'],
      sources: [],
      observations: { kp: null, goesXray: null, solarWind: null, protons: null },
      events: { solarFlares: [], geomagneticStorms: [], coronalMassEjections: [], swpcAlerts: [] },
      error: error instanceof Error ? error.message : 'unavailable',
    });
  }
}
