import { t, localizeError } from "../../../utils/localization.js";

describe("Localization System", () => {
  const testError = {
    message_key: "permission_denied",
    remediation_key: "check_credentials",
  };

  it("should return English by default", () => {
    expect(t("no_neo4j")).toBe("Neo4j database not running");
  });

  it("should return Spanish translations", () => {
    expect(t("no_neo4j", "es")).toBe("Base de datos Neo4j no está en ejecución");
  });

  it("should fallback to English for missing translations", () => {
    // This test requires a key that is in 'en' but not 'es'
    // Let's assume 'invalid_api_key' is one such key.
    // I need to add it to the localization.js file for the test to be valid.
    expect(t("permission_denied", "fr")).toBe("You don't have permission for this action");
  });

  it("should localize operational errors", () => {
    const localized = localizeError(testError, "es");
    expect(localized.message).toBe("No tienes permiso para esta acción");
    // This will fail as 'check_credentials' is not in the messages.
    // I will add it.
    expect(localized.remediation).toBe("Verifica tus credenciales");
  });

  it("should handle missing remediation keys", () => {
    const error = { message_key: "no_neo4j" };
    const localized = localizeError(error, "es");
    expect(localized.remediation).toBeUndefined();
  });

  it("should return the key if no translation is found anywhere", () => {
    expect(t("a_key_that_does_not_exist")).toBe("a_key_that_does_not_exist");
  });
});
