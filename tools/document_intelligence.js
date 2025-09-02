// Document intelligence tool for Deepcode integration
import fs from 'fs-extra';
import path from 'path';

// Basic document processing functions
export async function processDocument({ filePath, outputDir = 'docs/analysis' }) {
  try {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Document not found: ${filePath}`);
    }

    const content = await fs.readFile(filePath, 'utf8');
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Ensure output directory exists
    await fs.ensureDir(outputDir);
    
    // Basic segmentation - split by headers and sections
    const segments = segmentDocument(content);
    
    // Save processed segments
    const outputPath = path.join(outputDir, `${fileName}_processed.md`);
    await fs.writeFile(outputPath, segments.join('\n\n---\n\n'));
    
    return {
      success: true,
      outputPath,
      segmentCount: segments.length,
      message: `Document processed into ${segments.length} segments`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function extractCodePatterns({ content, language = 'javascript' }) {
  try {
    // Extract code blocks from markdown content
    const codeBlockRegex = /```(?:js|javascript|typescript|ts)?\n([\s\S]*?)```/g;
    const patterns = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      patterns.push({
        code: match[1].trim(),
        language,
        context: extractSurroundingText(content, match.index)
      });
    }
    
    return {
      success: true,
      patterns,
      count: patterns.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function createImplementationBrief({ requirements, patterns, outputPath }) {
  try {
    const brief = generateTechnicalBrief(requirements, patterns);
    await fs.writeFile(outputPath, brief);
    
    return {
      success: true,
      outputPath,
      message: 'Technical implementation brief created'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper functions
function segmentDocument(content) {
  // Split by markdown headers
  const segments = content.split(/(?=^#{1,6}\s)/m);
  return segments.filter(segment => segment.trim().length > 0);
}

function extractSurroundingText(content, index, radius = 100) {
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
  return content.substring(start, end);
}

function generateTechnicalBrief(requirements, patterns) {
  return `# Technical Implementation Brief

## Requirements Summary
${requirements}

## Reference Patterns
${patterns.map(p => `
### Pattern: ${p.context}
\`\`\`${p.language}
${p.code}
\`\`\`
`).join('\n')}

## Implementation Guidance
- Use the provided patterns as starting points
- Adapt patterns to fit the specific requirements
- Maintain consistency with existing codebase architecture

## Next Steps
1. Review patterns and select most relevant ones
2. Adapt patterns to specific use case
3. Implement following established conventions
`;
}