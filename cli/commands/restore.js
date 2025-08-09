import coreBackup from "../../services/core_backup.js";

export default async function restore() {
  console.log("Restoring latest backup...");
  const success = await coreBackup.restoreLatest();
  if (success) {
    console.log("✅ Core restored successfully");
  } else {
    console.log("❌ No backups available");
  }
}
