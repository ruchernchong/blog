/**
 * Check if a feature flag is enabled or disabled
 *
 * @param feature - Usually used with process.env
 */
export const isFeatureEnabled = (feature: string): boolean =>
  JSON.parse(feature);
