import chalk from "chalk";
import { configService } from "../../../services/config_service.js";
import fs from "fs-extra";
import path from "path";

// Main function for the 'import-knowledge' command
export async function importKnowledge({ file }) {
    if (!file) {
        console.error(chalk.red("❌ Please provide a file path for the knowledge import using the --file option."));
        return;
    }

    const filePath = path.resolve(process.cwd(), file);

    console.log(chalk.blue(`🚀 Initiating knowledge import from ${filePath}...`));

    try {
        if (!await fs.pathExists(filePath)) {
            throw new Error(`The specified file does not exist: ${filePath}`);
        }

        const fileContent = await fs.readFile(filePath, 'utf-8');

        await configService.initialize();
        const config = configService.getConfig();
        const engineUrl = `http://localhost:${config.port || 3010}`;
        const importUrl = `${engineUrl}/api/knowledge/import`;
        const authToken = process.env.STIGMERGY_AUTH_TOKEN;

        console.log(chalk.gray(`   - Contacting engine at ${importUrl}`));

        const response = await fetch(importUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ cypherScript: fileContent }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to import knowledge: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const { message } = await response.json();

        console.log(chalk.green("✅ Knowledge import successful!"));
        console.log(chalk.gray(`   - ${message}`));

    } catch (error) {
        console.error(chalk.red("❌ An error occurred during knowledge import:"), error.message);
         if (error.cause) {
            console.error(chalk.gray("   - Cause:"), error.cause);
        }
    }
}
