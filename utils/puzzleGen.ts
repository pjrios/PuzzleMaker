import { WordPair, GridCell, CrosswordLayout } from '../types';

// Simple seeded random number generator
class Random {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export const cleanWord = (w: string) => w.toUpperCase().replace(/[^A-ZÑÁÉÍÓÚÜ]/g, '');

export function shuffleArray<T>(array: T[], seed: number): T[] {
  if (!Array.isArray(array)) return [];
  const rng = new Random(seed);
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// --- Word Search Logic ---

export const generateWordSearch = (words: WordPair[], size: number, seed: number) => {
  const rng = new Random(seed);
  const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
  const placedWords: { word: string; x: number; y: number; dx: number; dy: number }[] = [];

  const directions = [
    { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
    { dx: -1, dy: 0 }, { dx: 0, dy: -1 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 }
  ];

  // Sort by length descending to place large words first
  const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);

  for (const item of sortedWords) {
    const term = cleanWord(item.word);
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const dir = directions[Math.floor(rng.next() * directions.length)];
      const startX = Math.floor(rng.next() * size);
      const startY = Math.floor(rng.next() * size);

      // Check boundary
      const endX = startX + (term.length - 1) * dir.dx;
      const endY = startY + (term.length - 1) * dir.dy;

      if (endX >= 0 && endX < size && endY >= 0 && endY < size) {
        // Check collisions
        let fits = true;
        for (let i = 0; i < term.length; i++) {
          const charAtGrid = grid[startY + i * dir.dy][startX + i * dir.dx];
          if (charAtGrid !== '' && charAtGrid !== term[i]) {
            fits = false;
            break;
          }
        }

        if (fits) {
          for (let i = 0; i < term.length; i++) {
            grid[startY + i * dir.dy][startX + i * dir.dx] = term[i];
          }
          placedWords.push({ word: term, x: startX, y: startY, dx: dir.dx, dy: dir.dy });
          placed = true;
        }
      }
      attempts++;
    }
  }

  // Fill empty spots
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] === '') {
        grid[y][x] = alphabet[Math.floor(rng.next() * alphabet.length)];
      }
    }
  }

  return { grid, placedWords };
};

// --- Crossword Logic (Simplified Greedy) ---

export const generateCrossword = (words: WordPair[], seed: number): CrosswordLayout => {
  const gridSize = 40; // Increased virtual canvas size
  const center = Math.floor(gridSize / 2);
  let grid: GridCell[][] = Array(gridSize).fill(null).map((_, y) => 
    Array(gridSize).fill(null).map((_, x) => ({ char: null, x, y }))
  );
  
  const rng = new Random(seed);
  // Sort primarily by length, but randomize slightly to vary layouts on same word set
  const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);
  const placedWords: any[] = [];

  // Place first word horizontally in center
  if (sortedWords.length > 0) {
    const first = sortedWords[0];
    const term = cleanWord(first.word);
    const startX = center - Math.floor(term.length / 2);
    
    for (let i = 0; i < term.length; i++) {
      grid[center][startX + i].char = term[i];
    }
    placedWords.push({
      word: term,
      clue: first.definition,
      x: startX,
      y: center,
      direction: 'across'
    });
  }

  // Try to place remaining words
  for (let i = 1; i < sortedWords.length; i++) {
    const currentPair = sortedWords[i];
    const term = cleanWord(currentPair.word);
    let placed = false;

    // Scan existing grid for matching letters
    // Randomized traversal to avoid sticking everything to the top-left
    const scanOrder: {x: number, y: number}[] = [];
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x].char) scanOrder.push({x, y});
        }
    }
    // Shuffle scan points slightly
    // scanOrder.sort(() => rng.next() - 0.5); // Optional: randomness

    for (const {x, y} of scanOrder) {
        if (placed) break;
        const cellChar = grid[y][x].char!;
        if (term.includes(cellChar)) {
           // Find all indices of this char in the new word
           const possibleIndices = [];
           for(let k=0; k<term.length; k++) if(term[k] === cellChar) possibleIndices.push(k);
           
           for (const charIdx of possibleIndices) {
             // Heuristic: If occupied horizontally, go vertical, else horizontal
             const isOccupiedHorizontally = (grid[y][x+1]?.char !== null && grid[y][x+1]?.char !== undefined) || 
                                            (grid[y][x-1]?.char !== null && grid[y][x-1]?.char !== undefined);
             const isOccupiedVertically = (grid[y+1]?.[x]?.char !== null && grid[y+1]?.[x]?.char !== undefined) || 
                                          (grid[y-1]?.[x]?.char !== null && grid[y-1]?.[x]?.char !== undefined);

             let direction: 'across' | 'down' | null = null;
             if (isOccupiedHorizontally && !isOccupiedVertically) direction = 'down';
             else if (isOccupiedVertically && !isOccupiedHorizontally) direction = 'across';
             else if (!isOccupiedHorizontally && !isOccupiedVertically) direction = rng.next() > 0.5 ? 'across' : 'down';
             
             if (!direction) continue;

             const startX = direction === 'across' ? x - charIdx : x;
             const startY = direction === 'down' ? y - charIdx : y;

             // Validate bounds and collisions
             let fits = true;
             
             for(let k=0; k<term.length; k++) {
               const cx = direction === 'across' ? startX + k : startX;
               const cy = direction === 'down' ? startY + k : startY;
               
               if(cx < 0 || cx >= gridSize || cy < 0 || cy >= gridSize) { fits = false; break; }
               
               const cell = grid[cy][cx];
               // Collision with different letter
               if (cell.char !== null && cell.char !== term[k]) { fits = false; break; }
               
               // Adjacency check: Ensure we don't place letters next to existing words tangentially
               // If this cell is empty in grid, it shouldn't have neighbors perpendicular to direction
               // (unless it's the intersection point)
               if (cell.char === null) {
                   const n1 = direction === 'across' ? grid[cy-1]?.[cx]?.char : grid[cy][cx-1]?.char;
                   const n2 = direction === 'across' ? grid[cy+1]?.[cx]?.char : grid[cy][cx+1]?.char;
                   if (n1 || n2) { fits = false; break; }
               }
               
               // Check start/end bounds (should not extend an existing word)
               if (k === 0) {
                   const prev = direction === 'across' ? grid[cy][cx-1]?.char : grid[cy-1]?.[cx]?.char;
                   if (prev) { fits = false; break; }
               }
               if (k === term.length - 1) {
                   const next = direction === 'across' ? grid[cy][cx+1]?.char : grid[cy+1]?.[cx]?.char;
                   if (next) { fits = false; break; }
               }
             }

             if (fits) {
                // Place it
                for(let k=0; k<term.length; k++) {
                   const cx = direction === 'across' ? startX + k : startX;
                   const cy = direction === 'down' ? startY + k : startY;
                   grid[cy][cx].char = term[k];
                }
                placedWords.push({
                  word: term,
                  clue: currentPair.definition,
                  x: startX,
                  y: startY,
                  direction
                  // number assigned later
                });
                placed = true;
                break;
             }
           }
        }
    }
  }

  // Crop Grid
  let minX = gridSize, maxX = 0, minY = gridSize, maxY = 0;
  placedWords.forEach(w => {
    minX = Math.min(minX, w.x);
    maxX = Math.max(maxX, w.direction === 'across' ? w.x + w.word.length : w.x + 1);
    minY = Math.min(minY, w.y);
    maxY = Math.max(maxY, w.direction === 'down' ? w.y + w.word.length : w.y + 1);
  });

  // Add padding
  minX = Math.max(0, minX - 1);
  minY = Math.max(0, minY - 1);
  
  const width = (maxX - minX) + 2;
  const height = (maxY - minY) + 2;
  
  const croppedGrid = Array(height).fill(null).map((_, y) => 
    Array(width).fill(null).map((_, x) => {
      const globalY = y + minY;
      const globalX = x + minX;
      if (globalY < gridSize && globalX < gridSize) {
         // IMPORTANT: x and y in the cell must match the grid index (0..width-1)
         return { ...grid[globalY][globalX], x, y };
      }
      return { char: null, x, y };
    })
  );

  // Fix Placed Words Coordinates
  const shiftedWords = placedWords.map(w => ({
    ...w,
    x: w.x - minX,
    y: w.y - minY
  }));

  // Assign Numbers Spatially (Row-major)
  const starts = new Set<string>();
  shiftedWords.forEach(w => starts.add(`${w.x},${w.y}`));
  
  const sortedStarts = Array.from(starts).map(s => {
    const [x, y] = s.split(',').map(Number);
    return { x, y };
  }).sort((a, b) => a.y - b.y || a.x - b.x);

  const numberMap = new Map<string, number>();
  sortedStarts.forEach((pos, idx) => {
    numberMap.set(`${pos.x},${pos.y}`, idx + 1);
  });

  const finalWords = shiftedWords.map(w => ({
    ...w,
    number: numberMap.get(`${w.x},${w.y}`)!
  }));

  return { grid: croppedGrid, placedWords: finalWords, width, height };
};

// --- Scramble Word ---
export const scrambleWord = (word: string, seed: number) => {
  const arr = word.split('');
  return shuffleArray(arr, seed).join('');
};