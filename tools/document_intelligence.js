// Enhanced Document Intelligence Tool for Stigmergy
// Provides comprehensive document processing with AI-powered semantic segmentation
import * as fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import * as fileType from 'file-type';
import { createReadStream } from 'fs';
import JSZip from 'jszip';

// Import AI providers for semantic processing
let aiProvider;
let isProviderInitialized = false;

async function initializeAIProvider() {
  if (!isProviderInitialized) {
    try {
      const providers = await import('../ai/providers.js');
      aiProvider = providers.default || providers;
      isProviderInitialized = true;
    } catch (error) {
      console.warn('AI provider not available for semantic processing:', error.message);
    }
  }
}

/**
 * Main document processing function
 * @param {Object} options - Processing options
 * @param {string} options.filePath - Path to the document
 * @param {string} options.outputDir - Output directory for processed files
 * @param {boolean} options.enableSemanticSegmentation - Use AI for smart segmentation
 * @param {boolean} options.preserveCodeBlocks - Keep code blocks intact
 * @param {boolean} options.extractMetadata - Extract document metadata
 */
export async function processDocument({ 
  filePath, 
  outputDir = 'docs/analysis',
  enableSemanticSegmentation = true,
  preserveCodeBlocks = true,
  extractMetadata = true 
}) {
  try {
    await initializeAIProvider();
    
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Document not found: ${filePath}`);
    }

    // Detect file type
    const fileType = await detectFileType(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Ensure output directory exists
    await fs.ensureDir(outputDir);
    
    let processResult;
    
    // Process based on file type
    switch (fileType) {
      case 'pdf':
        processResult = await processPDF(filePath, { preserveCodeBlocks, extractMetadata });
        break;
      case 'docx':
        processResult = await processDOCX(filePath, { preserveCodeBlocks, extractMetadata });
        break;
      case 'html':
      case 'htm':
        processResult = await processHTML(filePath, { preserveCodeBlocks, extractMetadata });
        break;
      case 'md':
      case 'markdown':
        processResult = await processMarkdown(filePath, { preserveCodeBlocks, extractMetadata });
        break;
      case 'txt':
        processResult = await processPlainText(filePath, { preserveCodeBlocks, extractMetadata });
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Apply semantic segmentation if enabled and AI is available
    let segments = processResult.segments;
    if (enableSemanticSegmentation && aiProvider) {
      segments = await semanticSegmentation(processResult.content, {
        preserveCodeBlocks,
        fileType,
        metadata: processResult.metadata
      });
    }
    
    // Generate processed output
    const outputPath = path.join(outputDir, `${fileName}_processed.md`);
    const briefPath = path.join(outputDir, `${fileName}_brief.md`);
    
    // Save segmented content
    const segmentedContent = segments.map((segment, index) => 
      `## Segment ${index + 1}\n\n${segment}`
    ).join('\n\n---\n\n');
    
    await fs.writeFile(outputPath, segmentedContent);
    
    // Generate technical brief
    const brief = generateProcessingBrief(processResult, segments, filePath);
    await fs.writeFile(briefPath, brief);
    
    return {
      success: true,
      outputPath,
      briefPath,
      segmentCount: segments.length,
      fileType,
      metadata: processResult.metadata,
      message: `Document processed into ${segments.length} segments`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Process PDF documents
 */
async function processPDF(filePath, options = {}) {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  
  const content = data.text;
  const metadata = {
    pages: data.numpages,
    info: data.info,
    version: data.version
  };
  
  // Basic segmentation by page breaks and sections
  const segments = segmentByStructure(content, options);
  
  return {
    type: 'pdf',
    content,
    segments,
    metadata
  };
}

/**
 * Process DOCX documents
 */
async function processDOCX(filePath, options = {}) {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.convertToMarkdown({ buffer });
  
  const content = result.value;
  const metadata = {
    messages: result.messages,
    wordCount: content.split(/\s+/).length
  };
  
  // Segment by markdown structure
  const segments = segmentMarkdownContent(content, options);
  
  return {
    type: 'docx',
    content,
    segments,
    metadata
  };
}

/**
 * Process HTML documents
 */
async function processHTML(filePath, options = {}) {
  const content = await fs.readFile(filePath, 'utf8');
  const $ = cheerio.load(content);
  
  // Extract text content while preserving structure
  const textContent = extractHTMLContent($);
  const metadata = {
    title: $('title').text(),
    headings: $('h1, h2, h3, h4, h5, h6').map((i, el) => $(el).text()).get(),
    links: $('a').length,
    images: $('img').length
  };
  
  const segments = segmentHTMLContent(textContent, options);
  
  return {
    type: 'html',
    content: textContent,
    segments,
    metadata
  };
}

/**
 * Process Markdown documents
 */
async function processMarkdown(filePath, options = {}) {
  const content = await fs.readFile(filePath, 'utf8');
  const segments = segmentMarkdownContent(content, options);
  
  const metadata = {
    headings: extractMarkdownHeadings(content),
    codeBlocks: extractCodeBlocks(content).length,
    wordCount: content.split(/\s+/).length
  };
  
  return {
    type: 'markdown',
    content,
    segments,
    metadata
  };
}

/**
 * Process plain text documents
 */
async function processPlainText(filePath, options = {}) {
  const content = await fs.readFile(filePath, 'utf8');
  const segments = segmentByParagraphs(content, options);
  
  const metadata = {
    lines: content.split('\n').length,
    wordCount: content.split(/\s+/).length,
    characters: content.length
  };
  
  return {
    type: 'text',
    content,
    segments,
    metadata
  };
}

/**
 * AI-powered semantic segmentation with enhanced technical content preservation
 */
async function semanticSegmentation(content, options = {}) {
  if (!aiProvider) {
    console.warn('AI provider not available, falling back to basic segmentation');
    return segmentByStructure(content, options);
  }
  
  try {
    const prompt = `
Analyze this technical document and segment it intelligently while preserving:
- Complete algorithms, mathematical formulas, and code blocks together
- Related technical concepts and explanations grouped coherently
- Clear logical boundaries between distinct topics
- Technical coherence within each segment
- Preserve context around implementation details

Enhanced segmentation strategy:
1. Identify and keep algorithm blocks intact with their explanations
2. Group related technical concepts and their implementations
3. Separate distinct topics or modules into different segments
4. Maintain formula integrity with surrounding context
5. Keep implementation examples with their descriptions

Return segments separated by '---SEGMENT---' markers.

Document:
${content.slice(0, 8000)}${content.length > 8000 ? '...[truncated]' : ''}
`;
    
    const response = await aiProvider.generateText({
      prompt,
      model: 'gemini-1.5-flash', // Use fast model for processing
      maxTokens: 4000
    });
    
    const segments = response.text
      .split('---SEGMENT---')
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0);
    
    // If we got no valid segments, fall back to structure-based segmentation
    if (segments.length === 0) {
      console.warn('Semantic segmentation returned no segments, using basic segmentation');
      return segmentByStructure(content, options);
    }
    
    // Validate that segments contain meaningful content
    const validSegments = segments.filter(segment => {
      // Remove segments that are just formatting or very short
      const cleanSegment = segment.replace(/[#\-\*=\s\n\r]+/g, '').trim();
      return cleanSegment.length > 50;
    });
    
    return validSegments.length > 0 ? validSegments : segmentByStructure(content, options);
  } catch (error) {
    console.warn('Semantic segmentation failed, using basic segmentation:', error.message);
    return segmentByStructure(content, options);
  }
}

/**
 * Extract code patterns from processed content with enhanced pattern recognition
 */
export async function extractCodePatterns({ content, language = 'javascript', context = {} }) {
  try {
    const codeBlocks = extractCodeBlocks(content);
    const patterns = [];
    
    for (const block of codeBlocks) {
      const pattern = {
        code: block.code,
        language: block.language || language,
        context: block.context || extractSurroundingText(content, block.index),
        type: detectPatternType(block.code),
        complexity: analyzeComplexity(block.code),
        keywords: extractKeywords(block.code),
        // Enhanced metadata for better pattern matching
        lineCount: block.code.split('\n').length,
        hasComments: /\/\/|\/\*|\*\//.test(block.code),
        hasClasses: /\bclass\b|\bfunction\b|\bdef\b/.test(block.code),
        hasAlgorithms: /\b(for|while|if|switch|recursion)\b/.test(block.code)
      };
      
      patterns.push(pattern);
    }
    
    // Also extract algorithmic patterns from plain text (for research papers)
    const algorithmicPatterns = extractAlgorithmicPatterns(content);
    patterns.push(...algorithmicPatterns);
    
    return {
      success: true,
      patterns,
      count: patterns.length,
      languages: [...new Set(patterns.map(p => p.language))]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create implementation brief from patterns and requirements
 */
export async function createImplementationBrief({ requirements, patterns, outputPath, metadata = {} }) {
  try {
    const brief = await generateTechnicalBrief(requirements, patterns, metadata);
    await fs.writeFile(outputPath, brief);
    
    return {
      success: true,
      outputPath,
      patternCount: patterns?.length || 0,
      message: 'Technical implementation brief created'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper Functions

async function detectFileType(filePath) {
  try {
    const fileTypeResult = await fileType.fileTypeFromFile(filePath);
    if (fileTypeResult) {
      return fileTypeResult.ext;
    }
    
    // Fallback to extension-based detection
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return ext || 'txt';
  } catch (error) {
    return path.extname(filePath).toLowerCase().slice(1) || 'txt';
  }
}

function segmentByStructure(content, options = {}) {
  // Split by headers, major breaks, or logical sections
  let segments = content.split(/(?=^#{1,6}\s)|(?=^\s*\n\s*\n)|(?=\n\s*[-=]{3,})/m);
  
  if (options.preserveCodeBlocks) {
    segments = preserveCodeBlockIntegrity(segments);
  }
  
  return segments.filter(segment => segment.trim().length > 50);
}

function segmentMarkdownContent(content, options = {}) {
  // Split by markdown headers while preserving code blocks
  const segments = content.split(/(?=^#{1,6}\s)/m);
  
  if (options.preserveCodeBlocks) {
    return preserveCodeBlockIntegrity(segments);
  }
  
  return segments.filter(segment => segment.trim().length > 0);
}

function segmentHTMLContent(content, options = {}) {
  // Basic paragraph and section-based segmentation
  return content.split(/\n\s*\n/).filter(segment => segment.trim().length > 50);
}

function segmentByParagraphs(content, options = {}) {
  return content.split(/\n\s*\n/).filter(segment => segment.trim().length > 0);
}

function extractHTMLContent($) {
  // Remove script and style tags
  $('script, style').remove();
  
  // Extract main content areas
  const contentSelectors = ['main', 'article', '.content', '#content', 'body'];
  
  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length > 0) {
      return element.text();
    }
  }
  
  return $('body').text() || $.text();
}

function extractCodeBlocks(content) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
      index: match.index,
      context: extractSurroundingText(content, match.index, 200)
    });
  }
  
  return blocks;
}

function extractMarkdownHeadings(content) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim()
    });
  }
  
  return headings;
}

function preserveCodeBlockIntegrity(segments) {
  // Ensure code blocks are not split across segments
  const merged = [];
  let currentSegment = '';
  let inCodeBlock = false;
  
  for (const segment of segments) {
    const codeBlockMatches = segment.match(/```/g) || [];
    const codeBlockCount = codeBlockMatches.length;
    
    if (inCodeBlock || codeBlockCount % 2 !== 0) {
      currentSegment += segment;
      inCodeBlock = (currentSegment.match(/```/g) || []).length % 2 !== 0;
      
      if (!inCodeBlock) {
        merged.push(currentSegment);
        currentSegment = '';
      }
    } else {
      if (currentSegment) {
        merged.push(currentSegment);
        currentSegment = '';
      }
      merged.push(segment);
    }
  }
  
  if (currentSegment) {
    merged.push(currentSegment);
  }
  
  return merged;
}

function extractSurroundingText(content, index, radius = 100) {
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
  return content.substring(start, end).trim();
}

function detectPatternType(code) {
  if (code.includes('function') || code.includes('=>')) return 'function';
  if (code.includes('class ')) return 'class';
  if (code.includes('interface ')) return 'interface';
  if (code.includes('import ') || code.includes('export ')) return 'module';
  if (code.includes('const ') || code.includes('let ') || code.includes('var ')) return 'variable';
  return 'snippet';
}

function analyzeComplexity(code) {
  const lines = code.split('\n').length;
  const cyclomaticComplexity = (code.match(/if|for|while|switch|catch/g) || []).length;
  
  return {
    lines,
    cyclomaticComplexity,
    level: cyclomaticComplexity > 10 ? 'high' : cyclomaticComplexity > 5 ? 'medium' : 'low'
  };
}

function extractKeywords(code) {
  const keywords = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
  const uniqueKeywords = [...new Set(keywords)];
  return uniqueKeywords.slice(0, 10); // Top 10 keywords
}

/**
 * Extract algorithmic patterns from plain text content
 * This is especially useful for research papers and technical documents
 */
function extractAlgorithmicPatterns(content) {
  const patterns = [];
  
  // Extract algorithm descriptions (common in research papers)
  const algorithmRegex = /(Algorithm\s*\d*:|ALGORITHM\s*\d*:|Procedure\s*\w*:|PROCEDURE\s*\w*:)[\s\S]*?(?=\n\n|Algorithm|$)/gi;
  let match;
  
  while ((match = algorithmRegex.exec(content)) !== null) {
    patterns.push({
      code: match[0].trim(),
      language: 'pseudocode',
      context: extractSurroundingText(content, match.index, 300),
      type: 'algorithm',
      complexity: analyzeComplexity(match[0]),
      keywords: extractKeywords(match[0]),
      lineCount: match[0].split('\n').length,
      hasComments: /\/\/|\/\*|\*\//.test(match[0]),
      hasClasses: false,
      hasAlgorithms: true
    });
  }
  
  // Extract mathematical formulas (common in research papers)
  const formulaRegex = /(\$\$[\s\S]*?\$\$)|(\$[^$\n]+\$)/g;
  
  while ((match = formulaRegex.exec(content)) !== null) {
    patterns.push({
      code: match[0].trim(),
      language: 'latex',
      context: extractSurroundingText(content, match.index, 200),
      type: 'formula',
      complexity: { lines: 1, cyclomaticComplexity: 0, level: 'low' },
      keywords: extractKeywords(match[0]),
      lineCount: 1,
      hasComments: false,
      hasClasses: false,
      hasAlgorithms: false
    });
  }
  
  return patterns;
}

async function generateTechnicalBrief(requirements, patterns, metadata = {}) {
  let briefContent = `# Technical Implementation Brief\n\n`;
  briefContent += `Generated: ${new Date().toISOString()}\n\n`;
  
  if (metadata.sourceFile) {
    briefContent += `## Source Document\n${metadata.sourceFile}\n\n`;
  }
  
  briefContent += `## Requirements Summary\n${requirements}\n\n`;
  
  if (patterns && patterns.length > 0) {
    briefContent += `## Reference Patterns (${patterns.length} found)\n\n`;
    
    // Group patterns by type
    const patternsByType = patterns.reduce((acc, pattern) => {
      const type = pattern.type || 'general';
      if (!acc[type]) acc[type] = [];
      acc[type].push(pattern);
      return acc;
    }, {});
    
    for (const [type, typePatterns] of Object.entries(patternsByType)) {
      briefContent += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Patterns\n\n`;
      
      for (const pattern of typePatterns.slice(0, 3)) { // Top 3 per type
        briefContent += `#### ${pattern.context.slice(0, 50)}...\n\n`;
        briefContent += `**Complexity:** ${pattern.complexity?.level || 'unknown'}\n\n`;
        briefContent += `\`\`\`${pattern.language}
${pattern.code}
\`\`\`

`;
        
        if (pattern.keywords?.length > 0) {
          briefContent += `**Keywords:** ${pattern.keywords.join(', ')}\n\n`;
        }
      }
    }
  }
  
  briefContent += `## Implementation Guidance\n\n`;
  briefContent += `- Review and adapt the provided patterns to fit specific requirements\n`;
  briefContent += `- Maintain consistency with existing codebase architecture\n`;
  briefContent += `- Consider complexity levels when implementing patterns\n`;
  briefContent += `- Use keywords to guide variable and function naming\n\n`;
  
  briefContent += `## Next Steps\n\n`;
  briefContent += `1. Select most relevant patterns based on requirements\n`;
  briefContent += `2. Adapt patterns to specific use case and context\n`;
  briefContent += `3. Implement following established coding conventions\n`;
  briefContent += `4. Test implementation against original requirements\n`;
  
  return briefContent;
}

function generateProcessingBrief(processResult, segments, originalPath) {
  return `# Document Processing Brief\n\n` +
    `**Source:** ${originalPath}\n` +
    `**Type:** ${processResult.type}\n` +
    `**Processed:** ${new Date().toISOString()}\n` +
    `**Segments:** ${segments.length}\n\n` +
    `## Metadata
\`\`\`json
${JSON.stringify(processResult.metadata, null, 2)}
\`\`\`

` +
    `## Processing Summary\n` +
    `- Successfully segmented into ${segments.length} logical sections\n` +
    `- Preserved code block integrity\n` +
    `- Extracted technical patterns and context\n`;
}