import React, { useState, useEffect, useRef } from 'react';
import VocabularyInput from './components/VocabularyInput';
import PuzzlePreview from './components/PuzzlePreview';
import { AppState, PuzzleType } from './types';
import { saveState, loadState } from './utils/db';
import { Printer, RefreshCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { t, Locale } from './utils/i18n';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    vocabList: [],
    puzzleType: 'wordsearch',
    locale: 'en',
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
  const [printImages, setPrintImages] = useState<string[] | null>(null);
  const printCaptureRef = useRef<HTMLDivElement | null>(null);
  const [openSection, setOpenSection] = useState<'input' | 'header' | 'settings' | null>('input');
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isDesktop, setIsDesktop] = useState(false);
  const isResizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(384);

  useEffect(() => {
    loadState().then((saved) => {
      if (saved) {
        // Ensure new fields exist if loading from old state
        setAppState({
          ...saved,
          vocabList: Array.isArray(saved.vocabList) ? saved.vocabList : [],
          locale: saved.locale || 'en',
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

  useEffect(() => {
    document.documentElement.lang = appState.locale || 'en';
  }, [appState.locale]);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    setIsDesktop(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  const locale = appState.locale || 'en';
  const translate = (key: string, vars?: Record<string, string | number>) => t(locale, key, vars);

  const updateState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  const clampSidebarWidth = (width: number) => Math.min(520, Math.max(280, width));

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    isResizingRef.current = true;
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = e.clientX - resizeStartXRef.current;
      setSidebarWidth(clampSidebarWidth(resizeStartWidthRef.current + delta));
    };

    const handleMouseUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handlePrint = () => {
    const captureAndPrint = async () => {
      if (!printCaptureRef.current) {
        window.print();
        return;
      }

      const pages = Array.from(printCaptureRef.current.querySelectorAll('.print-page'));
      if (pages.length === 0) {
        window.print();
        return;
      }

      try {
        const images: string[] = [];
        for (const page of pages) {
          const rect = (page as HTMLElement).getBoundingClientRect();
          const canvas = await html2canvas(page as HTMLElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
          images.push(canvas.toDataURL('image/png'));
        }

        setPrintImages(images);
        setTimeout(() => window.print(), 50);
      } catch (err) {
        console.error('Failed to render print images:', err);
        setPrintImages(null);
        window.print();
      }
    };

    captureAndPrint();
  };

  const handleRegenerate = () => {
    updateState({ seed: Date.now() });
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintImages(null);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  if (!isLoaded) return <div className="h-screen flex items-center justify-center">{translate('app.loading')}</div>;

  return (
    <div className={`app-root h-full flex flex-col md:flex-row overflow-hidden bg-gray-100 ${printImages ? 'print-images-ready' : ''}`}>
      
      {/* Sidebar Controls - No Print */}
      <aside
        className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto no-print z-10 shadow-lg"
        style={isDesktop ? { width: sidebarWidth, minWidth: 280, maxWidth: 520 } : undefined}
      >
        <header className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            LexiPuzzle
          </h1>
          <p className="text-xs text-gray-500">{translate('app.subtitle')}</p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">{translate('app.language')}</label>
            <select
              value={locale}
              onChange={(e) => updateState({ locale: e.target.value as Locale })}
              className="border rounded px-2 py-1 text-xs"
            >
              <option value="en">{translate('language.en')}</option>
              <option value="es">{translate('language.es')}</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              className="w-full text-left p-4 flex items-center justify-between"
              onClick={() => setOpenSection(prev => (prev === 'input' ? null : 'input'))}
              aria-expanded={openSection === 'input'}
            >
              <h2 className="text-xl font-bold text-gray-800">{translate('sidebar.inputTitle')}</h2>
              <span className="text-gray-400 text-lg">{openSection === 'input' ? '−' : '+'}</span>
            </button>
            {openSection === 'input' && (
              <div className="px-4 pb-4">
                <VocabularyInput
                  words={appState.vocabList}
                  onUpdate={(list) => updateState({ vocabList: list })}
                  locale={locale}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setOpenSection('header')}
                    className="px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {translate('app.next')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              className="w-full text-left p-4 flex items-center justify-between"
              onClick={() => setOpenSection(prev => (prev === 'header' ? null : 'header'))}
              aria-expanded={openSection === 'header'}
            >
              <h2 className="text-xl font-bold text-gray-800">{translate('sidebar.headerInfo')}</h2>
              <span className="text-gray-400 text-lg">{openSection === 'header' ? '−' : '+'}</span>
            </button>
            {openSection === 'header' && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{translate('sidebar.institution')}</label>
                  <input
                    type="text"
                    value={appState.institution}
                    onChange={(e) => updateState({ institution: e.target.value })}
                    className="w-full p-2 border rounded text-sm"
                    placeholder={translate('sidebar.institutionPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{translate('sidebar.logoUrl')}</label>
                  <input
                    type="text"
                    value={appState.logoUrl}
                    onChange={(e) => updateState({ logoUrl: e.target.value })}
                    className="w-full p-2 border rounded text-sm"
                    placeholder={translate('sidebar.logoUrlPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{translate('sidebar.course')}</label>
                  <input
                    type="text"
                    value={appState.course}
                    onChange={(e) => updateState({ course: e.target.value })}
                    className="w-full p-2 border rounded text-sm"
                    placeholder={translate('sidebar.coursePlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{translate('sidebar.trimester')}</label>
                    <input
                      type="text"
                      value={appState.trimester}
                      onChange={(e) => updateState({ trimester: e.target.value })}
                      className="w-full p-2 border rounded text-sm"
                      placeholder={translate('sidebar.trimesterPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{translate('sidebar.groups')}</label>
                    <input
                      type="text"
                      value={appState.groups}
                      onChange={(e) => updateState({ groups: e.target.value })}
                      className="w-full p-2 border rounded text-sm"
                      placeholder={translate('sidebar.groupsPlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{translate('sidebar.title')}</label>
                  <input
                    type="text"
                    value={appState.title}
                    onChange={(e) => updateState({ title: e.target.value })}
                    className="w-full p-2 border rounded text-sm font-medium"
                    placeholder={translate('sidebar.titlePlaceholder')}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => setOpenSection('settings')}
                    className="px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {translate('app.next')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              className="w-full text-left p-4 flex items-center justify-between"
              onClick={() => setOpenSection(prev => (prev === 'settings' ? null : 'settings'))}
              aria-expanded={openSection === 'settings'}
            >
              <h2 className="text-xl font-bold text-gray-800">{translate('sidebar.settings')}</h2>
              <span className="text-gray-400 text-lg">{openSection === 'settings' ? '−' : '+'}</span>
            </button>
            {openSection === 'settings' && (
              <div className="px-4 pb-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{translate('sidebar.puzzleType')}</label>
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
                        {translate(`puzzleType.${t}`)}
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
                    {translate('sidebar.generateAll')}
                  </button>
                </div>

                {appState.puzzleType === 'wordsearch' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {translate('sidebar.gridSize', { size: appState.settings.gridSize })}
                    </label>
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
                       <span className="text-sm">{translate('sidebar.showWordBank')}</span>
                     </label>
                   )}
                   
                   <label className="flex items-center space-x-2">
                     <input 
                       type="checkbox" 
                       checked={appState.showAnswerKey} 
                       onChange={(e) => updateState({ showAnswerKey: e.target.checked })} 
                     />
                     <span className="text-sm font-semibold text-indigo-600">{translate('sidebar.showAnswerKey')}</span>
                   </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="p-4 border-t bg-gray-50 flex gap-2">
           <button 
             onClick={handleRegenerate}
             className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium"
           >
             <RefreshCcw size={16} /> {translate('sidebar.regenerate')}
           </button>
           <button 
             onClick={handlePrint}
             className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
           >
             <Printer size={16} /> {translate('sidebar.print')}
           </button>
        </footer>
      </aside>

      {/* Sidebar Resize Handle */}
      <div
        className="hidden md:block w-2 cursor-col-resize bg-transparent hover:bg-gray-300/50 no-print"
        onMouseDown={handleResizeStart}
        role="separator"
        aria-orientation="vertical"
      />

      {/* Main Preview Area */}
      <main className="flex-1 overflow-auto bg-gray-200 relative print-hide">
        <div className="min-h-full p-8 flex justify-center items-start">
          <PuzzlePreview state={appState} locale={locale} />
        </div>
      </main>

      {/* Hidden print capture area */}
      <div className="print-capture" aria-hidden="true">
        <div ref={printCaptureRef}>
          <PuzzlePreview state={appState} locale={locale} />
        </div>
      </div>

      {/* Print-only rendered images */}
      {printImages && (
        <div className="print-only print-images">
          {printImages.map((src, idx) => (
            <img key={idx} src={src} alt={translate('app.printPageAlt', { number: idx + 1 })} className="print-page-image" />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
