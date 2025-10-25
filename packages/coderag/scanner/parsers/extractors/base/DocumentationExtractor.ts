export abstract class BaseDocumentationExtractor {
  public abstract extractDocumentation(
    content: string,
    position: number
  ): string | undefined;

  protected joinLines(lines: string[]): string {
    return lines.join('\n');
  }

  protected cleanCommentMarkers(
    rawContent: string,
    patterns: RegExp[]
  ): string {
    let cleaned = rawContent;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    return cleaned.trim();
  }

  protected isEmptyOrComment(line: string, commentMarkers: string[]): boolean {
    const trimmedLine = line.trim();
    if (!trimmedLine) return true;
    return commentMarkers.some((marker) => trimmedLine.startsWith(marker));
  }
}