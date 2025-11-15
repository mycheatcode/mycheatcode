// Server-safe version of parseCheatCode that can be used in API routes
// This is a stripped-down version without client-only dependencies

export interface ParsedCheatCode {
  title: string;
  category: string;
  description: string;
  cards: Array<{
    type: 'what' | 'when' | 'how' | 'why' | 'remember' | 'phrase';
    content: string;
    stepNumber?: number;
    totalSteps?: number;
  }>;
}

// Convert markdown format to CARD format
function convertMarkdownToCardFormat(markdown: string): string {
  // Extract title from **🏀 Title**
  const titleMatch = markdown.match(/\*\*🏀\s*(.+?)\*\*/);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Code';

  // Extract subtitle/category from *"Subtitle"*
  const subtitleMatch = markdown.match(/\*"(.+?)"\*/);
  const category = subtitleMatch ? subtitleMatch[1].trim() : '';

  // Start building CARD format
  let cardFormat = `TITLE: ${title}\n`;
  cardFormat += `CATEGORY: ${category}\n`;
  cardFormat += `DESCRIPTION: \n\n`;

  // Extract What section
  const whatMatch = markdown.match(/\*\*What:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/);
  if (whatMatch) {
    cardFormat += `CARD: What\n${whatMatch[1].trim()}\n\n`;
  }

  // Extract When section
  const whenMatch = markdown.match(/\*\*When:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/);
  if (whenMatch) {
    cardFormat += `CARD: When\n${whenMatch[1].trim()}\n\n`;
  }

  // Extract How section and split by bullet points
  const howMatch = markdown.match(/\*\*How:\*\*\s*([\s\S]+?)(?=\n\*\*(?:Why|Remember|Cheat Code Phrase):|$)/);
  if (howMatch) {
    const howContent = howMatch[1].trim();

    // Split by bullet points - support •, *, -, or numbered lists (1., 2., etc)
    let steps = howContent.split(/(?:^|\n)\s*(?:[•\*\-]|\d+\.)\s+/);

    // Filter out empty strings from the split
    steps = steps.filter(step => step.trim()).map(step => step.trim());

    // FALLBACK 1: If we only got 1 step but content has multiple numbered items, try splitting by numbers only
    if (steps.length === 1 && howContent.match(/\d+\./g) && (howContent.match(/\d+\./g) || []).length > 1) {
      steps = howContent.split(/\s*\d+\.\s+/);
      if (steps[0] && /^\d+\.\s+/.test(howContent)) {
        steps[0] = steps[0].replace(/^\d+\.\s+/, '');
      }
      steps = steps.filter(step => step.trim()).map(step => step.trim());
    }

    // FALLBACK 2: If still only 1 step, try splitting by just the bullet character
    if (steps.length === 1 && (howContent.match(/[•\*\-]/g) || []).length > 1) {
      steps = howContent.split(/[•\*\-]/);
      steps = steps.filter(step => step.trim()).map(step => step.trim());
    }

    // FALLBACK 3: If STILL only 1 step and it contains newlines, split by newlines and clean up bullets
    if (steps.length === 1 && howContent.includes('\n')) {
      steps = howContent.split('\n').map(line => line.replace(/^[\s•\*\-\d.]+/, '').trim()).filter(s => s);
    }

    // Only create multiple cards if we actually have multiple steps
    if (steps.length > 0) {
      steps.forEach((step, index) => {
        cardFormat += `CARD: How - Step ${index + 1}\n${step}\n\n`;
      });
    }
  }

  // Extract Why section (stop before Remember or Cheat Code Phrase)
  const whyMatch = markdown.match(/\*\*Why:\*\*\s*([^\n]+(?:\n(?!\*\*(?:Remember|Cheat Code Phrase):)[^\n]+)*)/);
  if (whyMatch) {
    cardFormat += `CARD: Why\n${whyMatch[1].trim()}\n\n`;
  }

  // Extract Remember section (stop before Cheat Code Phrase)
  const rememberMatch = markdown.match(/\*\*Remember:\*\*\s*([^\n]+(?:\n(?!\*\*Cheat Code Phrase:)[^\n]+)*)/);
  if (rememberMatch) {
    cardFormat += `CARD: Remember\n${rememberMatch[1].trim()}\n\n`;
  }

  // Extract Cheat Code Phrase
  const phraseMatch = markdown.match(/\*\*Cheat Code Phrase:\*\*\s*"(.+?)"/);
  if (phraseMatch) {
    cardFormat += `CARD: Cheat Code Phrase\n${phraseMatch[1].trim()}\n`;
  }

  return cardFormat;
}

export function parseCheatCode(codeBlock: string): ParsedCheatCode | null {
  try {
    // Check if this is markdown format (contains **🏀)
    const isMarkdown = codeBlock.includes('**🏀');

    if (isMarkdown) {
      codeBlock = convertMarkdownToCardFormat(codeBlock);
    }

    const lines = codeBlock.trim().split('\n');

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
      } else if (trimmedLine.startsWith('CATEGORY:')) {
        category = trimmedLine.substring(9).trim();
      } else if (trimmedLine.startsWith('DESCRIPTION:')) {
        description = trimmedLine.substring(12).trim();
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
          } else if (cardType === 'remember') {
            cards.push({ type: 'remember', content: currentCard.content.trim() });
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
        currentCard.content += (currentCard.content ? '\n' : '') + trimmedLine;
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
      } else if (cardType === 'remember') {
        cards.push({ type: 'remember', content: currentCard.content.trim() });
      } else if (cardType.includes('phrase')) {
        cards.push({ type: 'phrase', content: currentCard.content.trim() });
      }
    }

    // Update totalSteps for all How cards
    const howCards = cards.filter(c => c.type === 'how');
    const totalHowSteps = howCards.length;
    howCards.forEach(card => {
      card.totalSteps = totalHowSteps;
    });

    if (!title) {
      return null;
    }

    return {
      title,
      category,
      description,
      cards
    };
  } catch (error) {
    console.error('Error parsing cheat code:', error);
    return null;
  }
}
