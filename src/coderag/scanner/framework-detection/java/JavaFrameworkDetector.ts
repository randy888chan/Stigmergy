import { Framework, FrameworkDetector } from '../../../types';

export class JavaFrameworkDetector implements FrameworkDetector {
  detect(sourceCode: string): Framework | null {
    if (this.isSpring(sourceCode)) {
      return { name: 'Spring', language: 'java' };
    }
    if (this.isJAXRS(sourceCode)) {
      return { name: 'JAX-RS', language: 'java' };
    }
    return null;
  }

  private isSpring(sourceCode: string): boolean {
    return /import org\.springframework\./.test(sourceCode);
  }

  private isJAXRS(sourceCode: string): boolean {
    return /import javax\.ws\.rs\./.test(sourceCode);
  }
}