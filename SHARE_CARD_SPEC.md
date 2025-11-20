# Share Card System - Complete Specification

## Overview
The Share Card system enables users to create shareable visual representations of their basketball mental performance achievements. The system generates branded cards with radar visualizations and achievement data that can be shared across social media platforms.

## Core Components

### 1. ShareCard Component (`/components/ShareCard.tsx`)

**Purpose**: Main component that renders the shareable card modal with visual elements and sharing options.

**Key Features**:
- Full-screen modal overlay with blur effect
- Branded card with gradient background (zinc-900 to black)
- HomepageRadar integration for accurate data visualization
- Social media sharing with platform-specific handling
- Dynamic content based on card type

**Props Interface**:
```typescript
interface ShareCardProps {
  data: ShareCardData;
  onShare?: (platform: string) => void;
  onDismiss?: () => void;
  className?: string;
}
```

**Visual Elements**:
- Brand mark: "mycheatcode" positioned in top-left corner
- Radar visualization: 288x288px (w-72 h-72) with real data
- Performance level titles: "Activated", "Rising", "Elevated", "Limitless"
- Overall statistics: Average percentage and key features (streaks/green sections)
- Action buttons: Twitter/X, Instagram, Messages, Copy Link, Close

**Sharing Implementation**:
- **Twitter/X**: Opens tweet compose window with pre-filled text
- **Instagram**: Copies text to clipboard with user instruction
- **Messages**: Uses Web Share API or clipboard fallback
- **Copy Link**: Copies share text to clipboard

### 2. ShareCardData Interface (`/app/utils/engagementSystem.ts`)

**Data Structure**:
```typescript
export interface ShareCardData {
  type: 'green_hold' | 'full_radar' | 'milestone' | 'radar_snapshot';
  title: string;
  subtitle: string;
  visualData: {
    greenHoldDays?: number;
    radarCompletion?: number;
    sectionColor?: 'red' | 'orange' | 'yellow' | 'green';
    greenHoldData?: Record<string, number>;
    radarData?: {
      preGame: number;
      preGameColor: 'red' | 'orange' | 'yellow' | 'green';
      inGame: number;
      inGameColor: 'red' | 'orange' | 'yellow' | 'green';
      postGame: number;
      postGameColor: 'red' | 'orange' | 'yellow' | 'green';
      offCourt: number;
      offCourtColor: 'red' | 'orange' | 'yellow' | 'green';
      lockerRoom: number;
      lockerRoomColor: 'red' | 'orange' | 'yellow' | 'green';
    };
  };
  timestamp: number;
}
```

### 3. Share Card Types

#### A. Radar Snapshot (`radar_snapshot`)
- **Purpose**: Share overall performance status
- **Title**: Dynamic performance level based on overall percentage
- **Subtitle**: "My Status"
- **Visual**: Complete radar with all section data
- **Stats Display**: Overall average percentage + longest streak OR green sections count
- **Share Text**: `"[Title] 🎯 Locked In. No Days Off. Built with mycheatcode"`

#### B. Green Hold (`green_hold`)
- **Purpose**: Celebrate sustained green performance in specific section
- **Title**: "[X] Days Green"
- **Subtitle**: Section name
- **Visual**: Radar + center highlight showing days count
- **Share Text**: `"[Title] in [Subtitle] 💚 Locked in with mycheatcode"`

#### C. Full Radar (`full_radar`)
- **Purpose**: Celebrate achieving all sections green
- **Title**: "Full Radar Unlocked"
- **Subtitle**: "All Sections Green"
- **Visual**: Perfect green radar (all sections at 100%)
- **Share Text**: `"[Title] 🎯 Locked In. No Days Off. Built with mycheatcode"`

#### D. Milestone (`milestone`)
- **Purpose**: Celebrate specific section achievements
- **Title**: Custom achievement title
- **Subtitle**: Achievement description
- **Visual**: Radar + section-specific highlight
- **Share Text**: `"[Title] - [Subtitle] Built with mycheatcode"`

### 4. Performance Level System

**Level Calculation** (based on overall radar percentage):
```typescript
function getPerformanceLevel(percentage: number): string {
  if (percentage >= 75) return 'Limitless';
  if (percentage >= 50) return 'Elevated';
  if (percentage >= 25) return 'Rising';
  return 'Activated';
}
```

**Thresholds**:
- **Activated**: 0-24% (Building foundation)
- **Rising**: 25-49% (Making progress)
- **Elevated**: 50-74% (Strong performance)
- **Limitless**: 75-100% (Peak performance)

### 5. Integration Points

#### Homepage Integration (`/app/page.tsx`)
- **Share Button**: Located at bottom of radar section
- **Data Source**: Real-time radar state from `useSectionRadar` hook
- **Share Handler**:
  ```typescript
  const handleShare = () => {
    if (!radarState) return;

    // Collect Green Hold data
    const greenHoldData: Record<string, number> = {};
    // ... data processing

    // Generate and show share card
    const shareCard = generateShareCard('radar_snapshot', {
      title: `${Math.round(radarState.radarScore)}% Mental Performance`,
      subtitle: 'Locked in.',
      radarData: { /* real section scores */ },
      greenHoldData
    });

    showShareCard(shareCard);
  };
  ```

#### My Codes Page (`/app/my-codes/page.tsx`)
- **Status**: All sharing functionality removed as requested
- **Previous Features**: Demo share buttons and test functions completely removed

### 6. useShareCard Hook

**Purpose**: Manages share card state and modal display

**API**:
```typescript
export function useShareCard() {
  const [activeCard, setActiveCard] = useState<ShareCardData | null>(null);

  const showShareCard = (data: ShareCardData) => setActiveCard(data);
  const dismissShareCard = () => setActiveCard(null);

  return { activeCard, showShareCard, dismissShareCard };
}
```

### 7. Visual Design Specifications

#### Card Dimensions & Layout
- **Modal**: Full screen with `bg-black/50 backdrop-blur-sm`
- **Card**: `max-w-sm w-full` with gradient background
- **Radar**: 288x288px (18rem) centered
- **Brand Mark**: Top-left, `text-zinc-500 text-xs` uppercase
- **Content**: Centered layout with consistent spacing

#### Color Scheme
- **Background**: `bg-gradient-to-br from-zinc-900 to-black`
- **Border**: `border-white/10`
- **Text**: Primary white, secondary `text-zinc-300`
- **Brand**: `text-zinc-500`
- **Buttons**:
  - Social: `bg-zinc-800 hover:bg-zinc-700`
  - Copy: `bg-white/10 hover:bg-white/20`
  - Close: `bg-zinc-800 hover:bg-zinc-700`

#### Typography
- **Title**: `text-2xl font-bold leading-tight`
- **Subtitle**: `text-sm font-medium`
- **Stats**: `text-xl font-bold` for values, `text-xs text-zinc-400` for labels
- **Brand**: `text-xs uppercase tracking-wide font-medium`

### 8. Data Flow

1. **User Trigger**: User clicks share button on homepage
2. **Data Collection**: `handleShare` collects current radar state and green hold data
3. **Card Generation**: `generateShareCard` creates ShareCardData object
4. **Modal Display**: `showShareCard` updates state to show modal
5. **User Interaction**: User selects sharing platform or dismisses
6. **Platform Handling**: Platform-specific sharing logic executes
7. **Cleanup**: Modal dismisses and state resets

### 9. Share Text Templates

**Template Patterns**:
- Green Hold: `"[Days] Days Green in [Section] 💚 Locked in with mycheatcode"`
- Full Radar: `"Full Radar Unlocked 🎯 Locked In. No Days Off. Built with mycheatcode"`
- Milestone: `"[Title] - [Subtitle] Built with mycheatcode"`
- Radar Snapshot: `"[Performance Level] 🎯 Locked In. No Days Off. Built with mycheatcode"`

### 10. Technical Implementation Notes

#### HomepageRadar Integration
- **Data Format**: ShareCard passes flat numeric values and color strings
- **Props Used**: `size="medium"`, `showLabels={false}`, `showGreenHoldBadges={false}`, `disableAnimations={true}`
- **Responsive**: Same radar component used across all screen sizes

#### State Management
- **Local State**: Modal visibility managed by `useShareCard` hook
- **Data Source**: Real-time radar data from section radar system
- **Persistence**: No persistence required - cards generated on-demand

#### Error Handling
- **Missing Data**: Fallback to default values (0 scores, 'red' colors)
- **Share Failures**: User feedback via alerts for clipboard operations
- **Network Issues**: Share URLs handle network failures gracefully

### 11. Future Considerations

#### Potential Enhancements
- **Image Generation**: Server-side image generation for better social media integration
- **Customization**: User-selectable card themes or layouts
- **Analytics**: Track sharing frequency and platform preferences
- **Templates**: Additional card types for specific achievements

#### Accessibility
- **Keyboard Navigation**: Full keyboard support for modal interactions
- **Screen Readers**: ARIA labels for visual elements
- **Color Contrast**: High contrast maintained throughout design
- **Focus Management**: Proper focus handling for modal lifecycle

This specification covers the complete Share Card system as implemented, including all recent changes and the removal of functionality from the My Codes page.