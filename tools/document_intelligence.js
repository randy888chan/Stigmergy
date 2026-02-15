import fs from 'fs-extra';
import path from 'path';
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';

async function processPDF(filePath) {
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extract(filePath, {});
    return {
        content: data.pages.map(page => page.content.map(item => item.str).join(' ')).join('\n'),
        metadata: { pages: data.pages.length, info: data.pdfInfo }
    };
}

async function processDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return {
        content: result.value,
        metadata: { messages: result.messages }
    };
}

async function processPlainText(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return {
        content: content,
        metadata: { lines: content.split('\n').length }
    };
}

async function processDirectory(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip common hidden/system directories
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;

        if (entry.isDirectory()) {
            const subDirResults = await processDirectory(fullPath);
            if (subDirResults.results && subDirResults.results.length > 0) {
                results.push(...subDirResults.results);
            }
        } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.pdf', '.docx', '.txt', '.md'].includes(ext)) {
                try {
                    const result = await processDocument({ filePath: fullPath });
                    results.push({
                        fileName: entry.name,
                        path: fullPath,
                        ...result
                    });
                } catch (e) {
                    results.push({
                        fileName: entry.name,
                        path: fullPath,
                        error: e.message
                    });
                }
            }
        }
    }

    return {
        type: 'directory_report',
        path: dirPath,
        filesProcessed: results.length,
        results: results
    };
}

/**
 * Processes an uploaded document or a whole directory, extracts text content, and provides metadata.
 * @param {object} args
 * @param {string} args.filePath - The absolute path to the document or directory to process.
 */
export async function processDocument({ filePath }) {
    if (!await fs.pathExists(filePath)) {
        throw new Error(`Path not found: ${filePath}`);
    }

    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
        console.log(`[DocIntel] Processing directory: ${filePath}`);
        return await processDirectory(filePath);
    }

    const ext = path.extname(filePath).toLowerCase();

    try {
        if (ext === '.pdf') {
            return await processPDF(filePath);
        } else if (ext === '.docx') {
            return await processDOCX(filePath);
        } else if (ext === '.txt' || ext === '.md') {
            return await processPlainText(filePath);
        } else {
            throw new Error(`Unsupported document type: ${ext}`);
        }
    } catch (error) {
        console.error(`[DocIntel] Error processing ${filePath}:`, error);
        return {
            error: `Failed to process document: ${error.message}`
        };
    }
}
