import ts from 'typescript';
import { CodeNode } from '../../../../graph/types';

export abstract class MethodCallExtractor {
  protected abstract getLanguage(): string;
  protected abstract getMethodCallRegex(): RegExp;
  protected abstract createMethodCallNode(
    fileNode: CodeNode,
    call: {
      methodName: string;
      className: string | null;
      lineNumber: number;
      fullMatch: string;
    }
  ): CodeNode;

  extract(fileNode: CodeNode, sourceCode: string): CodeNode[] {
    const methodCalls: CodeNode[] = [];
    const lines = sourceCode.split('\n');
    const regex = this.getMethodCallRegex();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;
      while ((match = regex.exec(line)) !== null) {
        methodCalls.push(
          this.createMethodCallNode(fileNode, {
            methodName: match[2],
            className: match[1] || null,
            lineNumber: i + 1,
            fullMatch: match[0].trim(),
          })
        );
      }
    }
    return methodCalls;
  }
}