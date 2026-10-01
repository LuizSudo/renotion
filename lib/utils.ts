// Utility functions that can be used both client and server side

// Extrai links no estilo wiki [[Nota]] do conteúdo
export function extractWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim().toLowerCase());
  }
  return matches;
}