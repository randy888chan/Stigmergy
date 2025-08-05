const TOOL_BLACKLIST = ["shell.execute"];

export function sanitizeToolCall(toolName, args) {
  // Prevent dangerous tool combinations
  if (TOOL_BLACKLIST.includes(toolName)) {
    throw new Error("Restricted tool access");
  }

  // Sanitize arguments
  return Object.entries(args).reduce((safeArgs, [key, value]) => {
    if (typeof value === "string") {
      // Remove potential injection vectors
      safeArgs[key] = value.replace(/[;|$>&]/g, "");
    } else {
      safeArgs[key] = value;
    }
    return safeArgs;
  }, {});
}
