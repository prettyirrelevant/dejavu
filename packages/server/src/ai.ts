export interface MemoryScenario {
  prompt: string;
  fragments: string[];
  hints: string[];
  detailQuestions: string[];
}

const SCENARIO_CATEGORIES = [
  'crime witness',
  'accident scene',
  'mysterious encounter',
  'public incident',
  'strange occurrence',
  'memorable event',
];

export async function generateMemoryScenario(ai: Ai): Promise<MemoryScenario> {
  const category = SCENARIO_CATEGORIES[Math.floor(Math.random() * SCENARIO_CATEGORIES.length)];

  const systemPrompt = `You are creating content for a social deduction game called "DÉJÀ VU" where one player is a witness with real memories and others must fake having the same memory.

Generate a ${category} scenario. Respond in this exact JSON format only, no other text:
{
  "prompt": "A 2-3 sentence vivid memory scenario that all players will see. Make it specific but not too detailed.",
  "fragments": ["4 specific sensory details the witness remembers", "like colors, sounds, smells, exact words heard", "specific times or numbers", "distinctive features of people or objects"],
  "hints": ["4 vague hints for imposters to fabricate from", "general themes without specifics", "emotional tones", "broad context clues"],
  "detailQuestions": ["5 probing questions about the scenario", "ask about specific details", "times, colors, sounds, people", "things a real witness would know", "but an imposter would struggle with"]
}

Make the scenario intriguing and the fragments very specific (exact colors, times, numbers, words). Hints should be vague enough that imposters can make up plausible answers.`;

  try {
    const result = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a new scenario.' },
      ],
    });

    const response = typeof result === 'object' && result !== null && 'response' in result
      ? (result as { response: string }).response
      : null;

    if (response) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as MemoryScenario;
        if (parsed.prompt && parsed.fragments?.length && parsed.hints?.length && parsed.detailQuestions?.length) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('AI generation failed:', e);
  }

  return getFallbackScenario();
}

export function selectDetailQuestion(scenario: MemoryScenario, questionIndex: number): string {
  const questions = scenario.detailQuestions;
  return questions[questionIndex % questions.length];
}

function getFallbackScenario(): MemoryScenario {
  const fallbacks: MemoryScenario[] = [
    {
      prompt: 'A late night at a 24-hour diner. A stranger left something behind at the counter before hurrying out into the rain.',
      fragments: [
        'The clock showed exactly 2:47 AM',
        'The stranger wore a bright yellow raincoat',
        'They left behind a worn leather journal with a red ribbon bookmark',
        'The jukebox was playing "Blue Moon" by Elvis',
      ],
      hints: [
        'It was very late at night',
        'The weather was bad outside',
        'Someone forgot something',
        'There was music playing',
      ],
      detailQuestions: [
        'What time was it?',
        'What was the stranger wearing?',
        'What did they leave behind?',
        'What song was playing?',
        'What color was the item left behind?',
      ],
    },
    {
      prompt: 'A crowded subway platform during rush hour. Someone dropped their bag and dozens of photographs scattered across the floor.',
      fragments: [
        'It happened at the 14th Street station',
        'The bag was a green canvas messenger bag',
        'Most photos were black and white portraits',
        'A child in a red cap helped pick them up',
      ],
      hints: [
        'It was a busy transit location',
        'Something spilled everywhere',
        'Strangers helped out',
        'There were images involved',
      ],
      detailQuestions: [
        'Where did this happen?',
        'What kind of bag was it?',
        'What was in the photographs?',
        'Who helped clean up?',
        'What color was the bag?',
      ],
    },
    {
      prompt: 'A quiet morning at the park. A street performer suddenly stopped mid-song and stared at someone in the crowd.',
      fragments: [
        'The performer was playing a silver saxophone',
        'They stopped during "Autumn Leaves"',
        'They stared at a woman in a blue sundress',
        'It was around 10:30 in the morning',
      ],
      hints: [
        'There was live music',
        'Something unexpected happened',
        'The performer reacted to someone',
        'It was during the day',
      ],
      detailQuestions: [
        'What instrument were they playing?',
        'What song were they performing?',
        'Who did they look at?',
        'What time of day was it?',
        'What color was the instrument?',
      ],
    },
    {
      prompt: 'A hotel lobby at midnight. The power went out for exactly thirty seconds, and when the lights came back, something had changed.',
      fragments: [
        'The grandfather clock in the corner had stopped at 12:03',
        'A painting of a ship was now hanging upside down',
        'The receptionist was a young man with round glasses',
        'There were exactly 7 people in the lobby',
      ],
      hints: [
        'It was late at night',
        'There was a brief darkness',
        'Something was different after',
        'There were witnesses around',
      ],
      detailQuestions: [
        'What time did the clock show?',
        'What changed after the blackout?',
        'What did the hotel staff look like?',
        'How many people were there?',
        'What was in the painting?',
      ],
    },
    {
      prompt: 'A bookstore closing sale. An elderly man bought the very last book and whispered something to the cashier before leaving.',
      fragments: [
        'The book was "The Great Gatsby" with a torn cover',
        'He paid with exact change - $4.75',
        'He whispered "She would have loved this"',
        'He wore a faded military pin on his lapel',
      ],
      hints: [
        'A store was closing down',
        'An older customer made a purchase',
        'There was something sentimental',
        'He said something quiet',
      ],
      detailQuestions: [
        'What book did he buy?',
        'How much did it cost?',
        'What did he say to the cashier?',
        'What was distinctive about his appearance?',
        'What was wrong with the book?',
      ],
    },
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
