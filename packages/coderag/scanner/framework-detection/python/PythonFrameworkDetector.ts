import { Framework, FrameworkDetector } from '../../../types';

export class PythonFrameworkDetector implements FrameworkDetector {
  detect(sourceCode: string): Framework | null {
    if (this.isDjango(sourceCode)) {
      return { name: 'Django', language: 'python' };
    }
    if (this.isFlask(sourceCode)) {
      return { name: 'Flask', language: 'python' };
    }
    return null;
  }

  private isDjango(sourceCode: string): boolean {
    return /from django\./.test(sourceCode);
  }

  private isFlask(sourceCode: string): boolean {
    return /from flask import/.test(sourceCode);
  }
}