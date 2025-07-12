const fs = require('fs').promises;
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const path = require('path');

async function parseFile(filePath, projectRoot) {
  const code = await fs.readFile(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath);

  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const nodes = [];
  const relationships = [];

  // Add a node for the file itself
  nodes.push({ id: relativePath, type: 'File', name: path.basename(relativePath) });

  traverse(ast, {
    ImportDeclaration(astPath) {
      const importSource = astPath.node.source.value;
      const absoluteImportPath = path.join(path.dirname(relativePath), importSource);
      relationships.push({ source: relativePath, target: absoluteImportPath, type: 'IMPORTS' });
    },
    FunctionDeclaration(astPath) {
      const functionName = astPath.node.id.name;
      const functionId = `${relativePath}#${functionName}`;
      nodes.push({ id: functionId, type: 'Function', name: functionName });
      relationships.push({ source: relativePath, target: functionId, type: 'CONTAINS' });

      // Find calls within this function
      astPath.traverse({
        CallExpression(callPath) {
          const calleeName = callPath.get('callee').toString();
          // This is a simplified lookup. A real implementation would need scope resolution.
          relationships.push({ source: functionId, target: calleeName, type: 'CALLS' });
        },
      });
    },
    ClassDeclaration(astPath) {
        const className = astPath.node.id.name;
        const classId = `${relativePath}#${className}`;
        nodes.push({ id: classId, type: 'Class', name: className });
        relationships.push({ source: relativePath, target: classId, type: 'CONTAINS' });

        if(astPath.node.superClass) {
            const superClassName = astPath.node.superClass.name;
            relationships.push({ source: classId, target: superClassName, type: 'INHERITS_FROM' });
        }
    }
  });

  return { nodes, relationships };
}

module.exports = { parseFile };
