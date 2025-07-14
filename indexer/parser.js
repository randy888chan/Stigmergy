const fs = require('fs').promises;
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const path = require('path');

async function parseFile(filePath, projectRoot) {
  // We only use babel for JS/TS files. Other files are just nodes.
  const relativePath = path.relative(projectRoot, filePath);
  const ext = path.extname(filePath);

  const nodes = [];
  const relationships = [];

  // Add a node for the file itself
  nodes.push({ id: relativePath, type: 'File', name: path.basename(relativePath), language: ext.substring(1) });
  
  if (!['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
    return { nodes, relationships };
  }

  const code = await fs.readFile(filePath, 'utf8');

  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true, // Attempt to parse even with errors
  });

  traverse(ast, {
    ImportDeclaration(astPath) {
      const importSource = astPath.node.source.value;
      // Basic resolution. A real system would resolve aliases from tsconfig/jsconfig.
      const resolvedImport = path.resolve(path.dirname(relativePath), importSource);
      const relativeImportPath = path.relative(projectRoot, resolvedImport);

      relationships.push({ source: relativePath, target: relativeImportPath, type: 'IMPORTS' });
    },
    FunctionDeclaration(astPath) {
      if (astPath.node.id) {
        const functionName = astPath.node.id.name;
        const functionId = `${relativePath}#${functionName}`;
        nodes.push({ id: functionId, type: 'Function', name: functionName });
        relationships.push({ source: relativePath, target: functionId, type: 'DEFINES' });
      }
    },
    ClassDeclaration(astPath) {
      if (astPath.node.id) {
        const className = astPath.node.id.name;
        const classId = `${relativePath}#${className}`;
        nodes.push({ id: classId, type: 'Class', name: className });
        relationships.push({ source: relativePath, target: classId, type: 'DEFINES' });

        if(astPath.node.superClass) {
            const superClassName = astPath.node.superClass.name;
            // Note: This relies on name resolution. A full implementation is more complex.
            relationships.push({ source: classId, target: superClassName, type: 'INHERITS' });
        }
      }
    }
  });

  return { nodes, relationships };
}

module.exports = { parseFile };
