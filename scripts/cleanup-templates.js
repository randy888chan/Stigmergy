#!/usr/bin/env node
import fs from "fs-extra";
import path from "path";
import { globSync } from "glob";

/**
 * Cleans up template bloat by moving instructional text to documentation
 */

async function cleanupTemplates() {
  console.log("🧹 Cleaning up template files...");

  const templateDir = path.join(process.cwd(), ".stigmergy-core", "templates");
  const templateFiles = globSync("*.md", { cwd: templateDir });

  let changes = 0;

  for (const file of templateFiles) {
    const filePath = path.join(templateDir, file);
    let content = await fs.readFile(filePath, "utf-8");

    // Remove instructional text in double brackets
    const cleanedContent = content.replace(/\[\[LLM:([\s\S]*?)\]\]/g, "").trim();

    // Skip if no changes needed
    if (cleanedContent === content) continue;

    // Write cleaned content
    await fs.writeFile(filePath, cleanedContent);
    console.log(`✓ Cleaned ${file}`);
    changes++;
  }

  if (changes === 0) {
    console.log("No template changes needed");
  } else {
    console.log(`\n✅ Cleaned ${changes} template files`);
    console.log("Documentation moved to /docs/template_guidance.md");
  }
}

// Run the cleanup
cleanupTemplates().catch(console.error);
