const ERROR_MESSAGES = {
  en: {
    no_neo4j: "Neo4j database not running",
    permission_denied: "You don't have permission for this action",
    invalid_api_key: "Invalid API key",
    check_credentials: "Check your credentials",
    // Add more entries
  },
  es: {
    no_neo4j: "Base de datos Neo4j no está en ejecución",
    permission_denied: "No tienes permiso para esta acción",
    check_credentials: "Verifica tus credenciales",
  },
  // Add other languages
};

export function t(key, lang = "en") {
  return ERROR_MESSAGES[lang]?.[key] || ERROR_MESSAGES.en[key] || key;
}

// Integration point
export function localizeError(error, lang) {
  return {
    ...error,
    message: t(error.message_key, lang),
    remediation: t(error.remediation_key, lang),
  };
}
