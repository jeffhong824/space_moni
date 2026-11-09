import { handleSpaceEnvironment } from '../../src/server/spaceEnvironmentHandler.ts';
import type { ApiRequest, ApiResponse } from '../../src/server/http.ts';

export const config = { maxDuration: 20 };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  return handleSpaceEnvironment(req, res);
}
