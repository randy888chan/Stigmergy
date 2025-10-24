import chalk from "chalk";
import { configService } from "../../../services/config_service.js";
import path from "path";
import fs from "fs-extra";

// Main function for the 'export-knowledge' command
export async function exportKnowledge() {
    console.log(chalk.blue("🚀 Initiating knowledge export..."));

    try {
        await configService.initialize();
        const config = configService.getConfig();
        const engineUrl = `http://localhost:${config.port || 3010}`;
        const exportUrl = `${engineUrl}/api/knowledge/export`;
        const authToken = process.env.STIGMERGY_AUTH_TOKEN;

        console.log(chalk.gray(`   - Contacting engine at ${exportUrl}`));

        const response = await fetch(exportUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to export knowledge: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const { filePath } = await response.json();

        console.log(chalk.green("✅ Knowledge export successful!"));
        console.log(chalk.gray(`   - Export file created at: ${filePath}`));

    } catch (error) {
        console.error(chalk.red("❌ An error occurred during knowledge export:"), error.message);
        if (error.cause) {
            console.error(chalk.gray("   - Cause:"), error.cause);
        }
    }
}
