import { t, localizeError } from '../../utils/localization.js';

// Basic unit test to verify the test environment is working
describe('Localization utilities', () => {
  test('should translate error messages', () => {
    expect(t('no_neo4j', 'en')).toBe('Neo4j database not running');
    expect(t('no_neo4j', 'es')).toBe('Base de datos Neo4j no está en ejecución');
  });

  test('should fallback to English if translation not found', () => {
    expect(t('invalid_key', 'es')).toBe('invalid_key');
  });

  test('should handle localization of error objects', () => {
    const error = {
      message_key: 'permission_denied',
      remediation_key: 'check_credentials',
      other_field: 'some_value'
    };
    
    const localized = localizeError(error, 'es');
    
    expect(localized.message).toBe('No tienes permiso para esta acción');
    expect(localized.remediation).toBe('Verifica tus credenciales');
    expect(localized.other_field).toBe('some_value');
  });
});