const fs = require("fs-extra");
const path = require("path");
const installer = require("../installer/install");

jest.mock("fs-extra");
jest.mock("ora", () => () => ({
  start: () => ({ succeed: jest.fn(), fail: jest.fn(), warn: jest.fn(), text: "" }),
}));

const CWD = process.cwd();

describe("System Install and Build Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.pathExists.mockResolvedValue(false);
  });

  describe("Installer", () => {
    it("should correctly create a new .roomodes file", async () => {
      fs.readdir.mockResolvedValue(["analyst.md"]);
      fs.readFile.mockResolvedValue(
        '```yaml\nagent:\n  id: "analyst"\n  alias: "mary"\n  name: "Mary"\n  icon: "📊"\n```'
      );

      await installer.run();

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(CWD, ".roomodes"),
        expect.stringContaining("module.exports"),
        "utf8"
      );

      const writtenContent = fs.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain('slug: "mary"');
    });
  });
});
