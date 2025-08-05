#!/usr/bin/env node
import fs from "fs-extra";
import path from "path";

/**
 * Cleans up documentation by removing redundancies
 */

async function cleanupDocs() {
  console.log("📚 Cleaning up documentation...");

  const docsDir = path.join(process.cwd(), "docs");
  if (!(await fs.pathExists(docsDir))) return;

  // Consolidate similar documentation
  const filesToMerge = [
    {
      source: ["agent_creation.md", "custom_agents_guide.md"],
      target: "agent_development.md",
      header:
        "# Agent Development Guide\n\nThis document covers creating and customizing agents for Stigmergy.",
    },
    {
      source: ["troubleshooting.md", "TROUBLESHOOTING.md"],
      target: "TROUBLESHOOTING.md",
      header: "# Stigmergy Troubleshooting Guide",
    },
  ];

  let changes = 0;

  // Merge files
  for (const merge of filesToMerge) {
    // Check if multiple source files exist
    const existingSources = merge.source.filter((f) => fs.pathExistsSync(path.join(docsDir, f)));

    if (existingSources.length > 1) {
      // Read all source content
      let combinedContent = merge.header + "\n\n";

      for (const file of existingSources) {
        const filePath = path.join(docsDir, file);
        const content = await fs.readFile(filePath, "utf-8");

        // Remove header from included files
        const contentWithoutHeader = content.replace(/#{1,6} .+\n/, "");
        combinedContent += contentWithoutHeader + "\n\n";
      }

      // Write to target
      const targetPath = path.join(docsDir, merge.target);
      await fs.writeFile(targetPath, combinedContent);

      // Delete source files (except the target if it was a source)
      for (const file of existingSources) {
        if (file !== merge.target) {
          await fs.unlink(path.join(docsDir, file));
        }
      }

      console.log(`✓ Merged ${existingSources.join(", ")} → ${merge.target}`);
      changes++;
    }
  }

  // Clean up empty sections in TROUBLESHOOTING.md
  const troubleshootingPath = path.join(docsDir, "TROUBLESHOOTING.md");
  if (await fs.pathExists(troubleshootingPath)) {
    let content = await fs.readFile(troubleshootingPath, "utf-8");

    // Remove empty sections
    const cleanedContent = content
      .replace(/## [^\n]+\n\n(?=##|$)/g, "")
      .replace(/### [^\n]+\n\n(?=###|$)/g, "");

    if (cleanedContent !== content) {
      await fs.writeFile(troubleshootingPath, cleanedContent);
      console.log("✓ Cleaned up TROUBLESHOOTING.md");
      changes++;
    }
  }

  if (changes === 0) {
    console.log("No documentation changes needed");
  } else {
    console.log(`\n✅ Made ${changes} documentation improvements`);
  }
}

// Run the cleanup
cleanupDocs().catch(console.error);
