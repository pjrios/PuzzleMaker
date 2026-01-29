import React, { useState, useEffect } from 'react';
import { WordPair } from '../types';
import { Locale, t } from '../utils/i18n';

interface Props {
  words: WordPair[];
  onUpdate: (words: WordPair[]) => void;
  locale: Locale;
}

const VocabularyInput: React.FC<Props> = ({ words, onUpdate, locale }) => {
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load population
    if (words.length > 0 && rawText === '') {
      setRawText(words.map(w => `${w.word}: ${w.definition}`).join('\n'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseText = (text: string) => {
    const lines = text.split('\n');
    const newWords: WordPair[] = [];
    const seen = new Set<string>();
    let parseError = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Regex to split by colon, dash, equal, or comma (first occurrence)
      const match = trimmed.match(/^([^:\-=\,]+)[:\-=\,](.+)$/);
      
      if (match) {
        const word = match[1].trim();
        const definition = match[2].trim();
        const lowerWord = word.toLowerCase();

        if (seen.has(lowerWord)) {
          // Skip duplicate, maybe warn
        } else {
          seen.add(lowerWord);
          newWords.push({
            id: crypto.randomUUID(),
            word,
            definition
          });
        }
      } else {
        // If line has text but doesn't match, simplistic fallback or ignore
        // Ideally show warning
      }
    });

    if (newWords.length === 0 && text.trim().length > 0) {
      parseError = t(locale, 'vocab.errorNoPairs');
    }

    setError(parseError);
    if (newWords.length > 0) {
      onUpdate(newWords);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseText(val);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-2 text-sm text-gray-500">
        {t(locale, 'vocab.acceptedFormats')} <code>Word: Definition</code>, <code>Word - Definition</code>
      </div>
      <textarea
        className="w-full min-h-[220px] h-56 p-4 border rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y bg-gray-50"
        placeholder={t(locale, 'vocab.placeholder')}
        value={rawText}
        onChange={handleTextChange}
      />
      {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
      
      <div className="mt-4 border-t pt-4">
        <h3 className="font-semibold text-gray-700 mb-2">{t(locale, 'vocab.preview', { count: words.length })}</h3>
        <div className="max-h-48 overflow-y-auto border rounded bg-gray-50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 w-1/3">{t(locale, 'vocab.word')}</th>
                <th className="p-2">{t(locale, 'vocab.definition')}</th>
              </tr>
            </thead>
            <tbody>
              {words.map(w => (
                <tr key={w.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">{w.word}</td>
                  <td className="p-2 text-gray-600 truncate max-w-xs">{w.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VocabularyInput;
