import React, { useState, useEffect } from 'react';
import VocabularyInput from './components/VocabularyInput';
import PuzzlePreview from './components/PuzzlePreview';
import { AppState, PuzzleType } from './types';
import { saveState, loadState } from './utils/db';
import { Printer, RefreshCcw, Save } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    vocabList: [],
    puzzleType: 'wordsearch',
    title: 'Vocabulary Activity',
    institution: 'Academia Internacional David',
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDd-14En3zTggFUEUDF2AofqgVl1UB33ktBQ&s',
    course: 'Robotics and Technology',
    trimester: '3rd Trimester',
    groups: '5A & 5B & 5C',
    seed: Date.now(),
    showWordBank: true,
    showAnswerKey: false,
    settings: {
      gridSize: 15,
      scramble: true,
      includeDistractors: false,
    },
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadState().then((saved) => {
      if (saved) {
        // Ensure new fields exist if loading from old state
        setAppState({
          ...saved,
          vocabList: Array.isArray(saved.vocabList) ? saved.vocabList : [],
          institution: saved.institution || 'Academia Internacional David',
          logoUrl: saved.logoUrl !== undefined ? saved.logoUrl : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDd-14En3zTggFUEUDF2AofqgVl1UB33ktBQ&s',
          course: saved.course || 'Robotics and Technology',
          trimester: saved.trimester || '3rd Trimester',
          groups: saved.groups || '5A & 5B & 5C'
        });
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveState(appState);
    }
  }, [appState, isLoaded]);

  const updateState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = () => {
    updateState({ seed: Date.now() });
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-gray-100">
      
      {/* Sidebar Controls - No Print */}
      <aside className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto no-print z-10 shadow-lg">
        <header className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            LexiPuzzle
          </h1>
          <p className="text-xs text-gray-500">Static Puzzle Generator</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Step 1: Input */}
          <VocabularyInput 
            words={appState.vocabList} 
            onUpdate={(list) => updateState({ vocabList: list })} 
          />

          {/* Step 2: Config */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-800">2. Header Info</h2>
            
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Institution</label>
                <input 
                  type="text" 
                  value={appState.institution}
                  onChange={(e) => updateState({ institution: e.target.value })}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="School Name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Logo URL (Optional)</label>
                <input 
                  type="text" 
                  value={appState.logoUrl}
                  onChange={(e) => updateState({ logoUrl: e.target.value })}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="https://example.com/logo.png or ./logo.jpg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Class / Subject</label>
                <input 
                  type="text" 
                  value={appState.course}
                  onChange={(e) => updateState({ course: e.target.value })}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Class Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Trimester</label>
                  <input 
                    type="text" 
                    value={appState.trimester}
                    onChange={(e) => updateState({ trimester: e.target.value })}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Term"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Groups</label>
                  <input 
                    type="text" 
                    value={appState.groups}
                    onChange={(e) => updateState({ groups: e.target.value })}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="e.g. 5A & 5B"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Activity Title</label>
                <input 
                  type="text" 
                  value={appState.title}
                  onChange={(e) => updateState({ title: e.target.value })}
                  className="w-full p-2 border rounded text-sm font-medium"
                  placeholder="Puzzle Title"
                />
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4 text-gray-800">3. Puzzle Settings</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Puzzle Type</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {(['wordsearch', 'crossword', 'matching', 'anagram', 'fillin', 'flashcards'] as PuzzleType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => updateState({ puzzleType: t })}
                    className={`px-3 py-2 text-sm rounded capitalize border 
                      ${appState.puzzleType === t 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    {t === 'fillin' ? 'Short Answer' : t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => updateState({ puzzleType: 'all' })}
                className={`w-full px-3 py-2 text-sm rounded uppercase font-bold tracking-wide border 
                  ${appState.puzzleType === 'all' 
                    ? 'bg-indigo-800 text-white border-indigo-800' 
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'}`}
              >
                Generate All Puzzles (Pack)
              </button>
            </div>

            {appState.puzzleType === 'wordsearch' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Grid Size: {appState.settings.gridSize}</label>
                <input 
                  type="range" min="10" max="25"
                  value={appState.settings.gridSize}
                  onChange={(e) => updateState({ settings: { ...appState.settings, gridSize: parseInt(e.target.value) } })}
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-2">
               {['wordsearch', 'crossword', 'fillin'].includes(appState.puzzleType) && (
                 <label className="flex items-center space-x-2">
                   <input 
                     type="checkbox" 
                     checked={appState.showWordBank} 
                     onChange={(e) => updateState({ showWordBank: e.target.checked })} 
                   />
                   <span className="text-sm">Show Word Bank</span>
                 </label>
               )}
               
               <label className="flex items-center space-x-2">
                 <input 
                   type="checkbox" 
                   checked={appState.showAnswerKey} 
                   onChange={(e) => updateState({ showAnswerKey: e.target.checked })} 
                 />
                 <span className="text-sm font-semibold text-indigo-600">Show Answer Key</span>
               </label>
            </div>
          </div>
        </div>

        <footer className="p-4 border-t bg-gray-50 flex gap-2">
           <button 
             onClick={handleRegenerate}
             className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium"
           >
             <RefreshCcw size={16} /> Regenerate
           </button>
           <button 
             onClick={handlePrint}
             className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
           >
             <Printer size={16} /> Print
           </button>
        </footer>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 overflow-auto bg-gray-200 relative">
        <div className="min-h-full p-8 flex justify-center items-start">
           <PuzzlePreview state={appState} />
        </div>
      </main>

    </div>
  );
};

export default App;