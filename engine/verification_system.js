import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { z } from 'zod';
import { generateObject } from 'ai';

async function extractKeyTerms(content, prompt, aiProviders, config) {
  const { getModelForTier } = aiProviders;
  const { client, modelName } = getModelForTier('b_tier', null, config);
  const { object } = await generateObject({
    model: client(modelName),
    prompt: `${prompt}
---
DOCUMENT:
${content}`,
    schema: z.object({
      terms: z.array(z.string()),
    }),
  });
  return object.terms;
}

async function verifyCodebaseContains(terms) {
  const files = await glob('**/*', { nodir: true, cwd: process.cwd(), ignore: ['node_modules/**', 'dist/**', '.git/**'] });
  let foundCount = 0;
  for (const term of terms) {
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        if (content.includes(term)) {
          foundCount++;
          break;
        }
      } catch (error) {
        // Ignore files that can't be read (e.g. binary files)
      }
    }
  }
  return (foundCount / terms.length) * 100;
}

export async function verifyMilestone(milestoneDescription, aiProviders, config) {
  try {
    // const configPath = path.join(process.cwd(), 'stigmergy.config.js'); // No longer need to import here
    // const { default: config } = await import(`file://${configPath}`); // No longer need to import here
    
    const archPath = config.documentation.architecture_prd;
    const prdPath = config.documentation.prd;

    if (!fs.existsSync(archPath) || !fs.existsSync(prdPath)) {
        return { success: false, details: { error: "Documentation files not found." } };
    }

    const archContent = await fs.readFile(archPath, 'utf-8');
    const prdContent = await fs.readFile(prdPath, 'utf-8');

    const archTerms = await extractKeyTerms(archContent, 'Extract key architectural terms from this document.', aiProviders, config);
    const prdGoals = await extractKeyTerms(prdContent, 'Extract key product goals from this document.', aiProviders, config);

    const codebaseMatchPercentage = await verifyCodebaseContains([...archTerms, ...prdGoals]);

    if (codebaseMatchPercentage > 50) {
      return { success: true, details: { codebaseMatchPercentage } };
    } else {
      return { success: false, details: { codebaseMatchPercentage, reason: 'Low codebase match.' } };
    }
  } catch (error) {
    return { success: false, details: { error: error.message } };
  }
}