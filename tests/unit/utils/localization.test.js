import { t, localizeError } from '../../../utils/localization.js';

describe('Localization', () => {
  describe('t', () => {
    it('should return the correct string for a given key and language', () => {
      expect(t('no_neo4j', 'es')).toBe('Base de datos Neo4j no está en ejecución');
    });

    it('should fall back to English if the key is not found in the specified language', () => {
      expect(t('invalid_api_key', 'es')).toBe('Invalid API key');
    });

    it('should fall back to the key itself if the key is not found in English either', () => {
      expect(t('non_existent_key', 'en')).toBe('non_existent_key');
      expect(t('non_existent_key', 'es')).toBe('non_existent_key');
    });

    it('should use English by default if no language is specified', () => {
      expect(t('permission_denied')).toBe("You don't have permission for this action");
    });
  });

  describe('localizeError', () => {
    it('should localize the message and remediation fields of an error object', () => {
      const error = {
        code: 'E001',
        message_key: 'no_neo4j',
        remediation_key: 'check_credentials',
      };

      const localizedError = localizeError(error, 'es');

      expect(localizedError).toEqual({
        code: 'E001',
        message_key: 'no_neo4j',
        remediation_key: 'check_credentials',
        message: 'Base de datos Neo4j no está en ejecución',
        remediation: 'Verifica tus credenciales',
      });
    });

    it('should fall back to English for localization', () => {
        const error = {
          code: 'E002',
          message_key: 'invalid_api_key',
          remediation_key: 'check_credentials',
        };
  
        const localizedError = localizeError(error, 'es');
  
        expect(localizedError).toEqual({
          code: 'E002',
          message_key: 'invalid_api_key',
          remediation_key: 'check_credentials',
          message: 'Invalid API key',
          remediation: 'Verifica tus credenciales',
        });
      });

      it('should use English by default if no language is specified in localizeError', () => {
        const error = {
          code: 'E001',
          message_key: 'no_neo4j',
          remediation_key: 'check_credentials',
        };

        const localizedError = localizeError(error);

        expect(localizedError).toEqual({
          code: 'E001',
          message_key: 'no_neo4j',
          remediation_key: 'check_credentials',
          message: 'Neo4j database not running',
          remediation: 'Check your credentials',
        });
      });
  });
});
