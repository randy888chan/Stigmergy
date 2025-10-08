import ts from 'typescript';
import { Framework, FrameworkDetector } from '../../../types';

export class TypeScriptFrameworkDetector implements FrameworkDetector {
  detect(sourceCode: string): Framework | null {
    if (this.isExpress(sourceCode)) {
      return { name: 'Express.js', language: 'typescript' };
    }
    if (this.isHono(sourceCode)) {
      return { name: 'Hono.js', language: 'typescript' };
    }
    if (this.isReact(sourceCode)) {
      return { name: 'React', language: 'typescript' };
    }
    return null;
  }

  private isExpress(sourceCode: string): boolean {
    return /from 'express'|require\('express'\)/.test(sourceCode);
  }

  private isHono(sourceCode: string): boolean {
    return /from 'hono'|require\('hono'\)/.test(sourceCode);
  }

  private isReact(sourceCode: string): boolean {
    return /from 'react'|require\('react'\)/.test(sourceCode);
  }
}