import { GoogleGenAI } from '@google/genai';

export interface MemoryScenario {
  prompt: string;
  fragments: string[];
  hints: string[];
  detailQuestions: string[];
}

const SCENARIO_CATEGORIES = [
  'an awkward moment at a grocery store',
  'a party where something weird happened',
  'a strange encounter on public transport',
  'a customer service disaster',
  'a package delivery gone wrong',
  'a chaotic family dinner',
  'something bizarre at the gym',
  'a first date that took a turn',
  'a suspicious neighbor encounter',
  'fast food weirdness',
  'a waiting room incident',
  'an elevator situation',
  'a coworker doing something unexplainable',
  'a pet causing chaos',
  'a wedding that went off script',
];

export async function generateMemoryScenario(geminiApiKey: string | undefined): Promise<MemoryScenario> {
  if (!geminiApiKey) {
    return getFallbackScenario();
  }

  const category = SCENARIO_CATEGORIES[Math.floor(Math.random() * SCENARIO_CATEGORIES.length)];

  const prompt = `You're making scenarios for a party game. One player gets the real details, others have to fake it.

Theme: ${category}

Make it FUNNY and SIMPLE. Think "stories you'd tell friends at a bar" not "creative writing class."

JSON only:
{
  "prompt": "2 sentences max. Set up a normal situation, then ONE weird/funny twist. Write like you're texting a friend. Example: 'You were at Target when a guy in a bathrobe walked past pushing a cart full of rubber ducks. He made eye contact and nodded like you were in on it.'",

  "fragments": [
    "4 specific funny details the witness knows",
    "exact quotes, specific numbers, colors, brand names",
    "make one detail absurd but believable",
    "these are what imposters CAN'T guess"
  ],

  "hints": [
    "4 vague clues for imposters to BS around",
    "general vibe only - no specifics",
    "like: 'something unexpected happened' or 'someone said something weird'",
    "imposters should be able to make up plausible lies"
  ],

  "detailQuestions": [
    "5 simple questions about specifics",
    "what color, what number, what exactly did they say",
    "stuff a real witness remembers instantly",
    "stuff an imposter has to make up"
  ]
}

Keep it fun. No sad stories. Weird > deep.`;

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
        maxOutputTokens: 1024,
      },
    });

    const text = response.text;
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
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

export function getFallbackScenario(): MemoryScenario {
  const fallbacks: MemoryScenario[] = [
    {
      prompt: "You were at the grocery store when a guy in a full Spider-Man costume walked past you pushing a cart. He stopped, pointed at your cart, and gave you a thumbs up like he approved of your choices.",
      fragments: [
        'He had exactly 7 frozen pizzas in his cart',
        'The costume was missing one glove, his right hand was bare',
        'He said "solid picks" in a totally normal voice',
        'He was wearing Crocs under the costume, bright orange ones',
      ],
      hints: [
        'Someone in unusual clothing appeared',
        'They interacted with you briefly',
        'It was at a store',
        'Something about it was just absurd',
      ],
      detailQuestions: [
        'How many pizzas were in his cart?',
        'What was wrong with the costume?',
        'What exactly did he say to you?',
        'What shoes was he wearing?',
        'Which hand was exposed?',
      ],
    },
    {
      prompt: "You were at a coffee shop when the barista called out a name and nobody claimed the drink for like 2 minutes. Finally an old lady stood up and said 'that's me, I'm Darkwolf.'",
      fragments: [
        'The drink was a venti caramel frappuccino with extra whip',
        'She was wearing a sweater with cats playing poker on it',
        'She winked at you when she grabbed it',
        'Her actual purse had a Metallica patch on it',
      ],
      hints: [
        'Someone had an unexpected name',
        'It happened at a cafe',
        'An older person surprised you',
        'There was a funny moment',
      ],
      detailQuestions: [
        'What was the drink order?',
        'What was on her sweater?',
        'What did she do when she grabbed the drink?',
        'What was on her purse or bag?',
        'What name was called out?',
      ],
    },
    {
      prompt: "You were in an elevator when a guy got on carrying a life-size cardboard cutout of Danny DeVito. He positioned it to face the doors and stood next to it like everything was normal.",
      fragments: [
        'The cutout was from the movie Twins',
        'He pressed the button for floor 11',
        'He said "Danny doesn\'t like small talk" when you made eye contact',
        'He was wearing a lanyard that said INTERN in big letters',
      ],
      hints: [
        'Someone brought something weird into a small space',
        'They acted like it was totally normal',
        'You were stuck with them briefly',
        'They said something memorable',
      ],
      detailQuestions: [
        'What movie was the cutout from?',
        'What floor did he press?',
        'What did he say to you?',
        'What did his lanyard say?',
        'Who was the cutout of?',
      ],
    },
    {
      prompt: "You were at a fast food drive-thru at 2am when the person working the window handed you your food and said 'the raccoons are getting bold' with zero context. Then just closed the window.",
      fragments: [
        'You ordered a 10-piece nugget meal with a Sprite',
        'There was definitely a raccoon sitting on the dumpster behind them',
        'They were wearing a name tag that said "Manager Kyle"',
        'The total was exactly $9.47',
      ],
      hints: [
        'Something weird happened at a restaurant',
        'An employee said something strange',
        'It was late at night',
        'Animals might have been involved',
      ],
      detailQuestions: [
        'What did you order?',
        'What animal did you see?',
        'What was the employee\'s name?',
        'What was the total?',
        'What drink did you get?',
      ],
    },
    {
      prompt: "You were at the gym when a guy on the treadmill next to you answered his phone, said 'the eagle has landed' completely seriously, then hung up and kept running like nothing happened.",
      fragments: [
        'He was running at exactly 6.5 mph, you checked',
        'He was wearing a shirt that said "ASK ME ABOUT MY PODCAST"',
        'The call lasted maybe 4 seconds total',
        'He had airpods but answered on speakerphone anyway',
      ],
      hints: [
        'Someone took a weird phone call',
        'It happened during exercise',
        'The call was very short',
        'They seemed to think it was normal',
      ],
      detailQuestions: [
        'What speed was he running?',
        'What did his shirt say?',
        'How long was the call?',
        'What exactly did he say?',
        'How did he answer the phone?',
      ],
    },
    {
      prompt: "You were waiting for the bus when a woman sat down next to you, opened a tupperware container full of shrimp, and started eating them one by one while maintaining direct eye contact.",
      fragments: [
        'There were exactly 12 shrimp, you counted',
        'She was wearing scrubs with little tacos printed on them',
        'She offered you one and said "they\'re from yesterday but they\'re fine"',
        'The bus was the 42, it said so on the sign',
      ],
      hints: [
        'Someone ate something unusual in public',
        'They tried to interact with you',
        'You were waiting somewhere',
        'It was uncomfortable but funny',
      ],
      detailQuestions: [
        'How many shrimp were there?',
        'What was she wearing?',
        'What did she say when she offered you some?',
        'What bus were you waiting for?',
        'What pattern was on her scrubs?',
      ],
    },
    {
      prompt: "You were at a wedding when the DJ accidentally played the wrong song for the first dance. Instead of stopping, the couple just committed to it and slow danced to 'Who Let The Dogs Out.'",
      fragments: [
        'They danced for the entire 3 minutes and 18 seconds',
        'The groom dipped the bride during the bark part',
        'The DJ\'s booth had a banner that said "DJ Smooth Moves"',
        'Grandma was the first one to start clapping along',
      ],
      hints: [
        'Music went wrong at an event',
        'People handled it unexpectedly well',
        'It was at a celebration',
        'Someone\'s reaction made it better',
      ],
      detailQuestions: [
        'How long did the dance last?',
        'What did the groom do during the song?',
        'What was the DJ\'s name or sign?',
        'Who started clapping first?',
        'What song actually played?',
      ],
    },
    {
      prompt: "You were at a work meeting when someone's kid walked into the Zoom frame, held up a drawing, and announced 'this is daddy's boss, he is a snake' then left.",
      fragments: [
        'The drawing was in green crayon, very clearly a snake in a tie',
        'The kid looked about 5 years old',
        'The boss laughed and said "accurate"',
        'Chad from accounting unmuted just to say "incredible"',
      ],
      hints: [
        'A video call got interrupted',
        'A child said something honest',
        'It was during work',
        'People\'s reactions were funny',
      ],
      detailQuestions: [
        'What color was the drawing?',
        'About how old was the kid?',
        'What did the boss say?',
        'Who commented on it?',
        'What was the drawing of?',
      ],
    },
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
