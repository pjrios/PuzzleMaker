import React, { useMemo } from 'react';
import { AppState, PuzzleType, WordPair } from '../types';
import { generateWordSearch, generateCrossword, scrambleWord, shuffleArray, cleanWord } from '../utils/puzzleGen';

interface Props {
  state: AppState;
}

// Sub-component for rendering a single page to allow efficient re-use for "Print All"
const PuzzlePage: React.FC<{
  type: PuzzleType;
  vocabList: WordPair[];
  state: AppState; // Pass full state for config
}> = ({ type, vocabList, state }) => {
  const { title, institution, logoUrl, course, trimester, groups, seed, showWordBank, showAnswerKey, settings } = state;

  // --- Renderers (Memoized per page) ---

  const renderWordSearch = () => {
    const { grid, placedWords } = useMemo(() => 
      generateWordSearch(vocabList, settings.gridSize, seed), 
      [vocabList, settings.gridSize, seed]
    );

    return (
      <div className="flex flex-col items-center w-full">
        <div className="wordsearch-grid grid gap-0 border-2 border-black mb-8 w-full max-w-[7in]"
             style={{ gridTemplateColumns: `repeat(${settings.gridSize}, minmax(0, 1fr))` }}>
          {grid.map((row, y) => (
            row.map((char, x) => {
              const isAnswer = showAnswerKey && placedWords.some(w => {
                 for(let k=0; k<w.word.length; k++) {
                   if (w.x + k*w.dx === x && w.y + k*w.dy === y) return true;
                 }
                 return false;
              });
              
              return (
                <div key={`${x}-${y}`} 
                     className={`wordsearch-cell aspect-square flex items-center justify-center font-mono text-base sm:text-lg uppercase border border-gray-200 
                     ${isAnswer ? 'bg-yellow-200 text-black font-bold' : ''}`}>
                  {char}
                </div>
              );
            })
          ))}
        </div>

        {showWordBank && (
          <div className="wordbank w-full">
            <h3 className="font-bold border-b-2 border-black mb-4 pb-1">Word Bank</h3>
            <div className="wordbank-grid grid grid-cols-3 gap-4 text-sm">
              {vocabList.map(w => (
                <div key={w.id} className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black"></div>
                  <span>{w.word}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCrossword = () => {
    const { grid, placedWords, width, height } = useMemo(() => 
      generateCrossword(vocabList, seed), 
      [vocabList, seed]
    );

    const acrossClues = placedWords.filter(w => w.direction === 'across').sort((a,b) => a.number - b.number);
    const downClues = placedWords.filter(w => w.direction === 'down').sort((a,b) => a.number - b.number);

    return (
      <div className="w-full flex flex-col gap-8">
        <div className="flex justify-center w-full">
          <div className="grid"
               style={{ 
                 gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
                 width: '100%',
                 maxWidth: '100%',
                 aspectRatio: `${width}/${height}`
               }}>
            {grid.flat().map((cell, idx) => {
               // Find if any word starts here to determine if we show a number.
               // Since we fixed the coords in puzzleGen, cell.x/y matches placedWords.x/y
               const startWord = placedWords.find(w => w.x === cell.x && w.y === cell.y);
               const hasChar = cell.char !== null;
               
               return (
                 <div key={idx} className={`relative flex items-center justify-center
                   ${hasChar ? 'border border-black bg-white' : ''}`}>
                   {startWord && <span className="absolute top-0.5 left-0.5 text-[8px] leading-none font-bold z-10">{startWord.number}</span>}
                   {showAnswerKey && hasChar ? <span className="font-mono font-bold uppercase text-[10px] sm:text-sm">{cell.char}</span> : null}
                 </div>
               )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <h3 className="font-bold border-b border-black mb-2">Across</h3>
            <ul className="list-none space-y-2">
              {acrossClues.map(w => (
                <li key={`a-${w.number}`}><strong>{w.number}.</strong> {w.clue}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold border-b border-black mb-2">Down</h3>
            <ul className="list-none space-y-2">
              {downClues.map(w => (
                <li key={`d-${w.number}`}><strong>{w.number}.</strong> {w.clue}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderMatching = () => {
    const shuffledDefs = useMemo(() => {
        try {
            const res = shuffleArray(vocabList, seed + 1);
            return Array.isArray(res) ? res : [];
        } catch (e) {
            return [];
        }
    }, [vocabList, seed]);
    
    const safeShuffledDefs = Array.isArray(shuffledDefs) ? shuffledDefs : [];

    return (
      <div className="w-full grid grid-cols-2 gap-8 text-sm">
        <div>
          <h3 className="font-bold mb-4 text-center">Words</h3>
          <div className="space-y-6">
            {vocabList.map((w, i) => {
               const defIndex = safeShuffledDefs.findIndex(d => d.id === w.id);
               return (
                 <div key={w.id} className="flex items-baseline gap-2">
                   <span className="w-6 border-b border-black inline-block text-center font-bold">
                      {showAnswerKey && defIndex !== -1 ? String.fromCharCode(65 + defIndex) : ''}
                   </span>
                   <span>{i + 1}. {w.word}</span>
                 </div>
               );
            })}
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-4 text-center">Definitions</h3>
           <div className="space-y-6">
            {safeShuffledDefs.map((w, i) => (
               <div key={w.id} className="flex items-baseline gap-2">
                 <span className="font-bold">{String.fromCharCode(65 + i)}.</span>
                 <span>{w.definition}</span>
               </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAnagrams = () => {
    return (
      <div className="w-full space-y-6">
        {vocabList.map((w, i) => (
           <div key={w.id} className="flex gap-4 items-center border-b border-dotted border-gray-300 pb-2 print-break-inside-avoid">
             <div className="w-1/4 font-mono text-lg tracking-widest text-right font-bold uppercase">
               {scrambleWord(cleanWord(w.word), seed + i)}
             </div>
             <div className="w-1/2 flex flex-col justify-center">
                <span className="text-sm italic text-gray-600">{w.definition}</span>
             </div>
             <div className="w-1/4 border-b border-black h-8 flex items-end px-2 text-primary font-bold">
                {showAnswerKey ? w.word : ''}
             </div>
           </div>
        ))}
      </div>
    );
  };

  const renderFlashcards = () => {
    return (
      <div className="w-full flex-1 flex">
        <div className="w-full grid grid-cols-2 grid-rows-5 gap-4 flex-1">
        {vocabList.map(w => (
           <div key={w.id} className="border-2 border-dashed border-gray-400 p-4 h-full flex flex-col justify-between print-break-inside-avoid">
              <div className="text-center border-b pb-2 mb-2 font-bold text-xl">{w.word}</div>
              <div className="text-center text-sm flex-1 flex items-center justify-center">{w.definition}</div>
           </div>
        ))}
        </div>
      </div>
    );
  };

  const renderFillIn = () => {
    // Shuffle definitions for the quiz
    const shuffled = useMemo(() => {
      try {
        const res = shuffleArray(vocabList, seed + 2);
        return Array.isArray(res) ? res : [];
      } catch (e) { return []; }
    }, [vocabList, seed]);

    return (
      <div className="w-full space-y-8">
        {showWordBank && (
          <div className="border p-4 mb-6 rounded bg-gray-50">
            <h3 className="font-bold text-center mb-2">Word Bank</h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
               {vocabList.map(w => <span key={w.id} className="px-2 py-1 border rounded">{w.word}</span>)}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {shuffled.map((w, i) => (
             <div key={w.id} className="flex gap-4 items-start print-break-inside-avoid">
               <span className="font-bold w-6 pt-1">{i + 1}.</span>
               <div className="flex-1">
                  <div className="mb-1">{w.definition}</div>
               </div>
               <div className="w-1/3 border-b-2 border-black min-h-[1.5rem] relative">
                  {showAnswerKey && <span className="absolute bottom-1 left-0 text-indigo-600 font-bold font-mono">{w.word}</span>}
               </div>
             </div>
          ))}
        </div>
      </div>
    );
  };

  // Determine standard title based on type
  const typeTitles: Record<string, string> = {
    wordsearch: 'Word Search',
    crossword: 'Crossword Puzzle',
    matching: 'Matching Quiz',
    anagram: 'Word Scramble',
    fillin: 'Vocabulary Quiz',
    flashcards: 'Flashcards'
  };

  return (
    <div className={`print-page print-page-${type} bg-white shadow-2xl mx-auto my-8 print:shadow-none print:m-0`}>
      <div className="page-inner w-full h-full p-[0.75in] box-border mx-auto bg-white flex flex-col items-center">
        
        {type !== 'flashcards' && (
          <div className="page-header w-full border-b-2 border-black pb-4 mb-6">
            <div className="page-header-top flex items-center mb-4 relative min-h-[5rem]">
               {logoUrl && (
                 <div className="absolute left-0 top-0 bottom-0 flex items-center">
                   <img 
                     src={logoUrl} 
                     alt="Logo" 
                     className="h-20 w-auto object-contain"
                     onError={(e) => { e.currentTarget.style.display = 'none'; }}
                   />
                 </div>
               )}
               <div className="w-full text-center px-24"> {/* Padding to prevent text overlapping logo */}
                  <h2 className="text-xl font-bold uppercase tracking-wider">{institution}</h2>
               </div>
            </div>
            
            <div className="flex justify-between text-sm border-b border-gray-300 pb-2 mb-4">
              <div><span className="font-bold">Class:</span> {course}</div>
              <div><span className="font-bold">Term:</span> {trimester}</div>
              <div><span className="font-bold">Group:</span> {groups}</div>
            </div>

            <div className="flex justify-between items-end">
              <div className="flex-1">
                {/* Ensure title size matches institution size exactly (text-xl uppercase tracking-wider) */}
                <h1 className="text-xl font-bold uppercase tracking-wider">{title || typeTitles[type] || 'Activity'}</h1>
                <p className="text-sm mt-1 uppercase tracking-widest text-gray-600">{typeTitles[type]}</p>
              </div>
              <div className="text-right text-sm w-1/3">
                 <div className="mb-2 border-b border-black border-dotted pb-1 flex justify-between">
                   <span>Name:</span> 
                   <span className="w-32"></span>
                 </div>
                 <div className="border-b border-black border-dotted pb-1 flex justify-between">
                   <span>Date:</span>
                   <span className="w-32"></span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {vocabList.length === 0 ? (
          <div className="text-gray-400 italic mt-10">Add words to generate puzzle...</div>
        ) : (
          <>
            {type === 'wordsearch' && renderWordSearch()}
            {type === 'crossword' && renderCrossword()}
            {type === 'matching' && renderMatching()}
            {type === 'anagram' && renderAnagrams()}
            {type === 'fillin' && renderFillIn()}
            {type === 'flashcards' && renderFlashcards()}
          </>
        )}
      </div>
    </div>
  );
};

const PuzzlePreview: React.FC<Props> = ({ state }) => {
  const vocabList = Array.isArray(state.vocabList) ? state.vocabList : [];

  const chunkWords = (list: WordPair[], size: number) => {
    const chunks: WordPair[][] = [];
    for (let i = 0; i < list.length; i += size) {
      chunks.push(list.slice(i, i + size));
    }
    return chunks.length > 0 ? chunks : [[]];
  };
  
  if (state.puzzleType === 'all') {
    const types: PuzzleType[] = ['wordsearch', 'crossword', 'matching', 'anagram', 'fillin', 'flashcards'];
    const pages: Array<{ type: PuzzleType; vocab: WordPair[]; key: string }> = [];

    types.forEach((t) => {
      if (t === 'flashcards') {
        const chunks = chunkWords(vocabList, 10);
        chunks.forEach((chunk, idx) => {
          pages.push({ type: t, vocab: chunk, key: `${t}-${idx}` });
        });
      } else {
        pages.push({ type: t, vocab: vocabList, key: t });
      }
    });

    return (
      <div id="print-area">
        {pages.map((page, index) => (
          <div key={page.key} className={index < pages.length - 1 ? "print-page-break mb-12" : ""}>
             <PuzzlePage type={page.type} vocabList={page.vocab} state={state} />
          </div>
        ))}
      </div>
    );
  }

  if (state.puzzleType === 'flashcards') {
    const chunks = chunkWords(vocabList, 10);
    return (
      <div id="print-area">
        {chunks.map((chunk, index) => (
          <div key={`flashcards-${index}`} className={index < chunks.length - 1 ? "print-page-break mb-12" : ""}>
            <PuzzlePage type="flashcards" vocabList={chunk} state={state} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div id="print-area">
      <PuzzlePage type={state.puzzleType} vocabList={vocabList} state={state} />
    </div>
  );
};

export default PuzzlePreview;
