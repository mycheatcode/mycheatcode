/**
 * Premade Game Scenarios for Onboarding Cheat Codes
 * Each onboarding code has 4 pre-generated scenarios for instant game loading
 */

import type { GameScenario } from './types/game';

export const ONBOARDING_GAME_SCENARIOS: Record<string, GameScenario[]> = {
  // 1. Bounce Back Protocol - "Next play mentality"
  airball_laugh: [
    {
      id: 'airball_1',
      scenario: "You just airballed a wide-open three in front of the home crowd. What's your immediate thought?",
      options: [
        { id: 'a', text: "That was embarrassing, everyone saw that", isCorrect: false, feedback: "Dwelling on embarrassment keeps you stuck. Next play mentality means immediate reset." },
        { id: 'b', text: "Next play", isCorrect: true, feedback: "Perfect! You're not dwelling—you're moving forward instantly." },
        { id: 'c', text: "I should probably pass more now", isCorrect: false, feedback: "Don't change your game because of one miss. Stay aggressive with next play mentality." },
        { id: 'd', text: "Coach is going to sub me out", isCorrect: false, feedback: "That's future-thinking anxiety. Stay present: next play." }
      ]
    },
    {
      id: 'airball_2',
      scenario: "After a turnover, you hear someone in the stands laugh. How do you respond mentally?",
      options: [
        { id: 'a', text: "Shake it off and get back on defense", isCorrect: true, feedback: "Exactly! Physical reset helps trigger the mental reset. Next play." },
        { id: 'b', text: "Try to make up for it immediately", isCorrect: false, feedback: "Forcing plays to 'make up' for mistakes creates more mistakes. Just play the next play." },
        { id: 'c', text: "Wonder what they're thinking about me", isCorrect: false, feedback: "External opinions don't help your game. Focus on the next play." },
        { id: 'd', text: "Get frustrated and play harder", isCorrect: false, feedback: "Emotion without control isn't helpful. Stay composed: next play." }
      ]
    },
    {
      id: 'airball_3',
      scenario: "You miss a crucial free throw late in the game. What do you tell yourself?",
      options: [
        { id: 'a', text: "I always choke under pressure", isCorrect: false, feedback: "That's a identity statement that becomes self-fulfilling. Use next play mentality." },
        { id: 'b', text: "Get back and play defense", isCorrect: true, feedback: "Perfect! The free throw is done. Next play is defense." },
        { id: 'c', text: "I need to make the next one", isCorrect: false, feedback: "That's pressure-building. Just focus on the immediate next play, which is defense." },
        { id: 'd', text: "This game is over", isCorrect: false, feedback: "Game's not over until it's over. Next play mentality keeps you in it." }
      ]
    },
    {
      id: 'airball_4',
      scenario: "After getting blocked hard, what's your first thought?",
      options: [
        { id: 'a', text: "That's on video forever", isCorrect: false, feedback: "You're thinking about the past. Next play mentality means immediate forward focus." },
        { id: 'b', text: "Next opportunity to attack", isCorrect: true, feedback: "Yes! You're already thinking about your next chance. That's next play mentality." },
        { id: 'c', text: "I shouldn't drive on them again", isCorrect: false, feedback: "Don't let one play change your aggressiveness. Next play." },
        { id: 'd', text: "Everyone saw that", isCorrect: false, feedback: "External focus keeps you stuck. Get back to next play mentality." }
      ]
    }
  ],

  // 2. Filter System - "Take what helps, leave the rest"
  coach_yells: [
    {
      id: 'coach_1',
      scenario: "Coach yells 'What are you doing?!' after a mistake. What do you focus on?",
      options: [
        { id: 'a', text: "The emotion in their voice", isCorrect: false, feedback: "The emotion is noise. Filter for the instruction underneath." },
        { id: 'b', text: "What specific action needs to change", isCorrect: true, feedback: "Perfect! You're filtering for the useful instruction. Take what helps, leave the rest." },
        { id: 'c', text: "Whether they're mad at me personally", isCorrect: false, feedback: "That's personalizing coaching. Filter for what helps your game." },
        { id: 'd', text: "How loud they're being", isCorrect: false, feedback: "Volume doesn't equal value. Filter for the actual instruction." }
      ]
    },
    {
      id: 'coach_2',
      scenario: "Coach criticizes your effort in front of the team. What's your response?",
      options: [
        { id: 'a', text: "Feel embarrassed and defensive", isCorrect: false, feedback: "Emotions block the filter. Look for what you can actually use." },
        { id: 'b', text: "Extract the valid point about effort level", isCorrect: true, feedback: "Exactly! You're filtering out the delivery, keeping the useful feedback." },
        { id: 'c', text: "Think about how unfair that was", isCorrect: false, feedback: "Fairness thinking blocks learning. Filter for what helps." },
        { id: 'd', text: "Worry about what teammates think", isCorrect: false, feedback: "That's social anxiety, not useful feedback. Filter for what improves your game." }
      ]
    },
    {
      id: 'coach_3',
      scenario: "Coach says 'You're playing scared!' What do you take from that?",
      options: [
        { id: 'a', text: "They think I'm not tough enough", isCorrect: false, feedback: "You're interpreting character judgment. Filter for the behavioral instruction." },
        { id: 'b', text: "I need to be more aggressive", isCorrect: true, feedback: "Yes! You filtered harsh language for clear, actionable direction." },
        { id: 'c', text: "I should feel bad about myself", isCorrect: false, feedback: "Feeling bad doesn't help. Filter for what actually helps your game." },
        { id: 'd', text: "They don't believe in me", isCorrect: false, feedback: "That's assumption-making. Filter for the actual coaching point." }
      ]
    },
    {
      id: 'coach_4',
      scenario: "Coach snaps 'Move your feet!' in a harsh tone. What's the useful part?",
      options: [
        { id: 'a', text: "They're frustrated with me", isCorrect: false, feedback: "That's emotional interpretation. Filter for the technical instruction." },
        { id: 'b', text: "My footwork needs adjustment", isCorrect: true, feedback: "Perfect! You extracted the useful technical feedback, left the emotional charge." },
        { id: 'c', text: "I'm not playing well enough", isCorrect: false, feedback: "Too vague. Filter for the specific actionable instruction." },
        { id: 'd', text: "The tone of their voice", isCorrect: false, feedback: "Tone is noise. Filter for the instruction that helps your game." }
      ]
    }
  ],

  // 3. Keep Shooting - "Shooters shoot"
  miss_spiral: [
    {
      id: 'miss_1',
      scenario: "You're 5/7 from three, then miss your next shot. What's your mindset?",
      options: [
        { id: 'a', text: "I'm cooling off, better pass more", isCorrect: false, feedback: "One miss doesn't mean you're cold. Shooters shoot." },
        { id: 'b', text: "Shooters shoot - stay aggressive", isCorrect: true, feedback: "Exactly! You're not letting one miss change your identity as a scorer." },
        { id: 'c', text: "Don't want to mess up my percentage", isCorrect: false, feedback: "Stats thinking kills aggression. Shooters shoot." },
        { id: 'd', text: "Maybe I should drive instead", isCorrect: false, feedback: "Don't abandon what's working. Keep your shooter's mentality." }
      ]
    },
    {
      id: 'miss_2',
      scenario: "After hitting 3 straight shots, you miss an open look. What now?",
      options: [
        { id: 'a', text: "Get ready for my next shot", isCorrect: true, feedback: "Perfect! Short memory. You're staying in your shooter's mentality." },
        { id: 'b', text: "Hope I get another chance soon", isCorrect: false, feedback: "Don't 'hope' for chances—demand the ball. Shooters shoot." },
        { id: 'c', text: "That broke my rhythm", isCorrect: false, feedback: "Don't let one miss break anything. Shooters shoot through misses." },
        { id: 'd', text: "Be more selective with shot selection", isCorrect: false, feedback: "Overthinking kills shooters. Trust your shot." }
      ]
    },
    {
      id: 'miss_3',
      scenario: "You miss two in a row after being hot. Your thought?",
      options: [
        { id: 'a', text: "Shooters shoot - next one's going in", isCorrect: true, feedback: "Yes! Shooter's amnesia. Bad misses don't predict future misses." },
        { id: 'b', text: "I lost my touch", isCorrect: false, feedback: "Two misses doesn't mean lost touch. Shooters shoot." },
        { id: 'c', text: "Let someone else shoot for a bit", isCorrect: false, feedback: "Don't defer when you're a shooter. Stay aggressive." },
        { id: 'd', text: "I'm forcing it", isCorrect: false, feedback: "Don't overthink. Shooters shoot with confidence." }
      ]
    },
    {
      id: 'miss_4',
      scenario: "After a miss, you're open again immediately. What do you do?",
      options: [
        { id: 'a', text: "Shoot it without hesitation", isCorrect: true, feedback: "Perfect! No hesitation. That's shooter's mentality." },
        { id: 'b', text: "Pump fake and drive instead", isCorrect: false, feedback: "Don't lose confidence in your shot. Shooters shoot." },
        { id: 'c', text: "Look to pass first", isCorrect: false, feedback: "Open shot for a shooter means shoot. Don't overthink." },
        { id: 'd', text: "Make sure it's a good shot", isCorrect: false, feedback: "Open shots for shooters ARE good shots. Shoot it." }
      ]
    }
  ],

  // 4. Pressure Privilege - "This is what I've trained for"
  pressure_counting: [
    {
      id: 'pressure_1',
      scenario: "Tie game, 10 seconds left, coach calls your number. Your thought?",
      options: [
        { id: 'a', text: "What if I miss?", isCorrect: false, feedback: "That's outcome fear. This is what you've trained for." },
        { id: 'b', text: "This is what I've trained for", isCorrect: true, feedback: "Perfect! You're reframing pressure as opportunity. This is your moment." },
        { id: 'c', text: "I hope I don't let everyone down", isCorrect: false, feedback: "External pressure thinking. Focus on your training." },
        { id: 'd', text: "This is too much pressure", isCorrect: false, feedback: "Pressure is privilege. This is what you've trained for." }
      ]
    },
    {
      id: 'pressure_2',
      scenario: "Playoff game, crowd is loud, all eyes on you. How do you feel?",
      options: [
        { id: 'a', text: "Privileged to be in this moment", isCorrect: true, feedback: "Yes! You're viewing pressure as privilege. This is what you've trained for." },
        { id: 'b', text: "Nervous about the stakes", isCorrect: false, feedback: "Nerves are energy for what you've trained for. Reframe it." },
        { id: 'c', text: "Worried about the outcome", isCorrect: false, feedback: "Outcome thinking creates anxiety. Focus on what you've trained for." },
        { id: 'd', text: "Overwhelmed by the moment", isCorrect: false, feedback: "The moment is what you've trained for. It's your privilege." }
      ]
    },
    {
      id: 'pressure_3',
      scenario: "Big shot coming up. What reminder helps most?",
      options: [
        { id: 'a', text: "Remember a practice rep of this exact shot", isCorrect: true, feedback: "Perfect! Connecting to your training builds confidence. This is what you've trained for." },
        { id: 'b', text: "Don't think about it too much", isCorrect: false, feedback: "Better to think about your training. This is what you've trained for." },
        { id: 'c', text: "Just get it over with", isCorrect: false, feedback: "That's avoidance. Embrace what you've trained for." },
        { id: 'd', text: "Try to stay calm", isCorrect: false, feedback: "Don't fight the energy—channel it into what you've trained for." }
      ]
    },
    {
      id: 'pressure_4',
      scenario: "Free throws to win the game. What's your self-talk?",
      options: [
        { id: 'a', text: "I've made thousands of these in practice", isCorrect: true, feedback: "Exactly! Connecting to training builds confidence. This is what you've trained for." },
        { id: 'b', text: "Don't miss", isCorrect: false, feedback: "Negative command doesn't help. Think about what you've trained for." },
        { id: 'c', text: "Everyone's watching", isCorrect: false, feedback: "External focus creates pressure. Focus on what you've trained for." },
        { id: 'd', text: "Just make these", isCorrect: false, feedback: "Too general. Connect to specific training. This is what you've trained for." }
      ]
    }
  ],

  // 5. Nothing to Lose - "Play free, play fearless"
  better_opponent: [
    {
      id: 'opponent_1',
      scenario: "Matched against a player who's clearly better. Your mindset?",
      options: [
        { id: 'a', text: "Just try not to embarrass myself", isCorrect: false, feedback: "Playing not to lose creates hesitation. Play free, play fearless." },
        { id: 'b', text: "Nobody expects me to win—attack!", isCorrect: true, feedback: "Perfect! You're using underdog freedom. Play free, play fearless." },
        { id: 'c', text: "Hope they have an off game", isCorrect: false, feedback: "That's passive thinking. You have nothing to lose—play fearless." },
        { id: 'd', text: "Try to limit the damage", isCorrect: false, feedback: "Defensive thinking holds you back. Play free, play fearless." }
      ]
    },
    {
      id: 'opponent_2',
      scenario: "Playing up a level against better competition. What's the advantage?",
      options: [
        { id: 'a', text: "They expect me to lose anyway", isCorrect: true, feedback: "Exactly! Low expectations = total freedom. Play free, play fearless." },
        { id: 'b', text: "I might learn something", isCorrect: false, feedback: "Learning is good, but the real advantage is freedom. Play fearless." },
        { id: 'c', text: "There isn't one, they're just better", isCorrect: false, feedback: "Underdog status IS the advantage. You have nothing to lose." },
        { id: 'd', text: "I can surprise them", isCorrect: false, feedback: "Don't play to surprise—play free because you have nothing to lose." }
      ]
    },
    {
      id: 'opponent_3',
      scenario: "Down 15 points against a better team. Your approach?",
      options: [
        { id: 'a', text: "Play with complete freedom—nothing to lose", isCorrect: true, feedback: "Yes! When you're supposed to lose, you're free to play fearlessly." },
        { id: 'b', text: "Accept the loss and play careful", isCorrect: false, feedback: "Never accept loss. Use the freedom of nothing to lose." },
        { id: 'c', text: "Get frustrated at the deficit", isCorrect: false, feedback: "Frustration doesn't help. Use your underdog freedom." },
        { id: 'd', text: "Try different things randomly", isCorrect: false, feedback: "Not random—play your game with total fearlessness." }
      ]
    },
    {
      id: 'opponent_4',
      scenario: "Facing the league's best defender. What's your edge?",
      options: [
        { id: 'a', text: "Zero pressure—I'm supposed to lose", isCorrect: true, feedback: "Perfect! All the pressure is on them. Play free, play fearless." },
        { id: 'b', text: "Try to avoid them", isCorrect: false, feedback: "Don't avoid the challenge. You have nothing to lose—attack!" },
        { id: 'c', text: "Hope for a bad matchup", isCorrect: false, feedback: "Take the matchup fearlessly. Nothing to lose means everything to gain." },
        { id: 'd', text: "Play conservative to not look bad", isCorrect: false, feedback: "Conservative play wastes your underdog freedom. Play fearless." }
      ]
    }
  ],

  // 6. Learn & Release - "Noted, next"
  mistake_replaying: [
    {
      id: 'mistake_1',
      scenario: "You made a bad pass that led to a turnover. Quick response?",
      options: [
        { id: 'a', text: "Replay it in my head to understand", isCorrect: false, feedback: "Replaying is dwelling. Extract the lesson: Noted, next." },
        { id: 'b', text: "Note: check defender position, then move on", isCorrect: true, feedback: "Perfect! You got the lesson (check defender) and released it. Noted, next." },
        { id: 'c', text: "Analyze every detail of the play", isCorrect: false, feedback: "Over-analysis is dwelling. One lesson: Noted, next." },
        { id: 'd', text: "Just forget about it completely", isCorrect: false, feedback: "Don't forget—learn first. Then release. Noted, next." }
      ]
    },
    {
      id: 'mistake_2',
      scenario: "Missed a rotation on defense. What's your process?",
      options: [
        { id: 'a', text: "Quick lesson: Stay connected to my man. Next play.", isCorrect: true, feedback: "Exactly! Fast extraction: Noted (stay connected), then next." },
        { id: 'b', text: "Worry about what coach thinks", isCorrect: false, feedback: "That's not learning. Extract the lesson: Noted, next." },
        { id: 'c', text: "Keep thinking about it all quarter", isCorrect: false, feedback: "That's dwelling, not learning. Noted, next." },
        { id: 'd', text: "Hope it doesn't happen again", isCorrect: false, feedback: "Hope isn't learning. Note the lesson, then move on." }
      ]
    },
    {
      id: 'mistake_3',
      scenario: "Took a bad shot. What's the one-lesson takeaway?",
      options: [
        { id: 'a', text: "Noted: Better shot selection. Next.", isCorrect: true, feedback: "Perfect! One lesson extracted (shot selection), then released. Noted, next." },
        { id: 'b', text: "That was so stupid, what was I thinking", isCorrect: false, feedback: "That's shame, not learning. Extract lesson: Noted, next." },
        { id: 'c', text: "Replay the whole possession mentally", isCorrect: false, feedback: "Too much replay. One lesson, then next play." },
        { id: 'd', text: "Don't shoot for a while", isCorrect: false, feedback: "Don't change your game. Learn: Noted, next." }
      ]
    },
    {
      id: 'mistake_4',
      scenario: "Blew an easy layup. Fast lesson extraction?",
      options: [
        { id: 'a', text: "Noted: Keep eyes on rim. Next.", isCorrect: true, feedback: "Yes! Quick extraction (eyes on rim), immediate release. Noted, next." },
        { id: 'b', text: "I always miss those", isCorrect: false, feedback: "That's identity damage, not learning. Noted, next." },
        { id: 'c', text: "Keep replaying it to see what happened", isCorrect: false, feedback: "Replaying is dwelling. Extract once: Noted, next." },
        { id: 'd', text: "Feel bad about missing an easy one", isCorrect: false, feedback: "Feeling bad isn't learning. Note the lesson, move forward." }
      ]
    }
  ],

  // 7. Just Hoop Mode - "Stop thinking, start playing"
  overthinking: [
    {
      id: 'overthink_1',
      scenario: "You're analyzing every decision before making it. What's the fix?",
      options: [
        { id: 'a', text: "Just make the next play on instinct", isCorrect: true, feedback: "Exactly! Stop thinking, start playing. Trust your training." },
        { id: 'b', text: "Think it through more carefully", isCorrect: false, feedback: "More thinking makes it worse. Stop thinking, start playing." },
        { id: 'c', text: "Try to slow down my thoughts", isCorrect: false, feedback: "Don't manage thoughts—bypass them. Stop thinking, start playing." },
        { id: 'd', text: "Focus on playing smarter", isCorrect: false, feedback: "'Smarter' is more thinking. Stop thinking, start playing." }
      ]
    },
    {
      id: 'overthink_2',
      scenario: "Feeling slow because you're processing too much. Solution?",
      options: [
        { id: 'a', text: "Stop thinking, start playing", isCorrect: true, feedback: "Perfect! Your body knows what to do. Let it play." },
        { id: 'b', text: "Try to think faster", isCorrect: false, feedback: "Conscious thinking is always too slow. Stop thinking, start playing." },
        { id: 'c', text: "Focus harder on the details", isCorrect: false, feedback: "Details are for practice. In games: Stop thinking, start playing." },
        { id: 'd', text: "Make a mental checklist", isCorrect: false, feedback: "Checklists are thinking. Stop thinking, start playing." }
      ]
    },
    {
      id: 'overthink_3',
      scenario: "Second-guessing every move. What unlocks you?",
      options: [
        { id: 'a', text: "Trust my instincts completely", isCorrect: true, feedback: "Yes! Your instincts are trained. Stop thinking, start playing." },
        { id: 'b', text: "Analyze why I'm second-guessing", isCorrect: false, feedback: "That's more analysis. Stop thinking, start playing." },
        { id: 'c', text: "Be more decisive with my thinking", isCorrect: false, feedback: "It's the thinking that's the problem. Stop thinking, start playing." },
        { id: 'd', text: "Plan my next three moves", isCorrect: false, feedback: "Planning is overthinking. Stop thinking, start playing." }
      ]
    },
    {
      id: 'overthink_4',
      scenario: "Caught between multiple options, paralyzed. What breaks it?",
      options: [
        { id: 'a', text: "Pick one and go—no more thinking", isCorrect: true, feedback: "Perfect! Decision + action. Stop thinking, start playing." },
        { id: 'b', text: "Weigh the pros and cons", isCorrect: false, feedback: "That's analysis paralysis. Stop thinking, start playing." },
        { id: 'c', text: "Think about what coach would want", isCorrect: false, feedback: "Still thinking. Just play. Stop thinking, start playing." },
        { id: 'd', text: "Try to make the perfect choice", isCorrect: false, feedback: "Perfect doesn't exist in real-time. Stop thinking, start playing." }
      ]
    }
  ],

  // 8. Fake It Till You Make It - "Act confident, play confident"
  faking_confidence: [
    {
      id: 'fake_1',
      scenario: "Don't feel confident but need to play like it. What do you do?",
      options: [
        { id: 'a', text: "Wait until I feel confident first", isCorrect: false, feedback: "Feelings follow action. Act confident, play confident now." },
        { id: 'b', text: "Stand tall and move with purpose now", isCorrect: true, feedback: "Perfect! Body language creates the feeling. Act confident, play confident." },
        { id: 'c', text: "Try to think myself into confidence", isCorrect: false, feedback: "Thinking rarely creates confidence. Body language does. Act it." },
        { id: 'd', text: "Admit I'm not confident", isCorrect: false, feedback: "Don't wait for the feeling. Act confident, play confident." }
      ]
    },
    {
      id: 'fake_2',
      scenario: "Everyone seems confident except you. Your move?",
      options: [
        { id: 'a', text: "Match their body language immediately", isCorrect: true, feedback: "Yes! Act confident externally, the feeling follows. Act confident, play confident." },
        { id: 'b', text: "Wait until I feel like them", isCorrect: false, feedback: "You'll be waiting forever. Act first. Act confident, play confident." },
        { id: 'c', text: "Fake it and feel guilty about it", isCorrect: false, feedback: "No guilt needed—this is how confidence builds. Act confident, play confident." },
        { id: 'd', text: "Try to hide my lack of confidence", isCorrect: false, feedback: "Don't hide—actively project. Act confident, play confident." }
      ]
    },
    {
      id: 'fake_3',
      scenario: "Worried you're 'just faking' confidence. Reality check?",
      options: [
        { id: 'a', text: "Everyone builds confidence through action", isCorrect: true, feedback: "Exactly! Confidence IS a practice. Act confident, play confident." },
        { id: 'b', text: "Real confidence comes naturally", isCorrect: false, feedback: "No—confidence is practiced. Act confident, play confident." },
        { id: 'c', text: "I should wait for genuine confidence", isCorrect: false, feedback: "Action creates genuine confidence. Act confident, play confident." },
        { id: 'd', text: "Faking it is dishonest", isCorrect: false, feedback: "It's not fake—it's practice. Act confident, play confident." }
      ]
    },
    {
      id: 'fake_4',
      scenario: "Need to look confident before a big moment. What's the cue?",
      options: [
        { id: 'a', text: "Shoulders back, eye contact, purposeful walk", isCorrect: true, feedback: "Perfect! Physical confidence cues create mental confidence. Act confident, play confident." },
        { id: 'b', text: "Try to feel confident inside first", isCorrect: false, feedback: "Inside follows outside. Body first. Act confident, play confident." },
        { id: 'c', text: "Think positive thoughts", isCorrect: false, feedback: "Thoughts are slower than body language. Act confident, play confident." },
        { id: 'd', text: "Hope confidence kicks in naturally", isCorrect: false, feedback: "Don't hope—act. Act confident, play confident." }
      ]
    }
  ]
};
