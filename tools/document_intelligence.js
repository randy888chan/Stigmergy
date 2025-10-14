import fs from 'fs-extra';
import path from 'path';
import pdfParse from 'pdf-parse-debugging-disabled';
import mammoth from 'mammoth';

async function processPDF(filePath) {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return {
        content: data.text,
        metadata: { pages: data.numpages, info: data.info }
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

/**
 * Processes an uploaded document, extracts its text content, and provides metadata.
 * @param {object} args
 * @param {string} args.filePath - The absolute path to the document to process.
 */
export async function processDocument({ filePath }) {
    if (!await fs.pathExists(filePath)) {
        throw new Error(`Document not found at path: ${filePath}`);
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