import { relativeTimePt, wordCount } from '@/lib/format';

describe('format', () => {
  describe('relativeTimePt', () => {
    it('returns "Agora mesmo" for very recent dates', () => {
      const now = new Date().toISOString();
      expect(relativeTimePt(now)).toBe('Agora mesmo');
    });

    it('returns minutes ago for dates within an hour', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(relativeTimePt(fiveMinutesAgo)).toBe('Há 5 minutos');
    });

    it('returns singular minute for 1 minute ago', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      expect(relativeTimePt(oneMinuteAgo)).toBe('Há 1 minuto');
    });

    it('returns hours ago for dates within a day', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(relativeTimePt(twoHoursAgo)).toBe('2 horas atrás');
    });

    it('returns "Ontem" for 1 day ago', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(relativeTimePt(oneDayAgo)).toBe('Ontem');
    });

    it('returns days ago for dates within a week', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(relativeTimePt(threeDaysAgo)).toBe('3 dias atrás');
    });

    it('returns weeks ago for dates within a month', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      expect(relativeTimePt(twoWeeksAgo)).toBe('2 semanas atrás');
    });

    it('returns singular week for 1 week ago', () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(relativeTimePt(oneWeekAgo)).toBe('1 semana atrás');
    });

    it('returns months ago for older dates', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      expect(relativeTimePt(twoMonthsAgo)).toBe('2 mêses atrás');
    });
  });

  describe('wordCount', () => {
    it('returns 0 for empty string', () => {
      expect(wordCount('')).toBe(0);
    });

    it('returns 0 for whitespace only', () => {
      expect(wordCount('   \n\t  ')).toBe(0);
    });

    it('counts words correctly', () => {
      expect(wordCount('Olá mundo')).toBe(2);
    });

    it('handles multiple spaces', () => {
      expect(wordCount('Olá    mundo')).toBe(2);
    });

    it('handles newlines', () => {
      expect(wordCount('Olá\nmundo')).toBe(2);
    });

    it('handles punctuation', () => {
      expect(wordCount('Olá, mundo!')).toBe(2);
    });
  });
});