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
      cheat_code_id: 'airball_laugh',
      user_id: 'onboarding',
      situation: "You just airballed a wide-open three in front of the home crowd.",
      current_thought: "That was embarrassing, everyone saw that",
      options: [
        { text: "Next play", type: 'optimal', feedback: "Perfect! You're not dwelling—you're moving forward instantly." },
        { text: "I should probably pass more now", type: 'negative', feedback: "Don't change your game because of one miss. Stay aggressive with next play mentality." },
        { text: "Coach is going to sub me out", type: 'negative', feedback: "That's future-thinking anxiety. Stay present: next play." },
        { text: "Shake it off and focus on defense", type: 'helpful', feedback: "Good reset, but the optimal response is even simpler: just 'next play.'" }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'airball_2',
      cheat_code_id: 'airball_laugh',
      user_id: 'onboarding',
      situation: "After a turnover, you hear someone in the stands laugh.",
      current_thought: "Everyone's judging me right now",
      options: [
        { text: "Shake it off and get back on defense", type: 'optimal', feedback: "Exactly! Physical reset helps trigger the mental reset. Next play." },
        { text: "Try to make up for it immediately", type: 'negative', feedback: "Forcing plays to 'make up' for mistakes creates more mistakes. Just play the next play." },
        { text: "Wonder what they're thinking about me", type: 'negative', feedback: "External opinions don't help your game. Focus on the next play." },
        { text: "Take a deep breath and refocus", type: 'helpful', feedback: "Breathing helps, but immediate action (getting back on D) is even better." }
      ],
      scenario_type: 'external',
      created_at: new Date().toISOString()
    },
    {
      id: 'airball_3',
      cheat_code_id: 'airball_laugh',
      user_id: 'onboarding',
      situation: "You miss a crucial free throw late in the game.",
      current_thought: "I always choke under pressure",
      options: [
        { text: "Get back and play defense", type: 'optimal', feedback: "Perfect! The free throw is done. Next play is defense." },
        { text: "I need to make the next one", type: 'negative', feedback: "That's pressure-building. Just focus on the immediate next play, which is defense." },
        { text: "This game is over", type: 'negative', feedback: "Game's not over until it's over. Next play mentality keeps you in it." },
        { text: "Stay aggressive, I'll get another chance", type: 'helpful', feedback: "Good mindset, but the immediate next play is defense. Lock in there first." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'airball_4',
      cheat_code_id: 'airball_laugh',
      user_id: 'onboarding',
      situation: "You just got blocked hard on a drive to the basket.",
      current_thought: "That's on video forever, everyone saw me get embarrassed",
      options: [
        { text: "Next opportunity to attack", type: 'optimal', feedback: "Yes! You're already thinking about your next chance. That's next play mentality." },
        { text: "I shouldn't drive on them again", type: 'negative', feedback: "Don't let one play change your aggressiveness. Next play." },
        { text: "Everyone saw that", type: 'negative', feedback: "External focus keeps you stuck. Get back to next play mentality." },
        { text: "Learn from it and move on", type: 'helpful', feedback: "Learning is good, but 'next opportunity to attack' shows true next play aggression." }
      ],
      scenario_type: 'external',
      created_at: new Date().toISOString()
    }
  ],

  // 2. Filter System - "Take what helps, leave the rest"
  coach_yells: [
    {
      id: 'coach_1',
      cheat_code_id: 'coach_yells',
      user_id: 'onboarding',
      situation: "Coach yells 'What are you doing?!' after a mistake.",
      current_thought: "They're so mad at me, I messed up again",
      options: [
        { text: "What specific action needs to change", type: 'optimal', feedback: "Perfect! You're filtering for the useful instruction. Take what helps, leave the rest." },
        { text: "The emotion in their voice", type: 'negative', feedback: "The emotion is noise. Filter for the instruction underneath." },
        { text: "Whether they're mad at me personally", type: 'negative', feedback: "That's personalizing coaching. Filter for what helps your game." },
        { text: "Try to stay calm and composed", type: 'helpful', feedback: "Staying calm is good, but actively filtering for the instruction is even better." }
      ],
      scenario_type: 'external',
      created_at: new Date().toISOString()
    },
    {
      id: 'coach_2',
      cheat_code_id: 'coach_yells',
      user_id: 'onboarding',
      situation: "Coach criticizes your effort in front of the team.",
      current_thought: "This is so embarrassing, everyone's watching me get called out",
      options: [
        { text: "Extract the valid point about effort level", type: 'optimal', feedback: "Exactly! You're filtering out the delivery, keeping the useful feedback." },
        { text: "Feel embarrassed and defensive", type: 'negative', feedback: "Emotions block the filter. Look for what you can actually use." },
        { text: "Think about how unfair that was", type: 'negative', feedback: "Fairness thinking blocks learning. Filter for what helps." },
        { text: "Acknowledge and move on", type: 'helpful', feedback: "Moving on is good, but extracting the valid point shows true filtering." }
      ],
      scenario_type: 'external',
      created_at: new Date().toISOString()
    },
    {
      id: 'coach_3',
      cheat_code_id: 'coach_yells',
      user_id: 'onboarding',
      situation: "Coach says 'You're playing scared!' in a harsh tone.",
      current_thought: "They think I'm weak and not tough enough",
      options: [
        { text: "I need to be more aggressive", type: 'optimal', feedback: "Yes! You filtered harsh language for clear, actionable direction." },
        { text: "They think I'm not tough enough", type: 'negative', feedback: "You're interpreting character judgment. Filter for the behavioral instruction." },
        { text: "I should feel bad about myself", type: 'negative', feedback: "Feeling bad doesn't help. Filter for what actually helps your game." },
        { text: "Don't take it personally", type: 'helpful', feedback: "Not taking it personally is good, but extracting 'be more aggressive' is the full filter." }
      ],
      scenario_type: 'external',
      created_at: new Date().toISOString()
    },
    {
      id: 'coach_4',
      cheat_code_id: 'coach_yells',
      user_id: 'onboarding',
      situation: "Coach snaps 'Move your feet!' while you're already hustling.",
      current_thought: "I am moving my feet, they're just frustrated with me",
      options: [
        { text: "My footwork needs adjustment", type: 'optimal', feedback: "Perfect! You extracted the useful technical feedback, left the emotional charge." },
        { text: "They're frustrated with me", type: 'negative', feedback: "That's emotional interpretation. Filter for the technical instruction." },
        { text: "I'm not playing well enough", type: 'negative', feedback: "Too vague. Filter for the specific actionable instruction." },
        { text: "Stay focused on my technique", type: 'helpful', feedback: "Good mindset, but 'footwork needs adjustment' is the specific filtered instruction." }
      ],
      scenario_type: 'external',
      created_at: new Date().toISOString()
    }
  ],

  // 3. Keep Shooting - "Shooters shoot"
  miss_spiral: [
    {
      id: 'miss_1',
      cheat_code_id: 'miss_spiral',
      user_id: 'onboarding',
      situation: "You're 5/7 from three, then miss your next shot.",
      current_thought: "I'm cooling off, maybe I should pass more",
      options: [
        { text: "Shooters shoot - stay aggressive", type: 'optimal', feedback: "Exactly! You're not letting one miss change your identity as a scorer." },
        { text: "I'm cooling off, better pass more", type: 'negative', feedback: "One miss doesn't mean you're cold. Shooters shoot." },
        { text: "Don't want to mess up my percentage", type: 'negative', feedback: "Stats thinking kills aggression. Shooters shoot." },
        { text: "Take the next good look", type: 'helpful', feedback: "Taking good looks is fine, but 'shooters shoot' mentality keeps you fully aggressive." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'miss_2',
      cheat_code_id: 'miss_spiral',
      user_id: 'onboarding',
      situation: "After hitting 3 straight shots, you miss an open look.",
      current_thought: "That broke my rhythm, I was feeling it and now it's gone",
      options: [
        { text: "Get ready for my next shot", type: 'optimal', feedback: "Perfect! Short memory. You're staying in your shooter's mentality." },
        { text: "Hope I get another chance soon", type: 'negative', feedback: "Don't 'hope' for chances—demand the ball. Shooters shoot." },
        { text: "That broke my rhythm", type: 'negative', feedback: "Don't let one miss break anything. Shooters shoot through misses." },
        { text: "Stay confident in my shot", type: 'helpful', feedback: "Confidence is good, but 'get ready for my next shot' shows active shooter mentality." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'miss_3',
      cheat_code_id: 'miss_spiral',
      user_id: 'onboarding',
      situation: "You miss two in a row after being hot.",
      current_thought: "I lost my touch, maybe I'm forcing it",
      options: [
        { text: "Shooters shoot - next one's going in", type: 'optimal', feedback: "Yes! Shooter's amnesia. Bad misses don't predict future misses." },
        { text: "I lost my touch", type: 'negative', feedback: "Two misses doesn't mean lost touch. Shooters shoot." },
        { text: "Let someone else shoot for a bit", type: 'negative', feedback: "Don't defer when you're a shooter. Stay aggressive." },
        { text: "Trust my mechanics", type: 'helpful', feedback: "Trusting mechanics is good, but 'next one's going in' is pure shooter confidence." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'miss_4',
      cheat_code_id: 'miss_spiral',
      user_id: 'onboarding',
      situation: "After a miss, you're open again immediately.",
      current_thought: "Should I shoot again or look to pass?",
      options: [
        { text: "Shoot it without hesitation", type: 'optimal', feedback: "Perfect! No hesitation. That's shooter's mentality." },
        { text: "Pump fake and drive instead", type: 'negative', feedback: "Don't lose confidence in your shot. Shooters shoot." },
        { text: "Look to pass first", type: 'negative', feedback: "Open shot for a shooter means shoot. Don't overthink." },
        { text: "Make sure it's a good look", type: 'helpful', feedback: "Open looks ARE good looks for shooters. 'Shoot it' shows true confidence." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    }
  ],

  // 4. Pressure Privilege - "This is what I've trained for"
  pressure_counting: [
    {
      id: 'pressure_1',
      cheat_code_id: 'pressure_counting',
      user_id: 'onboarding',
      situation: "Tie game, 10 seconds left, coach calls your number for the final shot.",
      current_thought: "What if I miss? Everyone will blame me",
      options: [
        { text: "This is what I've trained for", type: 'optimal', feedback: "Perfect! You're reframing pressure as opportunity. This is your moment." },
        { text: "What if I miss?", type: 'negative', feedback: "That's outcome fear. This is what you've trained for." },
        { text: "I hope I don't let everyone down", type: 'negative', feedback: "External pressure thinking. Focus on your training." },
        { text: "Trust my preparation", type: 'helpful', feedback: "Trusting preparation is good, but 'this is what I've trained for' is the full reframe." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'pressure_2',
      cheat_code_id: 'pressure_counting',
      user_id: 'onboarding',
      situation: "Playoff game, crowd is loud, all eyes on you as you step to the line.",
      current_thought: "This pressure is overwhelming, everyone's watching",
      options: [
        { text: "Privileged to be in this moment", type: 'optimal', feedback: "Yes! You're viewing pressure as privilege. This is what you've trained for." },
        { text: "Nervous about the stakes", type: 'negative', feedback: "Nerves are energy for what you've trained for. Reframe it." },
        { text: "Worried about the outcome", type: 'negative', feedback: "Outcome thinking creates anxiety. Focus on what you've trained for." },
        { text: "Focus on my routine", type: 'helpful', feedback: "Routine is good, but 'privileged to be here' is the mindset shift." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'pressure_3',
      cheat_code_id: 'pressure_counting',
      user_id: 'onboarding',
      situation: "Big shot coming up and you feel the pressure mounting.",
      current_thought: "Don't think about it too much, just get it over with",
      options: [
        { text: "Remember a practice rep of this exact shot", type: 'optimal', feedback: "Perfect! Connecting to your training builds confidence. This is what you've trained for." },
        { text: "Don't think about it too much", type: 'negative', feedback: "Better to think about your training. This is what you've trained for." },
        { text: "Just get it over with", type: 'negative', feedback: "That's avoidance. Embrace what you've trained for." },
        { text: "Stay calm and breathe", type: 'helpful', feedback: "Breathing helps, but connecting to specific training reps is even more powerful." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'pressure_4',
      cheat_code_id: 'pressure_counting',
      user_id: 'onboarding',
      situation: "Free throws to win the game with 2 seconds left.",
      current_thought: "Everyone's watching, don't miss",
      options: [
        { text: "I've made thousands of these in practice", type: 'optimal', feedback: "Exactly! Connecting to training builds confidence. This is what you've trained for." },
        { text: "Don't miss", type: 'negative', feedback: "Negative command doesn't help. Think about what you've trained for." },
        { text: "Everyone's watching", type: 'negative', feedback: "External focus creates pressure. Focus on what you've trained for." },
        { text: "Execute my routine", type: 'helpful', feedback: "Routine is good, but referencing specific training reps is more grounding." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    }
  ],

  // 5. Nothing to Lose - "Play free, play fearless"
  better_opponent: [
    {
      id: 'opponent_1',
      cheat_code_id: 'better_opponent',
      user_id: 'onboarding',
      situation: "You're matched against a player who's clearly more skilled than you.",
      current_thought: "Just try not to embarrass myself out here",
      options: [
        { text: "Nobody expects me to win—attack!", type: 'optimal', feedback: "Perfect! When there's zero expectation, you're completely free to be aggressive. This is your moment to play with no fear." },
        { text: "Just try not to embarrass myself", type: 'negative', feedback: "Flip that mindset! When you're the underdog, you have nothing to lose. That freedom is powerful—use it to attack." },
        { text: "Hope they have an off game", type: 'negative', feedback: "Don't wait for them to fail—take control! You have zero pressure here, so play fearlessly and make something happen." },
        { text: "Give it my best effort", type: 'helpful', feedback: "Love the effort mindset! Now add this: since nobody expects you to win, you can play completely free. That's your superpower." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'opponent_2',
      cheat_code_id: 'better_opponent',
      user_id: 'onboarding',
      situation: "Playing up a level against significantly better competition.",
      current_thought: "I'm outmatched, there's no advantage here",
      options: [
        { text: "They expect me to lose anyway", type: 'optimal', feedback: "Exactly! When nobody expects you to win, you're completely free. Attack without hesitation—you have nothing to lose." },
        { text: "I might learn something", type: 'helpful', feedback: "Learning is valuable, and here's the bonus: underdog freedom lets you play fearlessly while you learn." },
        { text: "There isn't one, they're just better", type: 'negative', feedback: "Here's your advantage: zero pressure. They're expected to win, you're free to shock people." },
        { text: "Maybe I can surprise them", type: 'helpful', feedback: "Love this mindset! And remember: since nobody expects you to win, you can play with complete freedom." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'opponent_3',
      cheat_code_id: 'better_opponent',
      user_id: 'onboarding',
      situation: "Down 15 points against a better team with 8 minutes left.",
      current_thought: "This is basically over, just don't get blown out",
      options: [
        { text: "Play with complete freedom—nothing to lose", type: 'optimal', feedback: "Yes! When you're supposed to lose, you're free to play fearlessly." },
        { text: "Accept the loss and play careful", type: 'negative', feedback: "Never accept loss. Use the freedom of nothing to lose." },
        { text: "Get frustrated at the deficit", type: 'negative', feedback: "Frustration doesn't help. Use your underdog freedom." },
        { text: "Keep fighting", type: 'helpful', feedback: "Fighting spirit is good, but 'complete freedom' is the unlock." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'opponent_4',
      cheat_code_id: 'better_opponent',
      user_id: 'onboarding',
      situation: "Facing the league's best defender one-on-one.",
      current_thought: "They're going to lock me up, I should avoid them",
      options: [
        { text: "Zero pressure—I'm supposed to lose", type: 'optimal', feedback: "Perfect! All the pressure is on them. Play free, play fearless." },
        { text: "Try to avoid them", type: 'negative', feedback: "Don't avoid the challenge. You have nothing to lose—attack!" },
        { text: "Hope for a bad matchup", type: 'negative', feedback: "Take the matchup fearlessly. Nothing to lose means everything to gain." },
        { text: "Play smart and pick my spots", type: 'helpful', feedback: "Playing smart is fine, but 'zero pressure' unlocks true aggression." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    }
  ],

  // 6. Learn & Release - "Noted, next"
  mistake_replaying: [
    {
      id: 'mistake_1',
      cheat_code_id: 'mistake_replaying',
      user_id: 'onboarding',
      situation: "You made a bad pass that led to a fast-break turnover.",
      current_thought: "I need to replay that and understand what I did wrong",
      options: [
        { text: "Note: check defender position, then move on", type: 'optimal', feedback: "Perfect! You got the lesson (check defender) and released it. Noted, next." },
        { text: "Replay it in my head to understand", type: 'negative', feedback: "Replaying is dwelling. Extract the lesson: Noted, next." },
        { text: "Analyze every detail of the play", type: 'negative', feedback: "Over-analysis is dwelling. One lesson: Noted, next." },
        { text: "Learn from it", type: 'helpful', feedback: "Learning is right, but 'noted + specific lesson + move on' is the complete process." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'mistake_2',
      cheat_code_id: 'mistake_replaying',
      user_id: 'onboarding',
      situation: "Missed a defensive rotation and gave up an easy basket.",
      current_thought: "I should have seen that coming, what was I thinking?",
      options: [
        { text: "Quick lesson: Stay connected to my man. Next play.", type: 'optimal', feedback: "Exactly! Fast extraction: Noted (stay connected), then next." },
        { text: "Worry about what coach thinks", type: 'negative', feedback: "That's not learning. Extract the lesson: Noted, next." },
        { text: "Keep thinking about it all quarter", type: 'negative', feedback: "That's dwelling, not learning. Noted, next." },
        { text: "Don't make that mistake again", type: 'helpful', feedback: "Right intention, but the specific lesson 'stay connected' is better than generic 'don't.'" }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'mistake_3',
      cheat_code_id: 'mistake_replaying',
      user_id: 'onboarding',
      situation: "Took a contested three early in the shot clock.",
      current_thought: "That was so stupid, what was I thinking taking that shot?",
      options: [
        { text: "Noted: Better shot selection. Next.", type: 'optimal', feedback: "Perfect! One lesson extracted (shot selection), then released. Noted, next." },
        { text: "That was so stupid, what was I thinking", type: 'negative', feedback: "That's shame, not learning. Extract lesson: Noted, next." },
        { text: "Replay the whole possession mentally", type: 'negative', feedback: "Too much replay. One lesson, then next play." },
        { text: "Be smarter next time", type: 'helpful', feedback: "Right idea, but 'shot selection' is more specific than 'be smarter.'" }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'mistake_4',
      cheat_code_id: 'mistake_replaying',
      user_id: 'onboarding',
      situation: "Blew an easy layup by looking away too early.",
      current_thought: "I always miss those easy ones, I need to figure out why",
      options: [
        { text: "Noted: Keep eyes on rim. Next.", type: 'optimal', feedback: "Yes! Quick extraction (eyes on rim), immediate release. Noted, next." },
        { text: "I always miss those", type: 'negative', feedback: "That's identity damage, not learning. Noted, next." },
        { text: "Keep replaying it to see what happened", type: 'negative', feedback: "Replaying is dwelling. Extract once: Noted, next." },
        { text: "Focus better on finishes", type: 'helpful', feedback: "Good direction, but 'eyes on rim' is the specific extraction." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    }
  ],

  // 7. Just Hoop Mode - "Stop thinking, start playing"
  overthinking: [
    {
      id: 'overthink_1',
      cheat_code_id: 'overthinking',
      user_id: 'onboarding',
      situation: "You're analyzing every decision before making it and playing slowly.",
      current_thought: "I need to think this through more carefully",
      options: [
        { text: "Just make the next play on instinct", type: 'optimal', feedback: "Exactly! Stop thinking, start playing. Trust your training." },
        { text: "Think it through more carefully", type: 'negative', feedback: "More thinking makes it worse. Stop thinking, start playing." },
        { text: "Try to slow down my thoughts", type: 'negative', feedback: "Don't manage thoughts—bypass them. Stop thinking, start playing." },
        { text: "Trust my gut", type: 'helpful', feedback: "Trusting gut is good, but 'make the next play on instinct' is immediate action." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'overthink_2',
      cheat_code_id: 'overthinking',
      user_id: 'onboarding',
      situation: "Feeling slow because you're processing too much information.",
      current_thought: "I need to think faster to keep up",
      options: [
        { text: "Stop thinking, start playing", type: 'optimal', feedback: "Perfect! Your body knows what to do. Let it play." },
        { text: "Try to think faster", type: 'negative', feedback: "Conscious thinking is always too slow. Stop thinking, start playing." },
        { text: "Focus harder on the details", type: 'negative', feedback: "Details are for practice. In games: Stop thinking, start playing." },
        { text: "Simplify my approach", type: 'helpful', feedback: "Simplifying helps, but 'stop thinking, start playing' is the full unlock." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'overthink_3',
      cheat_code_id: 'overthinking',
      user_id: 'onboarding',
      situation: "Second-guessing every move you make on the court.",
      current_thought: "Should I shoot or pass? Drive or pull up? I can't decide",
      options: [
        { text: "Trust my instincts completely", type: 'optimal', feedback: "Yes! Your instincts are trained. Stop thinking, start playing." },
        { text: "Analyze why I'm second-guessing", type: 'negative', feedback: "That's more analysis. Stop thinking, start playing." },
        { text: "Be more decisive with my thinking", type: 'negative', feedback: "It's the thinking that's the problem. Stop thinking, start playing." },
        { text: "React naturally", type: 'helpful', feedback: "Natural reaction is right, but 'trust instincts' is more active." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'overthink_4',
      cheat_code_id: 'overthinking',
      user_id: 'onboarding',
      situation: "Caught between multiple options, paralyzed by indecision.",
      current_thought: "I need to weigh all the options and make the perfect choice",
      options: [
        { text: "Pick one and go—no more thinking", type: 'optimal', feedback: "Perfect! Decision + action. Stop thinking, start playing." },
        { text: "Weigh the pros and cons", type: 'negative', feedback: "That's analysis paralysis. Stop thinking, start playing." },
        { text: "Think about what coach would want", type: 'negative', feedback: "Still thinking. Just play. Stop thinking, start playing." },
        { text: "Go with my first instinct", type: 'helpful', feedback: "First instinct is good, but 'pick one and go' emphasizes the action." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    }
  ],

  // 8. Fake It Till You Make It - "Act confident, play confident"
  faking_confidence: [
    {
      id: 'fake_1',
      cheat_code_id: 'faking_confidence',
      user_id: 'onboarding',
      situation: "Don't feel confident but need to play like you are.",
      current_thought: "I need to wait until I actually feel confident first",
      options: [
        { text: "Stand tall and move with purpose now", type: 'optimal', feedback: "Perfect! Body language creates the feeling. Act confident, play confident." },
        { text: "Wait until I feel confident first", type: 'negative', feedback: "Feelings follow action. Act confident, play confident now." },
        { text: "Try to think myself into confidence", type: 'negative', feedback: "Thinking rarely creates confidence. Body language does. Act it." },
        { text: "Fake it for now", type: 'helpful', feedback: "Right idea, but 'stand tall and move with purpose' is the specific action." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'fake_2',
      cheat_code_id: 'faking_confidence',
      user_id: 'onboarding',
      situation: "Everyone around you seems confident except you.",
      current_thought: "I wish I felt as confident as they look",
      options: [
        { text: "Match their body language immediately", type: 'optimal', feedback: "Yes! Act confident externally, the feeling follows. Act confident, play confident." },
        { text: "Wait until I feel like them", type: 'negative', feedback: "You'll be waiting forever. Act first. Act confident, play confident." },
        { text: "Fake it and feel guilty about it", type: 'negative', feedback: "No guilt needed—this is how confidence builds. Act confident, play confident." },
        { text: "Carry myself better", type: 'helpful', feedback: "Right direction, but 'match their body language' is more specific." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'fake_3',
      cheat_code_id: 'faking_confidence',
      user_id: 'onboarding',
      situation: "Worried you're 'just faking' confidence and it's not real.",
      current_thought: "This isn't real confidence, I should wait for the genuine thing",
      options: [
        { text: "Everyone builds confidence through action", type: 'optimal', feedback: "Exactly! Confidence IS a practice. Act confident, play confident." },
        { text: "Real confidence comes naturally", type: 'negative', feedback: "No—confidence is practiced. Act confident, play confident." },
        { text: "I should wait for genuine confidence", type: 'negative', feedback: "Action creates genuine confidence. Act confident, play confident." },
        { text: "Keep practicing it", type: 'helpful', feedback: "Practice is right, but 'everyone builds through action' normalizes the process." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    },
    {
      id: 'fake_4',
      cheat_code_id: 'faking_confidence',
      user_id: 'onboarding',
      situation: "Need to look confident before a big moment.",
      current_thought: "I hope confidence kicks in naturally when I need it",
      options: [
        { text: "Shoulders back, eye contact, purposeful walk", type: 'optimal', feedback: "Perfect! Physical confidence cues create mental confidence. Act confident, play confident." },
        { text: "Try to feel confident inside first", type: 'negative', feedback: "Inside follows outside. Body first. Act confident, play confident." },
        { text: "Think positive thoughts", type: 'negative', feedback: "Thoughts are slower than body language. Act confident, play confident." },
        { text: "Project confidence", type: 'helpful', feedback: "Right idea, but the specific cues (shoulders, eyes, walk) are actionable." }
      ],
      scenario_type: 'internal',
      created_at: new Date().toISOString()
    }
  ]
};
