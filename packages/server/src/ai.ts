import { GoogleGenAI } from '@google/genai';

export interface MemoryScenario {
  prompt: string;
  fragments: string[];
  hints: string[];
  detailQuestions: string[];
}

const SCENARIO_CATEGORIES = [
  'a moment of unexpected connection with a stranger',
  'something small that changed your entire day',
  'a goodbye that felt different',
  'waiting somewhere and noticing something odd',
  'a celebration that took an unexpected turn',
  'finding something that clearly belonged to someone else',
  'witnessing a private moment in public',
  'a familiar place that suddenly felt strange',
  'someone who reminded you of someone else',
  'the last time you saw a place before it changed',
  'overhearing something you probably shouldn\'t have',
  'a meal that became unexpectedly significant',
  'getting lost and finding something better',
  'the moment just before something changed forever',
  'a favor asked by someone you barely knew',
];

export async function generateMemoryScenario(geminiApiKey: string | undefined): Promise<MemoryScenario> {
  if (!geminiApiKey) {
    return getFallbackScenario();
  }

  const category = SCENARIO_CATEGORIES[Math.floor(Math.random() * SCENARIO_CATEGORIES.length)];

  const prompt = `You are creating content for a social deduction game called "DÉJÀ VU" where one player (the witness) receives a detailed memory, while other players (imposters) only get vague hints and must fake having the same memory.

Generate a scenario about: ${category}

WHAT MAKES A GOOD MEMORY:
- It should feel like something that actually happened to someone, not a movie scene
- The kind of moment you'd randomly remember while doing dishes five years later
- Mundane setting, but something small made it stick: a detail, a phrase, a feeling
- Specific enough to be vivid, universal enough that anyone could claim it

YOUR RESPONSE (JSON only, no other text):
{
  "prompt": "2-3 sentences in second person ('You were...'). Set the scene with atmosphere, then introduce the moment that made it memorable. Don't reveal the specific details, just the emotional shape of the memory.",

  "fragments": [
    "4 hyper-specific sensory details that only someone 'there' would know",
    "include: exact words spoken, precise colors or numbers, textures, sounds",
    "these should feel like the random vivid details real memories have",
    "one should be slightly odd or unexpected"
  ],

  "hints": [
    "4 vague contextual clues for imposters to build lies around",
    "emotional tone and general setting only",
    "broad enough to fabricate details, narrow enough to stay consistent",
    "should NOT overlap with fragments (imposters shouldn't guess the specifics)"
  ],

  "detailQuestions": [
    "5 questions that separate witnesses from imposters",
    "probe sensory specifics: colors, numbers, exact words, textures",
    "a real witness answers instantly; an imposter hesitates or invents",
    "avoid yes/no questions, ask for specifics they'd have to recall"
  ]
}

QUALITY CHECK before responding:
- Could someone guess any fragment from the hints alone? If yes, make hints vaguer.
- Are the fragments specific enough that two people couldn't invent the same answer?
- Do the questions target the fragments without obviously telegraphing them?`;

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
      prompt: "You were sitting alone at a coffee shop when someone at the next table got a phone call. You couldn't help but overhear. By the time they hung up, something about your day had shifted, though you couldn't say exactly why.",
      fragments: [
        'They answered with "I knew you\'d call today" in a voice that sounded relieved',
        'Their ceramic mug had a chip on the rim and a faded logo of a cartoon bee',
        'The call lasted exactly four minutes because you watched the clock',
        'When they hung up, they whispered "finally" to no one',
      ],
      hints: [
        'You overheard one side of a personal phone call',
        'Something about the person seemed worn down or waiting',
        'The conversation sounded like it mattered to them',
        'You noticed details because you had nothing else to look at',
      ],
      detailQuestions: [
        'What were the first words they said when they answered?',
        'How long did the call last?',
        'What was on their mug?',
        'What did they do or say after hanging up?',
        'How would you describe their tone when they first picked up?',
      ],
    },
    {
      prompt: "You were helping a friend move out of their apartment. While packing the last box in the bedroom, you found something wedged behind the radiator that clearly wasn't theirs. Your friend had no idea how long it had been there.",
      fragments: [
        'It was a polaroid of three people at a beach, their faces sun-bleached and hard to make out',
        'On the back, in smudged blue ink: "last one before everything"',
        'The photo was dated August 2019 in the white border',
        'One person was mid-laugh, holding a striped beach umbrella like a sword',
      ],
      hints: [
        'You found something personal that belonged to a stranger',
        'It was a memento from a happy moment',
        'There was writing that felt private',
        'It made you wonder about the people who lived there before',
      ],
      detailQuestions: [
        'What exactly did you find?',
        'What was written on it, word for word?',
        'What year or date was on it?',
        'How many people were in it?',
        'What was someone doing that caught your eye?',
      ],
    },
    {
      prompt: "You were at a wedding reception when the best man's speech veered somewhere no one expected. The room got very quiet. You watched the groom's face and couldn't look away.",
      fragments: [
        'The best man paused mid-sentence and said "I promised myself I wouldn\'t do this"',
        'The groom was wearing suspenders with small embroidered anchors',
        'Someone at table six knocked over a water glass and no one moved to clean it',
        'The bride put her hand on the groom\'s knee, not his hand',
      ],
      hints: [
        'A speech at a celebration went off-script',
        'There was a long uncomfortable silence',
        'You watched how the couple reacted to each other',
        'Small accidents happened that people ignored',
      ],
      detailQuestions: [
        'What exactly did the best man say when the speech shifted?',
        'What did you notice about what the groom was wearing?',
        'What happened that broke the silence?',
        'How did the bride respond physically?',
        'Which table had the small accident?',
      ],
    },
    {
      prompt: "You were stuck in an elevator for almost twenty minutes with one other person. Neither of you spoke the whole time. Then, right before the doors finally opened, they turned to you and said something you still think about.",
      fragments: [
        'They were carrying a canvas tote bag with a sad-looking cartoon lemon on it',
        'The elevator stuttered to a stop between floors 7 and 8, you could see both buttons half-lit',
        'Right before the doors opened they said "Some people are just waiting to be found"',
        'They were wearing one brown sock and one that was almost brown but slightly green',
      ],
      hints: [
        'You were briefly trapped somewhere with a stranger',
        'There was a long stretch of awkward silence',
        'They said something strange or memorable at the end',
        'You had time to notice small details about them',
      ],
      detailQuestions: [
        'What were they carrying?',
        'Where exactly did the elevator stop?',
        'What did they say to you before leaving?',
        'What did you notice about their socks or shoes?',
        'How long were you stuck, roughly?',
      ],
    },
    {
      prompt: "You were at a laundromat late at night when someone's dryer finished. The clothes just sat there, tumbling on residual heat, and no one ever came back. You waited longer than you should have.",
      fragments: [
        'Dryer number 12, the one closest to the vending machine',
        'Mostly kids\' clothes with dinosaur prints, and one oversized grey cardigan',
        'A post-it note fell out that said "call her back" in red pen',
        'You gave up and left at 11:47 PM, you remember checking your phone',
      ],
      hints: [
        'Someone left behind something and never returned',
        'You felt strangely responsible for a stranger\'s things',
        'It was late and the place was mostly empty',
        'The abandoned items hinted at someone\'s life',
      ],
      detailQuestions: [
        'Which dryer number was it?',
        'What kinds of clothes were inside?',
        'What did the note say?',
        'What time did you finally leave?',
        'Where in the laundromat was the dryer located?',
      ],
    },
    {
      prompt: "You were on a delayed flight, stuck on the tarmac for over an hour. The person next to you fell asleep and their book slipped into your lap. You read a few pages before you could stop yourself.",
      fragments: [
        'It was a water-damaged paperback of "The Remains of the Day" with a cracked spine',
        'Someone had underlined the phrase "dignity in service" in faint pencil',
        'A boarding pass from a previous flight was tucked in as a bookmark (gate B7)',
        'They woke up when the captain announced 45 more minutes and apologized three times',
      ],
      hints: [
        'You were stuck waiting and had nothing to do',
        'You accidentally saw something personal belonging to a stranger',
        'It was a book or document of some kind',
        'The moment ended a bit awkwardly',
      ],
      detailQuestions: [
        'What book was it?',
        'What phrase or passage had been marked?',
        'What was being used as a bookmark?',
        'How did the situation end?',
        'What condition was the book in?',
      ],
    },
    {
      prompt: "You were sitting in a hospital waiting room for hours. Across from you, a man got a phone call, listened for about ten seconds, and then started crying silently. No one else seemed to notice.",
      fragments: [
        'He was wearing a faded denim jacket with a small enamel pin of a rainbow',
        'He said "okay" four times in a row, each one quieter than the last',
        'The clock on the wall was stuck at 3:42 and had been the whole time you were there',
        'After hanging up he stared at the vending machine for a full minute without moving',
      ],
      hints: [
        'You witnessed someone receive difficult news',
        'You were in a place where people wait anxiously',
        'You noticed because everyone else was distracted',
        'Small details stood out in the stillness',
      ],
      detailQuestions: [
        'What was he wearing that you remember?',
        'What did he say on the phone?',
        'What time was the clock stuck on?',
        'What did he do immediately after hanging up?',
        'What stood out about his jacket?',
      ],
    },
    {
      prompt: "You ducked into a used bookstore to get out of the rain. While you waited, you overheard the owner talking to what seemed like a very old friend. They didn't know you were listening.",
      fragments: [
        'The owner said "I still have the letter, I just can\'t read it again"',
        'Rain drummed on a skylight you hadn\'t noticed until then',
        'The friend was holding a book called "Birds of the Pacific Northwest" but never bought it',
        'A cat was asleep on a stack of water-stained atlases near the philosophy section',
      ],
      hints: [
        'You took shelter somewhere and ended up staying longer than planned',
        'You overheard a conversation that felt private',
        'The place had a certain dusty, quiet atmosphere',
        'There were small details that made it feel lived-in',
      ],
      detailQuestions: [
        'What did the owner say that stood out to you?',
        'What sound do you remember from outside?',
        'What book was the friend holding?',
        'Was there an animal? What was it doing?',
        'What section of the store were you near?',
      ],
    },
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
