export interface ParsedMethodCall {
  targetMethod: string;
  callType: 'instance' | 'static' | 'constructor' | 'super' | 'function';
  lineNumber: number;
  callerObject?: string;
}

export interface MethodCallExtractionResult {
  calls: ParsedMethodCall[];
  errors: string[];
}