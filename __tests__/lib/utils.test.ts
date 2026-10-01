import { extractWikiLinks } from '@/lib/utils';

describe('utils', () => {
  describe('extractWikiLinks', () => {
    it('extracts single wiki link', () => {
      const content = 'Veja a [[Nota Importante]] aqui.';
      expect(extractWikiLinks(content)).toEqual(['nota importante']);
    });

    it('extracts multiple wiki links', () => {
      const content = 'Links para [[Nota 1]] e [[Nota 2]].';
      expect(extractWikiLinks(content)).toEqual(['nota 1', 'nota 2']);
    });

    it('handles wiki links with extra spaces', () => {
      const content = 'Link para [[  Nota com espaços  ]] aqui.';
      expect(extractWikiLinks(content)).toEqual(['nota com espaços']);
    });

    it('returns empty array for no wiki links', () => {
      const content = 'Texto sem links wiki.';
      expect(extractWikiLinks(content)).toEqual([]);
    });

    it('is case insensitive', () => {
      const content = '[[NOTA MAIÚSCULA]] e [[nota minúscula]]';
      expect(extractWikiLinks(content)).toEqual(['nota maiúscula', 'nota minúscula']);
    });

    it('ignores malformed brackets', () => {
      const content = '[Nota inválida] e [[Nota válida]]';
      expect(extractWikiLinks(content)).toEqual(['nota válida']);
    });
  });
});