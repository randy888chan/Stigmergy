export class SystemHealth {
  static async getGitStatus() {
    return {
      branch: "main",
      status: "clean",
      commit: "mock-commit",
    };
  }

  static async getDatabaseStatus() {
    return "connected";
  }

  static async getAIServiceStatus() {
    return "operational";
  }

  static async checkFileSystem() {
    return "ok";
  }

  static async getEnvironment() {
    return "development";
  }
}
