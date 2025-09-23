import config from '../../stigmergy.config.js';

describe('Stigmergy Configuration', () => {
  it('should include a correctly configured vision_tier for image analysis', () => {
    expect(config.model_tiers).toHaveProperty('vision_tier');
    const visionTier = config.model_tiers.vision_tier;
    expect(visionTier.provider).toBe('openrouter');
    expect(visionTier.model_name).toBeDefined();
    expect(visionTier.capabilities).toContain('vision');
  });
});
