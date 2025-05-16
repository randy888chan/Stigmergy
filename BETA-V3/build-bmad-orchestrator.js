#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const DEFAULT_ASSET_FOLDER_ROOT = "./bmad-agent";
const SUBDIRECTORIES_TO_PROCESS = {
  checklists: "checklists.txt",
  data: "data.txt",
  personas: "personas.txt",
  tasks: "tasks.txt",
  templates: "templates.txt",
};
const BUILD_DIR_NAME = "build";

// --- Helper Functions ---
function getBaseFilename(filePath) {
  // Removes the last extension, e.g., "file.sample.txt" -> "file.sample"
  return path.basename(filePath, path.extname(filePath));
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// --- Main Script Logic ---
async function main() {
  // 1. Determine and validate asset folder root
  const providedAssetRoot = process.argv[2]; // Get the first argument after script name
  const assetFolderRootInput = providedAssetRoot || DEFAULT_ASSET_FOLDER_ROOT;

  console.log(`Initial asset folder root: ${assetFolderRootInput}`);
  let assetFolderRoot;
  try {
    assetFolderRoot = path.resolve(assetFolderRootInput);
    if (
      !fs.existsSync(assetFolderRoot) ||
      !fs.statSync(assetFolderRoot).isDirectory()
    ) {
      console.error(
        `Error: Asset folder root '${assetFolderRootInput}' (resolved to '${assetFolderRoot}') not found or not a directory.`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `Error: Could not resolve asset folder root '${assetFolderRootInput}'. ${error.message}`
    );
    process.exit(1);
  }
  console.log(`Using resolved asset folder root: ${assetFolderRoot}`);

  const buildDir = path.join(assetFolderRoot, BUILD_DIR_NAME);

  // 2. Perform pre-check for duplicate base filenames
  console.log("\nPerforming pre-check for duplicate base filenames...");
  for (const subdirName of Object.keys(SUBDIRECTORIES_TO_PROCESS)) {
    const sourceSubdir = path.join(assetFolderRoot, subdirName);

    if (
      !fs.existsSync(sourceSubdir) ||
      !fs.statSync(sourceSubdir).isDirectory()
    ) {
      // This directory might not exist, which is fine for the pre-check.
      // The main processing loop will handle warnings for missing/empty dirs.
      continue;
    }

    try {
      const files = fs.readdirSync(sourceSubdir);
      if (files.length === 0) {
        // Empty directory, no duplicates possible.
        continue;
      }

      console.log(`  Checking for duplicates in '${sourceSubdir}'...`);
      const baseFilenamesSeen = {}; // Using an object as a hash map

      for (const filenameWithExt of files) {
        const filePath = path.join(sourceSubdir, filenameWithExt);
        if (fs.statSync(filePath).isFile()) {
          const baseName = getBaseFilename(filenameWithExt);

          if (baseFilenamesSeen[baseName]) {
            console.error(
              `Error: Duplicate base name '${baseName}' found in directory '${sourceSubdir}'.`
            );
            console.error(
              `       Conflicting files: '${baseFilenamesSeen[baseName]}' and '${filenameWithExt}'.`
            );
            console.error(
              `       Please ensure all files in a subdirectory have unique names after removing their last extensions.`
            );
            process.exit(1);
          } else {
            baseFilenamesSeen[baseName] = filenameWithExt;
          }
        }
      }
      console.log(`    No duplicates found in '${sourceSubdir}'.`);
    } catch (error) {
      console.warn(
        `Warning: Could not read directory '${sourceSubdir}' during pre-check. ${error.message}`
      );
      // Continue to allow the main loop to handle it more formally.
    }
  }
  console.log(
    "Pre-check completed successfully. No duplicate base filenames found."
  );

  // 3. Create build directory
  ensureDirectoryExists(buildDir);
  console.log(`\nBuild directory is: ${buildDir}`);

  // 4. Main processing loop
  for (const [subdirName, outputFilename] of Object.entries(
    SUBDIRECTORIES_TO_PROCESS
  )) {
    const sourceSubdir = path.join(assetFolderRoot, subdirName);
    const targetFile = path.join(buildDir, outputFilename);

    console.log(`Processing '${subdirName}' directory into '${targetFile}'`);

    // Delete target file if it exists, then create it empty
    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
    }
    fs.writeFileSync(targetFile, ""); // Create empty file

    if (
      !fs.existsSync(sourceSubdir) ||
      !fs.statSync(sourceSubdir).isDirectory()
    ) {
      console.warn(
        `Warning: Source directory '${sourceSubdir}' not found. '${targetFile}' will remain empty.`
      );
      continue;
    }

    const files = fs.readdirSync(sourceSubdir);
    if (files.length === 0) {
      console.warn(
        `Warning: Source directory '${sourceSubdir}' is empty. '${targetFile}' will remain empty.`
      );
      continue;
    }

    for (const filenameWithExt of files) {
      const filePath = path.join(sourceSubdir, filenameWithExt);
      if (fs.statSync(filePath).isFile()) {
        const baseName = getBaseFilename(filenameWithExt);
        console.log(
          `  Appending content from '${filenameWithExt}' (as '${baseName}') to '${targetFile}'`
        );

        const fileContent = fs.readFileSync(filePath, "utf8");

        const startMarker = `==================== START: ${baseName} ====================\n`;
        const endMarker = `\n==================== END: ${baseName} ====================\n\n\n`; // Two blank lines after

        fs.appendFileSync(targetFile, startMarker);
        fs.appendFileSync(targetFile, fileContent);
        // Ensure a newline before the end marker if fileContent doesn't end with one
        if (!fileContent.endsWith("\n")) {
          fs.appendFileSync(targetFile, "\n");
        }
        fs.appendFileSync(targetFile, endMarker);
      }
    }
    console.log(`Finished processing '${subdirName}'.`);
  }

  console.log(`\nScript finished. Output files are in ${buildDir}`);
  console.log(
    "To run this script: node BETA-V3/build-bmad-assets.js [path/to/asset/folder]"
  );
}

main().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});
