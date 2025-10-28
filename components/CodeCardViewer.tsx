'use client';

import { useState } from 'react';

export interface ParsedCheatCode {
  title: string;
  category: string;
  description: string;
  cards: Array<{
    type: 'what' | 'when' | 'how' | 'why' | 'phrase';
    content: string;
    stepNumber?: number;
    totalSteps?: number;
  }>;
}

export function parseCheatCode(codeBlock: string): ParsedCheatCode | null {
  try {
    console.log('📝 PARSING CODE BLOCK');
    console.log('First 200 chars:', codeBlock.substring(0, 200));
    console.log('Total length:', codeBlock.length);

    const lines = codeBlock.trim().split('\n');
    console.log('Total lines:', lines.length);

    let title = '';
    let category = '';
    let description = '';
    const cards: ParsedCheatCode['cards'] = [];

    let currentCard: { type: string; content: string } | null = null;
    let howStepCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Parse header fields
      if (trimmedLine.startsWith('TITLE:')) {
        title = trimmedLine.substring(6).trim();
        console.log('✅ Found TITLE:', title);
      } else if (trimmedLine.startsWith('CATEGORY:')) {
        category = trimmedLine.substring(9).trim();
        console.log('✅ Found CATEGORY:', category);
      } else if (trimmedLine.startsWith('DESCRIPTION:')) {
        description = trimmedLine.substring(12).trim();
        console.log('✅ Found DESCRIPTION:', description);
      } else if (trimmedLine.startsWith('CARD:')) {
        // Save previous card if exists
        if (currentCard) {
          const cardType = currentCard.type.toLowerCase();
          if (cardType.startsWith('how')) {
            cards.push({
              type: 'how',
              content: currentCard.content.trim(),
              stepNumber: howStepCount,
              totalSteps: 0 // Will be updated later
            });
          } else if (cardType === 'what') {
            cards.push({ type: 'what', content: currentCard.content.trim() });
          } else if (cardType === 'when') {
            cards.push({ type: 'when', content: currentCard.content.trim() });
          } else if (cardType === 'why') {
            cards.push({ type: 'why', content: currentCard.content.trim() });
          } else if (cardType.includes('phrase')) {
            cards.push({ type: 'phrase', content: currentCard.content.trim() });
          }
        }

        // Start new card
        const cardName = trimmedLine.substring(5).trim();
        if (cardName.toLowerCase().startsWith('how')) {
          howStepCount++;
        }
        currentCard = { type: cardName, content: '' };
      } else if (currentCard && trimmedLine) {
        // Add content to current card
        if (currentCard.content) {
          currentCard.content += '\n' + trimmedLine;
        } else {
          currentCard.content = trimmedLine;
        }
      }
    }

    // Save last card
    if (currentCard) {
      const cardType = currentCard.type.toLowerCase();
      if (cardType.startsWith('how')) {
        cards.push({
          type: 'how',
          content: currentCard.content.trim(),
          stepNumber: howStepCount,
          totalSteps: 0
        });
      } else if (cardType === 'what') {
        cards.push({ type: 'what', content: currentCard.content.trim() });
      } else if (cardType === 'when') {
        cards.push({ type: 'when', content: currentCard.content.trim() });
      } else if (cardType === 'why') {
        cards.push({ type: 'why', content: currentCard.content.trim() });
      } else if (cardType.includes('phrase')) {
        cards.push({ type: 'phrase', content: currentCard.content.trim() });
      }
    }

    // Update total steps for all "how" cards
    const totalHowSteps = cards.filter(c => c.type === 'how').length;
    cards.forEach(card => {
      if (card.type === 'how') {
        card.totalSteps = totalHowSteps;
      }
    });

    console.log('📊 PARSE SUMMARY:');
    console.log('- Title:', title || '❌ MISSING');
    console.log('- Category:', category || '❌ MISSING');
    console.log('- Description:', description || '(empty)');
    console.log('- Cards found:', cards.length);
    console.log('- Card types:', cards.map(c => c.type).join(', '));

    if (!title || !category || cards.length === 0) {
      console.error('❌ PARSE FAILED: Missing required fields');
      console.error('Has title?', !!title);
      console.error('Has category?', !!category);
      console.error('Has cards?', cards.length > 0);
      return null;
    }

    console.log('✅ PARSE SUCCESSFUL!');
    return { title, category, description, cards };
  } catch (error) {
    console.error('❌ PARSE ERROR:', error);
    return null;
  }
}

interface CodeCardViewerProps {
  parsedCode: ParsedCheatCode;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export default function CodeCardViewer({ parsedCode, onSave, showSaveButton = true }: CodeCardViewerProps) {
  const [currentCard, setCurrentCard] = useState(0);

  // Build full cards array including title card
  const allCards = [
    { type: 'title' as const, title: parsedCode.title, category: parsedCode.category, description: parsedCode.description },
    ...parsedCode.cards
  ];

  const nextCard = () => {
    if (currentCard < allCards.length - 1) {
      setCurrentCard(currentCard + 1);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const card = allCards[currentCard];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Card Container */}
      <div className="rounded-2xl p-6 lg:p-10 min-h-[400px] lg:min-h-[500px] flex relative border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        {/* Left Arrow - Centered */}
        <button
          onClick={prevCard}
          disabled={currentCard === 0}
          className={`absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
            currentCard === 0
              ? 'cursor-not-allowed opacity-30'
              : 'active:scale-95 hover:bg-white/5'
          }`}
          style={{ color: currentCard === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Right Arrow - Centered */}
        <button
          onClick={nextCard}
          disabled={currentCard === allCards.length - 1}
          className={`absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
            currentCard === allCards.length - 1
              ? 'cursor-not-allowed opacity-30'
              : 'active:scale-95 hover:bg-white/5'
          }`}
          style={{ color: currentCard === allCards.length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Card Content */}
        <div className="flex-1 flex flex-col justify-between px-4 lg:px-6 py-4 lg:py-6 pb-3 lg:pb-4">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Title Card */}
            {card.type === 'title' && (
              <div className="space-y-6 lg:space-y-8">
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {card.title}
                </h1>
                <div className="h-px w-16 lg:w-20 mx-auto" style={{ backgroundColor: 'var(--card-border)' }}></div>
                <div className="text-xs lg:text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  {card.category}
                </div>
                {card.description && (
                  <p className="text-sm lg:text-base leading-relaxed max-w-md" style={{ color: 'var(--text-secondary)' }}>
                    {card.description}
                  </p>
                )}
              </div>
            )}

            {/* What Card */}
            {card.type === 'what' && (
              <div className="space-y-6 lg:space-y-8 max-w-md">
                <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                  What
                </div>
                <p className="text-xl lg:text-2xl font-medium leading-[1.4]" style={{ color: 'var(--text-primary)' }}>
                  {card.content}
                </p>
              </div>
            )}

            {/* When Card */}
            {card.type === 'when' && (
              <div className="space-y-6 lg:space-y-8 max-w-md">
                <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                  When
                </div>
                <p className="text-xl lg:text-2xl font-medium leading-[1.4]" style={{ color: 'var(--text-primary)' }}>
                  {card.content}
                </p>
              </div>
            )}

            {/* How Card (Step) */}
            {card.type === 'how' && (
              <div className="space-y-6 lg:space-y-8 max-w-lg">
                <div className="space-y-2 lg:space-y-3">
                  <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                    How
                  </div>
                  <div className="text-xs lg:text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    Step {card.stepNumber} of {card.totalSteps}
                  </div>
                </div>
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl border flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <span className="font-bold text-lg lg:text-xl" style={{ color: 'var(--text-primary)' }}>{card.stepNumber}</span>
                  </div>
                  <p className="text-lg lg:text-xl font-medium leading-[1.5] text-left flex-1" style={{ color: 'var(--text-primary)' }}>
                    {card.content}
                  </p>
                </div>
              </div>
            )}

            {/* Why Card */}
            {card.type === 'why' && (
              <div className="space-y-6 lg:space-y-8 max-w-lg">
                <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                  Why
                </div>
                <div className="space-y-4 lg:space-y-6">
                  {card.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-base lg:text-lg font-medium leading-[1.6]" style={{ color: 'var(--text-primary)' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Phrase Card (Final) */}
            {card.type === 'phrase' && (
              <div className="space-y-8 lg:space-y-10 w-full max-w-md">
                <div className="text-[10px] lg:text-xs uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                  Your Cheat Code Phrase
                </div>
                <div className="space-y-6 lg:space-y-8">
                  <p className="text-2xl lg:text-4xl font-bold leading-[1.2]" style={{ color: 'var(--text-primary)' }}>
                    "{card.content}"
                  </p>

                  {showSaveButton && onSave && (
                    <div className="space-y-3 lg:space-y-4">
                      <button
                        onClick={onSave}
                        className="w-full py-4 lg:py-5 rounded-xl font-semibold text-base lg:text-lg transition-all active:scale-95"
                        style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
                      >
                        Save to My Codes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Branding */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex items-center justify-between text-[9px] lg:text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              <span>MYCHEATCODE.AI</span>
              <span>Card {currentCard + 1} of {allCards.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {allCards.map((_, index) => (
          <div
            key={index}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: index === currentCard ? '2rem' : '0.375rem',
              backgroundColor: index === currentCard ? '#ffffff' : '#2a2a2a'
            }}
          />
        ))}
      </div>
    </div>
  );
}
