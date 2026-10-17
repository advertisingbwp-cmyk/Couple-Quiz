import { QuizQuestion } from "./types";

export const QUIZ_QUESTION_CATEGORIES = [
  "favorites",
  "habits",
  "food",
  "travel",
  "childhood",
  "funny scenarios",
  "dreams",
  "hobbies",
  "preferences",
] as const;

export type QuizQuestionCategory = (typeof QUIZ_QUESTION_CATEGORIES)[number];

export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    "id": "q1",
    "category": "hobbies",
    "question": "Mera sab se bara secret talent kya hai?",
    "emoji": "🎭",
    "options": [
      {
        "id": 0,
        "text": "Bathroom Singer 🎤",
        "emoji": "🎤",
        "imageUrl": "/quiz/options/q1_opt0.svg"
      },
      {
        "id": 1,
        "text": "Biryani Expert 🍲",
        "emoji": "🍲",
        "imageUrl": "/quiz/options/q1_opt1.svg"
      },
      {
        "id": 2,
        "text": "14 Ghante Sona 😴",
        "emoji": "😴",
        "imageUrl": "/quiz/options/q1_opt2.svg"
      },
      {
        "id": 3,
        "text": "Pro Gamer 🎮",
        "emoji": "🎮",
        "imageUrl": "/quiz/options/q1_opt3.svg"
      },
      {
        "id": 4,
        "text": "Speed Texter ⚡",
        "emoji": "⚡",
        "imageUrl": "/quiz/options/q1_opt4.svg"
      },
      {
        "id": 5,
        "text": "Master Negotiator / Bargainer 🤝",
        "emoji": "🤝",
        "imageUrl": "/quiz/options/q1_opt5.svg"
      },
      {
        "id": 6,
        "text": "Mimicry & Accents 🎭",
        "emoji": "🎭",
        "imageUrl": "/quiz/options/q1_opt6.svg"
      },
      {
        "id": 7,
        "text": "Photographer Eye 📸",
        "emoji": "📸",
        "imageUrl": "/quiz/options/q1_opt7.svg"
      },
      {
        "id": 8,
        "text": "Memory Master 🧠",
        "emoji": "🧠",
        "imageUrl": "/quiz/options/q1_opt8.svg"
      }
    ]
  },
  {
    "id": "q2",
    "category": "dreams",
    "question": "Agar mujhe 1 crore rupay milein to sab se pehle kya karunga?",
    "emoji": "💰",
    "options": [
      {
        "id": 0,
        "text": "World Tour par nikal jaunga ✈️",
        "imageUrl": "/quiz/options/q2_opt0.svg"
      },
      {
        "id": 1,
        "text": "Dream Car khareedunga 🏎️",
        "imageUrl": "/quiz/options/q2_opt1.svg"
      },
      {
        "id": 2,
        "text": "Bank mein safe rakhunga 🏦",
        "imageUrl": "/quiz/options/q2_opt2.svg"
      },
      {
        "id": 3,
        "text": "Doston ko shandaar party 🥳",
        "imageUrl": "/quiz/options/q2_opt3.svg"
      }
    ]
  },
  {
    "id": "q3",
    "category": "preferences",
    "question": "Mujhe sab se zyada gussa kis baat par aata hai?",
    "emoji": "😡",
    "options": [
      {
        "id": 0,
        "text": "Bhook lagne par 🍔",
        "imageUrl": "/quiz/options/q3_opt0.svg"
      },
      {
        "id": 1,
        "text": "Internet slow hone par 📶",
        "imageUrl": "/quiz/options/q3_opt1.svg"
      },
      {
        "id": 2,
        "text": "Jab koi call na uthaye 📵",
        "imageUrl": "/quiz/options/q3_opt2.svg"
      },
      {
        "id": 3,
        "text": "Jhoot bolne par 🤥",
        "imageUrl": "/quiz/options/q3_opt3.svg"
      }
    ]
  },
  {
    "id": "q4",
    "category": "hobbies",
    "question": "Mera favourite timepass konsa hai?",
    "emoji": "📱",
    "options": [
      {
        "id": 0,
        "text": "Reels / TikTok scroll karna 📱",
        "imageUrl": "/quiz/options/q4_opt0.svg"
      },
      {
        "id": 1,
        "text": "Ghor neend sona 🛌",
        "imageUrl": "/quiz/options/q4_opt1.svg"
      },
      {
        "id": 2,
        "text": "Online Gaming 🎯",
        "imageUrl": "/quiz/options/q4_opt2.svg"
      },
      {
        "id": 3,
        "text": "Doston se lambi baatein 🗣️",
        "imageUrl": "/quiz/options/q4_opt3.svg"
      }
    ]
  },
  {
    "id": "q5",
    "category": "habits",
    "question": "Meri sab se buri aadat konsi hai?",
    "emoji": "🙈",
    "options": [
      {
        "id": 0,
        "text": "Har waqt phone use karna 📲",
        "imageUrl": "/quiz/options/q5_opt0.svg"
      },
      {
        "id": 1,
        "text": "Dopehar tak sona ⏰",
        "imageUrl": "/quiz/options/q5_opt1.svg"
      },
      {
        "id": 2,
        "text": "Overthinking karna 🧠",
        "imageUrl": "/quiz/options/q5_opt2.svg"
      },
      {
        "id": 3,
        "text": "Har baat par hasna 😂",
        "imageUrl": "/quiz/options/q5_opt3.svg"
      }
    ]
  },
  {
    "id": "q6",
    "category": "food",
    "question": "Mera favourite street food kya hai?",
    "emoji": "🍕",
    "options": [
      {
        "id": 0,
        "text": "Garma Garam Biryani 🍛",
        "emoji": "🍛",
        "imageUrl": "/quiz/options/q6_opt0.svg"
      },
      {
        "id": 1,
        "text": "Cheesy Pizza / Burger 🍔",
        "emoji": "🍔",
        "imageUrl": "/quiz/options/q6_opt1.svg"
      },
      {
        "id": 2,
        "text": "Chai & Paratha ☕",
        "emoji": "☕",
        "imageUrl": "/quiz/options/q6_opt2.svg"
      },
      {
        "id": 3,
        "text": "Crispy Gol Gappay 🥣",
        "emoji": "🥣",
        "imageUrl": "/quiz/options/q6_opt3.svg"
      },
      {
        "id": 4,
        "text": "Shawarma Roll 🌯",
        "emoji": "🌯",
        "imageUrl": "/quiz/options/q6_opt4.svg"
      },
      {
        "id": 5,
        "text": "Dahi Bhallay / Chaat 🥗",
        "emoji": "🥗",
        "imageUrl": "/quiz/options/q6_opt5.svg"
      },
      {
        "id": 6,
        "text": "Crispy Samosay 🥟",
        "emoji": "🥟",
        "imageUrl": "/quiz/options/q6_opt6.svg"
      },
      {
        "id": 7,
        "text": "French Fries with Mayo 🍟",
        "emoji": "🍟",
        "imageUrl": "/quiz/options/q6_opt7.svg"
      },
      {
        "id": 8,
        "text": "Desi Bun Kabab 🥙",
        "emoji": "🥙",
        "imageUrl": "/quiz/options/q6_opt8.svg"
      }
    ]
  },
  {
    "id": "q7",
    "category": "funny scenarios",
    "question": "Mujhe sab se zyada kis cheez se dar lagta hai?",
    "emoji": "😱",
    "options": [
      {
        "id": 0,
        "text": "Chipkali ya Keeray 🦎",
        "imageUrl": "/quiz/options/q7_opt0.svg"
      },
      {
        "id": 1,
        "text": "Exams / Fail hone se 📝",
        "imageUrl": "/quiz/options/q7_opt1.svg"
      },
      {
        "id": 2,
        "text": "Bhoot aur andheray se 👻",
        "imageUrl": "/quiz/options/q7_opt2.svg"
      },
      {
        "id": 3,
        "text": "Phone ki battery 1% hona 🪫",
        "imageUrl": "/quiz/options/q7_opt3.svg"
      }
    ]
  },
  {
    "id": "q8",
    "category": "travel",
    "question": "Mera dream holiday destination konsa hai?",
    "emoji": "🏖️",
    "options": [
      {
        "id": 0,
        "text": "Switzerland / Mountains 🏔️",
        "emoji": "🏔️",
        "imageUrl": "/quiz/options/q8_opt0.svg"
      },
      {
        "id": 1,
        "text": "Dubai / Shopping 🏙️",
        "emoji": "🏙️",
        "imageUrl": "/quiz/options/q8_opt1.svg"
      },
      {
        "id": 2,
        "text": "Turkey / Historic 🇹🇷",
        "emoji": "🇹🇷",
        "imageUrl": "/quiz/options/q8_opt2.svg"
      },
      {
        "id": 3,
        "text": "Maldives / Beach 🏖️",
        "emoji": "🏖️",
        "imageUrl": "/quiz/options/q8_opt3.svg"
      },
      {
        "id": 4,
        "text": "Japan / Tech & Anime 🌸",
        "emoji": "🌸",
        "imageUrl": "/quiz/options/q8_opt4.svg"
      },
      {
        "id": 5,
        "text": "Paris / Romance 🗼",
        "emoji": "🗼",
        "imageUrl": "/quiz/options/q8_opt5.svg"
      }
    ]
  },
  {
    "id": "q9",
    "category": "preferences",
    "question": "Mera kharab mood theek karne ke liye kya chahiye?",
    "emoji": "💆",
    "options": [
      {
        "id": 0,
        "text": "Meri pasand ka khana 🍕",
        "imageUrl": "/quiz/options/q9_opt0.svg"
      },
      {
        "id": 1,
        "text": "Karak Chai ya Coffee ☕",
        "imageUrl": "/quiz/options/q9_opt1.svg"
      },
      {
        "id": 2,
        "text": "Mujhe akela chhor do 🤫",
        "imageUrl": "/quiz/options/q9_opt2.svg"
      },
      {
        "id": 3,
        "text": "Lambi Drive ya Walk 🚗",
        "imageUrl": "/quiz/options/q9_opt3.svg"
      }
    ]
  },
  {
    "id": "q10",
    "category": "habits",
    "question": "Kya mein kisi ka secret (raaz) chupa sakta hoon?",
    "emoji": "🤫",
    "options": [
      {
        "id": 0,
        "text": "Haan, kabar tak sath le jaunga 🔒",
        "imageUrl": "/quiz/options/q10_opt0.svg"
      },
      {
        "id": 1,
        "text": "Sirf 5 minute tak ⏳",
        "imageUrl": "/quiz/options/q10_opt1.svg"
      },
      {
        "id": 2,
        "text": "Pet mein dard hota hai bataye bina 😅",
        "imageUrl": "/quiz/options/q10_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sirf best friend ko bataunga 🤫",
        "imageUrl": "/quiz/options/q10_opt3.svg"
      }
    ]
  },
  {
    "id": "q11",
    "category": "funny scenarios",
    "question": "Agar hum jungle mein phans jayein to kya hoga?",
    "emoji": "🌲",
    "options": [
      {
        "id": 0,
        "text": "Mein sab se pehle bhaag jaunga 🏃",
        "imageUrl": "/quiz/options/q11_opt0.svg"
      },
      {
        "id": 1,
        "text": "Himmat se rasta dhoondenge 🧭",
        "imageUrl": "/quiz/options/q11_opt1.svg"
      },
      {
        "id": 2,
        "text": "Sher humein kha jayega 🦁",
        "imageUrl": "/quiz/options/q11_opt2.svg"
      },
      {
        "id": 3,
        "text": "Ek doosre par cheekhenge 😱",
        "imageUrl": "/quiz/options/q11_opt3.svg"
      }
    ]
  },
  {
    "id": "q12",
    "category": "habits",
    "question": "Mein subah jaldi uthta hoon ya raat ko jagta hoon?",
    "emoji": "🦉",
    "options": [
      {
        "id": 0,
        "text": "Raat ka Ullu (Night Owl) 🦉",
        "imageUrl": "/quiz/options/q12_opt0.svg"
      },
      {
        "id": 1,
        "text": "Subah ka Parinda (Early Bird) 🌅",
        "imageUrl": "/quiz/options/q12_opt1.svg"
      },
      {
        "id": 2,
        "text": "24 Ghante Sona Pasand Hai 🛌",
        "imageUrl": "/quiz/options/q12_opt2.svg"
      },
      {
        "id": 3,
        "text": "Routine ka koi pata nahi 🌀",
        "imageUrl": "/quiz/options/q12_opt3.svg"
      }
    ]
  },
  {
    "id": "q13",
    "category": "favorites",
    "question": "Meri sab se zyada use hone wali app konsi hai?",
    "emoji": "📲",
    "options": [
      {
        "id": 0,
        "text": "WhatsApp 🟢",
        "emoji": "🟢",
        "imageUrl": "/quiz/options/q13_opt0.svg"
      },
      {
        "id": 1,
        "text": "Instagram 📸",
        "emoji": "📸",
        "imageUrl": "/quiz/options/q13_opt1.svg"
      },
      {
        "id": 2,
        "text": "YouTube 🔴",
        "emoji": "🔴",
        "imageUrl": "/quiz/options/q13_opt2.svg"
      },
      {
        "id": 3,
        "text": "TikTok 🎵",
        "emoji": "🎵",
        "imageUrl": "/quiz/options/q13_opt3.svg"
      },
      {
        "id": 4,
        "text": "Spotify / Music 🎧",
        "emoji": "🎧",
        "imageUrl": "/quiz/options/q13_opt4.svg"
      },
      {
        "id": 5,
        "text": "Netflix / Movies 🍿",
        "emoji": "🍿",
        "imageUrl": "/quiz/options/q13_opt5.svg"
      }
    ]
  },
  {
    "id": "q14",
    "category": "dreams",
    "question": "Agar mujhe super power mile to konsi chahiye?",
    "emoji": "🦸",
    "options": [
      {
        "id": 0,
        "text": "Invisibility (Ghayab hona) 👻",
        "emoji": "👻",
        "imageUrl": "/quiz/options/q14_opt0.svg"
      },
      {
        "id": 1,
        "text": "Mind Reading (Dimagh parhna) 🧠",
        "emoji": "🧠",
        "imageUrl": "/quiz/options/q14_opt1.svg"
      },
      {
        "id": 2,
        "text": "Time Travel ⏳",
        "emoji": "⏳",
        "imageUrl": "/quiz/options/q14_opt2.svg"
      },
      {
        "id": 3,
        "text": "Udne ki taqat (Flying) 🦅",
        "emoji": "🦅",
        "imageUrl": "/quiz/options/q14_opt3.svg"
      },
      {
        "id": 4,
        "text": "Teleportation (Kahin bhi pohnchna) ⚡",
        "emoji": "⚡",
        "imageUrl": "/quiz/options/q14_opt4.svg"
      },
      {
        "id": 5,
        "text": "Super Strength (Taqat) 💪",
        "emoji": "💪",
        "imageUrl": "/quiz/options/q14_opt5.svg"
      },
      {
        "id": 6,
        "text": "Healing Power (Bimari door karna) ❤️",
        "emoji": "❤️",
        "imageUrl": "/quiz/options/q14_opt6.svg"
      },
      {
        "id": 7,
        "text": "Unlimited Wealth Creation 💰",
        "emoji": "💰",
        "imageUrl": "/quiz/options/q14_opt7.svg"
      },
      {
        "id": 8,
        "text": "Shape Shifting 🦎",
        "emoji": "🦎",
        "imageUrl": "/quiz/options/q14_opt8.svg"
      }
    ]
  },
  {
    "id": "q15",
    "category": "funny scenarios",
    "question": "Agar police mujhe ghalti se pakar le to doston ka reaction?",
    "emoji": "🚔",
    "options": [
      {
        "id": 0,
        "text": "Haste haste video banayenge 😂",
        "imageUrl": "/quiz/options/q15_opt0.svg"
      },
      {
        "id": 1,
        "text": "Thane aakar chhurwayenge 🤝",
        "imageUrl": "/quiz/options/q15_opt1.svg"
      },
      {
        "id": 2,
        "text": "Pehchanne se inkar kar denge 🏃",
        "imageUrl": "/quiz/options/q15_opt2.svg"
      },
      {
        "id": 3,
        "text": "Ghar walon ko shikayat lagayenge 📞",
        "imageUrl": "/quiz/options/q15_opt3.svg"
      }
    ]
  },
  {
    "id": "q16",
    "category": "favorites",
    "question": "Mera favourite music genre ya singer type kya hai?",
    "emoji": "🎵",
    "options": [
      {
        "id": 0,
        "text": "Arijit / Sad Melodies 💔",
        "emoji": "💔",
        "imageUrl": "/quiz/options/q16_opt0.svg"
      },
      {
        "id": 1,
        "text": "Atif Aslam / Romantic Hits 🎸",
        "emoji": "🎸",
        "imageUrl": "/quiz/options/q16_opt1.svg"
      },
      {
        "id": 2,
        "text": "Sidhu / Punjabi Beats 🏎️",
        "emoji": "🏎️",
        "imageUrl": "/quiz/options/q16_opt2.svg"
      },
      {
        "id": 3,
        "text": "EDM / English Pop 🎧",
        "emoji": "🎧",
        "imageUrl": "/quiz/options/q16_opt3.svg"
      },
      {
        "id": 4,
        "text": "Classic Ghazals & Sufi 📜",
        "emoji": "📜",
        "imageUrl": "/quiz/options/q16_opt4.svg"
      },
      {
        "id": 5,
        "text": "Heavy Rock & Metal ⚡",
        "emoji": "⚡",
        "imageUrl": "/quiz/options/q16_opt5.svg"
      }
    ]
  },
  {
    "id": "q17",
    "category": "favorites",
    "question": "Mera favourite weather ya season konsa hai?",
    "emoji": "⛅",
    "options": [
      {
        "id": 0,
        "text": "Sardi (Chilly Winter) ❄️",
        "imageUrl": "/quiz/options/q17_opt0.svg"
      },
      {
        "id": 1,
        "text": "Barish (Rainy Monsoon) 🌧️",
        "imageUrl": "/quiz/options/q17_opt1.svg"
      },
      {
        "id": 2,
        "text": "Khushgawar Spring (Bahar) 🌸",
        "imageUrl": "/quiz/options/q17_opt2.svg"
      },
      {
        "id": 3,
        "text": "Garmi (AC Lover) ☀️",
        "imageUrl": "/quiz/options/q17_opt3.svg"
      }
    ]
  },
  {
    "id": "q18",
    "category": "favorites",
    "question": "Mera favourite movie genre konsa hai?",
    "emoji": "🎬",
    "options": [
      {
        "id": 0,
        "text": "Action & Thriller 💥",
        "imageUrl": "/quiz/options/q18_opt0.svg"
      },
      {
        "id": 1,
        "text": "Romantic Comedy ❤️",
        "imageUrl": "/quiz/options/q18_opt1.svg"
      },
      {
        "id": 2,
        "text": "Horror & Mystery 👻",
        "imageUrl": "/quiz/options/q18_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sci-Fi / Marvel Universe 🚀",
        "imageUrl": "/quiz/options/q18_opt3.svg"
      }
    ]
  },
  {
    "id": "q19",
    "category": "favorites",
    "question": "Mera favourite color vibe kya hai?",
    "emoji": "🎨",
    "options": [
      {
        "id": 0,
        "text": "Classic Black / Dark 🖤",
        "imageUrl": "/quiz/options/q19_opt0.svg"
      },
      {
        "id": 1,
        "text": "Calm Blue / Sky 💙",
        "imageUrl": "/quiz/options/q19_opt1.svg"
      },
      {
        "id": 2,
        "text": "Vibrant Yellow / Red 💛",
        "imageUrl": "/quiz/options/q19_opt2.svg"
      },
      {
        "id": 3,
        "text": "Pastel & Minimalist 🤍",
        "imageUrl": "/quiz/options/q19_opt3.svg"
      }
    ]
  },
  {
    "id": "q20",
    "category": "favorites",
    "question": "Mera favourite ice cream flavor konsa hai?",
    "emoji": "🍦",
    "options": [
      {
        "id": 0,
        "text": "Chocolate Brownie 🍫",
        "emoji": "🍫",
        "imageUrl": "/quiz/options/q20_opt0.svg"
      },
      {
        "id": 1,
        "text": "Vanilla / Caramel 🍨",
        "emoji": "🍨",
        "imageUrl": "/quiz/options/q20_opt1.svg"
      },
      {
        "id": 2,
        "text": "Mango / Fruity 🥭",
        "emoji": "🥭",
        "imageUrl": "/quiz/options/q20_opt2.svg"
      },
      {
        "id": 3,
        "text": "Pistachio / Kulfa 🍧",
        "emoji": "🍧",
        "imageUrl": "/quiz/options/q20_opt3.svg"
      },
      {
        "id": 4,
        "text": "Strawberry Swirl 🍓",
        "emoji": "🍓",
        "imageUrl": "/quiz/options/q20_opt4.svg"
      },
      {
        "id": 5,
        "text": "Cookies & Cream 🍪",
        "emoji": "🍪",
        "imageUrl": "/quiz/options/q20_opt5.svg"
      }
    ]
  },
  {
    "id": "q21",
    "category": "favorites",
    "question": "Mera favourite weekend plan kya hota hai?",
    "emoji": "🛋️",
    "options": [
      {
        "id": 0,
        "text": "Bistar mein Netflix & Chill 🍿",
        "imageUrl": "/quiz/options/q21_opt0.svg"
      },
      {
        "id": 1,
        "text": "Doston ke sath chai & gup-shup ☕",
        "imageUrl": "/quiz/options/q21_opt1.svg"
      },
      {
        "id": 2,
        "text": "Outdoor shopping ya sports ⚽",
        "imageUrl": "/quiz/options/q21_opt2.svg"
      },
      {
        "id": 3,
        "text": "Nayi jagah explore karna 🚗",
        "imageUrl": "/quiz/options/q21_opt3.svg"
      }
    ]
  },
  {
    "id": "q22",
    "category": "favorites",
    "question": "Mera favourite festival ya celebration konsa hai?",
    "emoji": "🎉",
    "options": [
      {
        "id": 0,
        "text": "Eid / Family gatherings 🌙",
        "imageUrl": "/quiz/options/q22_opt0.svg"
      },
      {
        "id": 1,
        "text": "New Year Eve bash 🎆",
        "imageUrl": "/quiz/options/q22_opt1.svg"
      },
      {
        "id": 2,
        "text": "Apna Birthday party 🎂",
        "imageUrl": "/quiz/options/q22_opt2.svg"
      },
      {
        "id": 3,
        "text": "Shaadi functions 💃",
        "imageUrl": "/quiz/options/q22_opt3.svg"
      }
    ]
  },
  {
    "id": "q23",
    "category": "favorites",
    "question": "Mera favourite subject school/college mein kya tha?",
    "emoji": "📚",
    "options": [
      {
        "id": 0,
        "text": "Maths / Science 🔬",
        "imageUrl": "/quiz/options/q23_opt0.svg"
      },
      {
        "id": 1,
        "text": "Literature & Arts 🎨",
        "imageUrl": "/quiz/options/q23_opt1.svg"
      },
      {
        "id": 2,
        "text": "History & Stories 🏛️",
        "imageUrl": "/quiz/options/q23_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sports & Break Period 🏃",
        "imageUrl": "/quiz/options/q23_opt3.svg"
      }
    ]
  },
  {
    "id": "q24",
    "category": "favorites",
    "question": "Mera favourite daily beverage konsa hai?",
    "emoji": "🥤",
    "options": [
      {
        "id": 0,
        "text": "Karak Doodh Patti Chai ☕",
        "emoji": "☕",
        "imageUrl": "/quiz/options/q24_opt0.svg"
      },
      {
        "id": 1,
        "text": "Iced Cold Coffee 🧋",
        "emoji": "🧋",
        "imageUrl": "/quiz/options/q24_opt1.svg"
      },
      {
        "id": 2,
        "text": "Fresh Juice / Smoothie 🥤",
        "emoji": "🥤",
        "imageUrl": "/quiz/options/q24_opt2.svg"
      },
      {
        "id": 3,
        "text": "Chilled Soda / Cold Drink 🧊",
        "emoji": "🧊",
        "imageUrl": "/quiz/options/q24_opt3.svg"
      },
      {
        "id": 4,
        "text": "Green Tea / Detox 🍵",
        "emoji": "🍵",
        "imageUrl": "/quiz/options/q24_opt4.svg"
      },
      {
        "id": 5,
        "text": "Mint Lemonade / Refreshing 🍋",
        "emoji": "🍋",
        "imageUrl": "/quiz/options/q24_opt5.svg"
      }
    ]
  },
  {
    "id": "q25",
    "category": "favorites",
    "question": "Mera favourite shopping item kya hota hai?",
    "emoji": "🛍️",
    "options": [
      {
        "id": 0,
        "text": "Kapray aur Outfits 👗",
        "imageUrl": "/quiz/options/q25_opt0.svg"
      },
      {
        "id": 1,
        "text": "Sneakers aur Jootay 👟",
        "imageUrl": "/quiz/options/q25_opt1.svg"
      },
      {
        "id": 2,
        "text": "Tech gadgets & accessories 📱",
        "imageUrl": "/quiz/options/q25_opt2.svg"
      },
      {
        "id": 3,
        "text": "Khane peene ki cheezein 🍕",
        "imageUrl": "/quiz/options/q25_opt3.svg"
      }
    ]
  },
  {
    "id": "q26",
    "category": "favorites",
    "question": "Mera favourite board ya mobile game konsa hai?",
    "emoji": "🎲",
    "options": [
      {
        "id": 0,
        "text": "Ludo Star 🎲",
        "imageUrl": "/quiz/options/q26_opt0.svg"
      },
      {
        "id": 1,
        "text": "PUBG / COD Mobile 🔫",
        "imageUrl": "/quiz/options/q26_opt1.svg"
      },
      {
        "id": 2,
        "text": "Chess / Mind games ♟️",
        "imageUrl": "/quiz/options/q26_opt2.svg"
      },
      {
        "id": 3,
        "text": "Subway Surfers / Casual games 🏃",
        "imageUrl": "/quiz/options/q26_opt3.svg"
      }
    ]
  },
  {
    "id": "q27",
    "category": "favorites",
    "question": "Mera din ka favourite time konsa hai?",
    "emoji": "🌅",
    "options": [
      {
        "id": 0,
        "text": "Early morning freshness 🌅",
        "imageUrl": "/quiz/options/q27_opt0.svg"
      },
      {
        "id": 1,
        "text": "Golden sunset evening 🌇",
        "imageUrl": "/quiz/options/q27_opt1.svg"
      },
      {
        "id": 2,
        "text": "Late midnight peace 🌌",
        "imageUrl": "/quiz/options/q27_opt2.svg"
      },
      {
        "id": 3,
        "text": "Dopehar ki neend 😴",
        "imageUrl": "/quiz/options/q27_opt3.svg"
      }
    ]
  },
  {
    "id": "q28",
    "category": "habits",
    "question": "Meri shopping karne ki aadat kaisi hai?",
    "emoji": "🛒",
    "options": [
      {
        "id": 0,
        "text": "Soch samajh kar budget mein 💡",
        "imageUrl": "/quiz/options/q28_opt0.svg"
      },
      {
        "id": 1,
        "text": "Impulsive buyer (jo dikhe khareed lo) 💸",
        "imageUrl": "/quiz/options/q28_opt1.svg"
      },
      {
        "id": 2,
        "text": "Window shopping only 👀",
        "imageUrl": "/quiz/options/q28_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sirf sale ya discounts par 🏷️",
        "imageUrl": "/quiz/options/q28_opt3.svg"
      }
    ]
  },
  {
    "id": "q29",
    "category": "habits",
    "question": "Kisi gathering par pohnchne ki meri aadat kya hai?",
    "emoji": "⏱️",
    "options": [
      {
        "id": 0,
        "text": "Hamesha waqt se 10 minute pehle 🕒",
        "imageUrl": "/quiz/options/q29_opt0.svg"
      },
      {
        "id": 1,
        "text": "Bilkul exact time par 🎯",
        "imageUrl": "/quiz/options/q29_opt1.svg"
      },
      {
        "id": 2,
        "text": "Hamesha 'bas 5 minute' late 🐢",
        "imageUrl": "/quiz/options/q29_opt2.svg"
      },
      {
        "id": 3,
        "text": "Aakhri minute par plan cancel 🙈",
        "imageUrl": "/quiz/options/q29_opt3.svg"
      }
    ]
  },
  {
    "id": "q30",
    "category": "habits",
    "question": "Mera room ya desk aam tor par kaisa rehta hai?",
    "emoji": "🧹",
    "options": [
      {
        "id": 0,
        "text": "Super neat aur organized ✨",
        "imageUrl": "/quiz/options/q30_opt0.svg"
      },
      {
        "id": 1,
        "text": "Organized chaos (mujhe sab pata hai) 📁",
        "imageUrl": "/quiz/options/q30_opt1.svg"
      },
      {
        "id": 2,
        "text": "Har taraf saman bikhra hua 🌀",
        "imageUrl": "/quiz/options/q30_opt2.svg"
      },
      {
        "id": 3,
        "text": "Jab mehman ayen tab hi saaf 🛋️",
        "imageUrl": "/quiz/options/q30_opt3.svg"
      }
    ]
  },
  {
    "id": "q31",
    "category": "habits",
    "question": "WhatsApp messages ka reply kitni der mein karta hoon?",
    "emoji": "💬",
    "options": [
      {
        "id": 0,
        "text": "1 second mein (Phone hamesha hath mein) ⚡",
        "imageUrl": "/quiz/options/q31_opt0.svg"
      },
      {
        "id": 1,
        "text": "Kuch ghanton baad ⏳",
        "imageUrl": "/quiz/options/q31_opt1.svg"
      },
      {
        "id": 2,
        "text": "Seen karke bhool jana 👻",
        "imageUrl": "/quiz/options/q31_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sirf voice notes se 🎙️",
        "imageUrl": "/quiz/options/q31_opt3.svg"
      }
    ]
  },
  {
    "id": "q32",
    "category": "habits",
    "question": "Movie dekhte waqt meri aadat kya hoti hai?",
    "emoji": "🍿",
    "options": [
      {
        "id": 0,
        "text": "Start hone se pehle popcorn khatam 🍿",
        "imageUrl": "/quiz/options/q32_opt0.svg"
      },
      {
        "id": 1,
        "text": "Darmiyan mein spoiler maangna 🗣️",
        "imageUrl": "/quiz/options/q32_opt1.svg"
      },
      {
        "id": 2,
        "text": "15 minute mein so jana 😴",
        "imageUrl": "/quiz/options/q32_opt2.svg"
      },
      {
        "id": 3,
        "text": "Puri movie concentrate karna 🤫",
        "imageUrl": "/quiz/options/q32_opt3.svg"
      }
    ]
  },
  {
    "id": "q33",
    "category": "habits",
    "question": "Subah alarm bajne par mera reaction kya hota hai?",
    "emoji": "⏰",
    "options": [
      {
        "id": 0,
        "text": "Pehle alarm par foran uthna 🏃",
        "imageUrl": "/quiz/options/q33_opt0.svg"
      },
      {
        "id": 1,
        "text": "5 baar snooze dabana 💤",
        "imageUrl": "/quiz/options/q33_opt1.svg"
      },
      {
        "id": 2,
        "text": "Alarm band karke dobara sona 🛌",
        "imageUrl": "/quiz/options/q33_opt2.svg"
      },
      {
        "id": 3,
        "text": "Alarm sune bina sote rehna 🔕",
        "imageUrl": "/quiz/options/q33_opt3.svg"
      }
    ]
  },
  {
    "id": "q34",
    "category": "habits",
    "question": "Ghar se nikalte waqt meri aadat kya hoti hai?",
    "emoji": "🔑",
    "options": [
      {
        "id": 0,
        "text": "Pocket check (Phone, Wallet, Keys) 🔍",
        "imageUrl": "/quiz/options/q34_opt0.svg"
      },
      {
        "id": 1,
        "text": "Hamesha koi cheez bhool jana 🤦",
        "imageUrl": "/quiz/options/q34_opt1.svg"
      },
      {
        "id": 2,
        "text": "Aaine mein 10 baar dekhna 🪞",
        "imageUrl": "/quiz/options/q34_opt2.svg"
      },
      {
        "id": 3,
        "text": "Late ho kar bhaagte hue nikalna ⚡",
        "imageUrl": "/quiz/options/q34_opt3.svg"
      }
    ]
  },
  {
    "id": "q35",
    "category": "habits",
    "question": "Ghalti hone par mera natural reaction kya hota hai?",
    "emoji": "🙇",
    "options": [
      {
        "id": 0,
        "text": "Foran maan kar maafi mangna 🤝",
        "imageUrl": "/quiz/options/q35_opt0.svg"
      },
      {
        "id": 1,
        "text": "Kisi doosre par ilzam lagana 😂",
        "imageUrl": "/quiz/options/q35_opt1.svg"
      },
      {
        "id": 2,
        "text": "Haste hue baat taal dena 😅",
        "imageUrl": "/quiz/options/q35_opt2.svg"
      },
      {
        "id": 3,
        "text": "Deep overthinking mein chale jana 🧠",
        "imageUrl": "/quiz/options/q35_opt3.svg"
      }
    ]
  },
  {
    "id": "q36",
    "category": "habits",
    "question": "Meri chai ya coffee peene ki routine kya hai?",
    "emoji": "☕",
    "options": [
      {
        "id": 0,
        "text": "Din mein 3-4 cup lazmi ☕",
        "imageUrl": "/quiz/options/q36_opt0.svg"
      },
      {
        "id": 1,
        "text": "Sirf nashte ke waqt 🍞",
        "imageUrl": "/quiz/options/q36_opt1.svg"
      },
      {
        "id": 2,
        "text": "Kabhi kabhi jab mood ho 🥤",
        "imageUrl": "/quiz/options/q36_opt2.svg"
      },
      {
        "id": 3,
        "text": "Chai bilkul pasand nahi 🚫",
        "imageUrl": "/quiz/options/q36_opt3.svg"
      }
    ]
  },
  {
    "id": "q37",
    "category": "habits",
    "question": "Naye logon se milte waqt mera behavior kaisa hota hai?",
    "emoji": "🤝",
    "options": [
      {
        "id": 0,
        "text": "Foran dost ban jana (Extrovert) 🤗",
        "imageUrl": "/quiz/options/q37_opt0.svg"
      },
      {
        "id": 1,
        "text": "Thoda sharmila aur reserved (Introvert) 😶",
        "imageUrl": "/quiz/options/q37_opt1.svg"
      },
      {
        "id": 2,
        "text": "Observe karna phir baat karna 🧐",
        "imageUrl": "/quiz/options/q37_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sirf formality wali baatein 👔",
        "imageUrl": "/quiz/options/q37_opt3.svg"
      }
    ]
  },
  {
    "id": "q38",
    "category": "habits",
    "question": "Social media par meri post karne ki aadat kya hai?",
    "emoji": "📸",
    "options": [
      {
        "id": 0,
        "text": "Daily stories aur posts 🌟",
        "imageUrl": "/quiz/options/q38_opt0.svg"
      },
      {
        "id": 1,
        "text": "Mahine mein ek adhi photo 🖼️",
        "imageUrl": "/quiz/options/q38_opt1.svg"
      },
      {
        "id": 2,
        "text": "Sirf doosron ki posts dekhna (Lurker) 👀",
        "imageUrl": "/quiz/options/q38_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sirf memes share karna 🤣",
        "imageUrl": "/quiz/options/q38_opt3.svg"
      }
    ]
  },
  {
    "id": "q39",
    "category": "habits",
    "question": "Kharab tabiyat hone par mera ravayya kaisa hota hai?",
    "emoji": "🤒",
    "options": [
      {
        "id": 0,
        "text": "Chup chaap dawa le kar aaram 💊",
        "imageUrl": "/quiz/options/q39_opt0.svg"
      },
      {
        "id": 1,
        "text": "Thoda sa bimaar ho kar dramay karna 🎭",
        "imageUrl": "/quiz/options/q39_opt1.svg"
      },
      {
        "id": 2,
        "text": "Bimari ko ignore karke kaam karna 💼",
        "imageUrl": "/quiz/options/q39_opt2.svg"
      },
      {
        "id": 3,
        "text": "Doctor ke paas jaane se darna 🏥",
        "imageUrl": "/quiz/options/q39_opt3.svg"
      }
    ]
  },
  {
    "id": "q40",
    "category": "food",
    "question": "Biryani aur Pizza mein se agar ek chunna pade?",
    "emoji": "🍕",
    "options": [
      {
        "id": 0,
        "text": "Desi Dum Biryani hamesha! 🍛",
        "emoji": "🍛",
        "imageUrl": "/quiz/options/q40_opt0.svg"
      },
      {
        "id": 1,
        "text": "Cheesy Loaded Pizza! 🍕",
        "emoji": "🍕",
        "imageUrl": "/quiz/options/q40_opt1.svg"
      }
    ]
  },
  {
    "id": "q41",
    "category": "food",
    "question": "Meri cooking skills ka kya level hai?",
    "emoji": "🍳",
    "options": [
      {
        "id": 0,
        "text": "Masterchef level khana banana 👨‍🍳",
        "imageUrl": "/quiz/options/q41_opt0.svg"
      },
      {
        "id": 1,
        "text": "Maggi aur Anda banana bas 🍜",
        "imageUrl": "/quiz/options/q41_opt1.svg"
      },
      {
        "id": 2,
        "text": "Chai aur toast tak limited ☕",
        "imageUrl": "/quiz/options/q41_opt2.svg"
      },
      {
        "id": 3,
        "text": "Kitchen mein aag lag sakti hai 🔥",
        "imageUrl": "/quiz/options/q41_opt3.svg"
      }
    ]
  },
  {
    "id": "q42",
    "category": "food",
    "question": "Meetha (Sweets) vs Namkeen / Teekha (Spicy)?",
    "emoji": "🌶️",
    "options": [
      {
        "id": 0,
        "text": "Teekha aur Chatpata Spicy 🌶️",
        "emoji": "🌶️",
        "imageUrl": "/quiz/options/q42_opt0.svg"
      },
      {
        "id": 1,
        "text": "Meethi Desserts & Chocolates 🍰",
        "emoji": "🍰",
        "imageUrl": "/quiz/options/q42_opt1.svg"
      }
    ]
  },
  {
    "id": "q43",
    "category": "food",
    "question": "Pineapple on Pizza par meri kya raye hai?",
    "emoji": "🍍",
    "options": [
      {
        "id": 0,
        "text": "Zulm hai pizza par! Bilkul nahi ❌",
        "emoji": "❌",
        "imageUrl": "/quiz/options/q43_opt0.svg"
      },
      {
        "id": 1,
        "text": "Delicious combo hai! Pasandeeda 🍍",
        "emoji": "🍍",
        "imageUrl": "/quiz/options/q43_opt1.svg"
      }
    ]
  },
  {
    "id": "q44",
    "category": "food",
    "question": "Midnight 2 baje bhook lagne par mera go-to snack?",
    "emoji": "🌙",
    "options": [
      {
        "id": 0,
        "text": "Instant 2-Minute Noodles 🍜",
        "imageUrl": "/quiz/options/q44_opt0.svg"
      },
      {
        "id": 1,
        "text": "Lays chips ya biscuits 🍪",
        "imageUrl": "/quiz/options/q44_opt1.svg"
      },
      {
        "id": 2,
        "text": "Fridge mein bacha hua salan 🍲",
        "imageUrl": "/quiz/options/q44_opt2.svg"
      },
      {
        "id": 3,
        "text": "Late night food delivery order 🛵",
        "imageUrl": "/quiz/options/q44_opt3.svg"
      }
    ]
  },
  {
    "id": "q45",
    "category": "food",
    "question": "Mera favourite fast food burger konsa hai?",
    "emoji": "🍔",
    "options": [
      {
        "id": 0,
        "text": "Crispy Zinger Burger 🍗",
        "emoji": "🍗",
        "imageUrl": "/quiz/options/q45_opt0.svg"
      },
      {
        "id": 1,
        "text": "Juicy Beef Burger 🥩",
        "emoji": "🥩",
        "imageUrl": "/quiz/options/q45_opt1.svg"
      },
      {
        "id": 2,
        "text": "Desi Bun Kabab 🥙",
        "emoji": "🥙",
        "imageUrl": "/quiz/options/q45_opt2.svg"
      },
      {
        "id": 3,
        "text": "Grilled Chicken Burger 🥪",
        "emoji": "🥪",
        "imageUrl": "/quiz/options/q45_opt3.svg"
      },
      {
        "id": 4,
        "text": "Cheesy Loaded Fries 🍟",
        "emoji": "🍟",
        "imageUrl": "/quiz/options/q45_opt4.svg"
      },
      {
        "id": 5,
        "text": "Crispy Fried Chicken Wings 🍗",
        "emoji": "🍗",
        "imageUrl": "/quiz/options/q45_opt5.svg"
      }
    ]
  },
  {
    "id": "q46",
    "category": "food",
    "question": "Chai ke sath mera favourite snack kya hai?",
    "emoji": "☕",
    "options": [
      {
        "id": 0,
        "text": "Crispy Samosa ya Pakoray 🥟",
        "imageUrl": "/quiz/options/q46_opt0.svg"
      },
      {
        "id": 1,
        "text": "Bakery Cake Rusk ya Biscuit 🍪",
        "imageUrl": "/quiz/options/q46_opt1.svg"
      },
      {
        "id": 2,
        "text": "Namak Paray ya Nimko 🥨",
        "imageUrl": "/quiz/options/q46_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sirf sada chai kafi hai ☕",
        "imageUrl": "/quiz/options/q46_opt3.svg"
      }
    ]
  },
  {
    "id": "q47",
    "category": "food",
    "question": "Street food mein sab se pehle kya choose karunga?",
    "emoji": "🥣",
    "options": [
      {
        "id": 0,
        "text": "Crispy Gol Gappay 🥣",
        "imageUrl": "/quiz/options/q47_opt0.svg"
      },
      {
        "id": 1,
        "text": "Dahi Bhallay ya Chaat 🥗",
        "imageUrl": "/quiz/options/q47_opt1.svg"
      },
      {
        "id": 2,
        "text": "Shawarma Roll 🌯",
        "imageUrl": "/quiz/options/q47_opt2.svg"
      },
      {
        "id": 3,
        "text": "French Fries with Mayo 🍟",
        "imageUrl": "/quiz/options/q47_opt3.svg"
      }
    ]
  },
  {
    "id": "q48",
    "category": "food",
    "question": "Spicy khana khate waqt meri halat kya hoti hai?",
    "emoji": "🥵",
    "options": [
      {
        "id": 0,
        "text": "Kitna bhi mirch ho, aaram se khata hoon 💪",
        "imageUrl": "/quiz/options/q48_opt0.svg"
      },
      {
        "id": 1,
        "text": "Aankhon se ansoo aur naak behna 😭",
        "imageUrl": "/quiz/options/q48_opt1.svg"
      },
      {
        "id": 2,
        "text": "Pani ki botal gatak jana 🚰",
        "imageUrl": "/quiz/options/q48_opt2.svg"
      },
      {
        "id": 3,
        "text": "Spicy khane se door rehta hoon 🥛",
        "imageUrl": "/quiz/options/q48_opt3.svg"
      }
    ]
  },
  {
    "id": "q49",
    "category": "food",
    "question": "Mera ideal Sunday breakfast kya hota hai?",
    "emoji": "🥞",
    "options": [
      {
        "id": 0,
        "text": "Halwa Puri ya Nihari 🥞",
        "imageUrl": "/quiz/options/q49_opt0.svg"
      },
      {
        "id": 1,
        "text": "Anda Paratha with Karak Chai 🍳",
        "imageUrl": "/quiz/options/q49_opt1.svg"
      },
      {
        "id": 2,
        "text": "Cereal ya Bread Butter 🥣",
        "imageUrl": "/quiz/options/q49_opt2.svg"
      },
      {
        "id": 3,
        "text": "Subah ka nashta skip karna ⏩",
        "imageUrl": "/quiz/options/q49_opt3.svg"
      }
    ]
  },
  {
    "id": "q50",
    "category": "food",
    "question": "Restaurant mein menu order karne ka mera tareeqa?",
    "emoji": "📜",
    "options": [
      {
        "id": 0,
        "text": "Hamesha purani safe pasand order karna 🎯",
        "imageUrl": "/quiz/options/q50_opt0.svg"
      },
      {
        "id": 1,
        "text": "Har dafa naya dish experiment karna 🧪",
        "imageUrl": "/quiz/options/q50_opt1.svg"
      },
      {
        "id": 2,
        "text": "Jo sath wale order karein wahi 👥",
        "imageUrl": "/quiz/options/q50_opt2.svg"
      },
      {
        "id": 3,
        "text": "Waiter se recommendation maangna 🤵",
        "imageUrl": "/quiz/options/q50_opt3.svg"
      }
    ]
  },
  {
    "id": "q51",
    "category": "food",
    "question": "Dieting ya healthy eating par mera kya stance hai?",
    "emoji": "🥗",
    "options": [
      {
        "id": 0,
        "text": "Strict gym diet aur protein 🥑",
        "imageUrl": "/quiz/options/q51_opt0.svg"
      },
      {
        "id": 1,
        "text": "Monday ko start, Tuesday ko khatam 🍔",
        "imageUrl": "/quiz/options/q51_opt1.svg"
      },
      {
        "id": 2,
        "text": "Dieting mere bas ki baat nahi 🤤",
        "imageUrl": "/quiz/options/q51_opt2.svg"
      },
      {
        "id": 3,
        "text": "Balance eating (har cheez thodi thodi) ⚖️",
        "imageUrl": "/quiz/options/q51_opt3.svg"
      }
    ]
  },
  {
    "id": "q52",
    "category": "travel",
    "question": "Pahar (Mountains) vs Samandar (Beach)?",
    "emoji": "🏔️",
    "options": [
      {
        "id": 0,
        "text": "Barfani Pahar aur Thandi Hawa 🏔️",
        "emoji": "🏔️",
        "imageUrl": "/quiz/options/q52_opt0.svg"
      },
      {
        "id": 1,
        "text": "Samandar ka Kinara aur Sunset 🏖️",
        "emoji": "🏖️",
        "imageUrl": "/quiz/options/q52_opt1.svg"
      }
    ]
  },
  {
    "id": "q53",
    "category": "travel",
    "question": "Trip ke liye packing karne ka mera tareeqa kya hai?",
    "emoji": "🧳",
    "options": [
      {
        "id": 0,
        "text": "1 hafte pehle checklist bana kar 📝",
        "imageUrl": "/quiz/options/q53_opt0.svg"
      },
      {
        "id": 1,
        "text": "Travel se 1 ghanta pehle jald bazi mein ⚡",
        "imageUrl": "/quiz/options/q53_opt1.svg"
      },
      {
        "id": 2,
        "text": "Poora ghar bag mein daal lena 🎒",
        "imageUrl": "/quiz/options/q53_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sirf 2 joray aur charger le jana 🧳",
        "imageUrl": "/quiz/options/q53_opt3.svg"
      }
    ]
  },
  {
    "id": "q54",
    "category": "travel",
    "question": "Lambi Road Trip par mera main role kya hota hai?",
    "emoji": "🚗",
    "options": [
      {
        "id": 0,
        "text": "Driver aur Navigator 🗺️",
        "imageUrl": "/quiz/options/q54_opt0.svg"
      },
      {
        "id": 1,
        "text": "DJ (Music controller) 🎶",
        "imageUrl": "/quiz/options/q54_opt1.svg"
      },
      {
        "id": 2,
        "text": "Snack khane wala aur baatein karne wala 🍟",
        "imageUrl": "/quiz/options/q54_opt2.svg"
      },
      {
        "id": 3,
        "text": "Puri drive sote hue guzarna 😴",
        "imageUrl": "/quiz/options/q54_opt3.svg"
      }
    ]
  },
  {
    "id": "q55",
    "category": "travel",
    "question": "Hawai jahaz mein konsi seat pasand hai?",
    "emoji": "✈️",
    "options": [
      {
        "id": 0,
        "text": "Window seat (View dekhne ke liye) 🪟",
        "imageUrl": "/quiz/options/q55_opt0.svg"
      },
      {
        "id": 1,
        "text": "Aisle seat (Aana jana aasan) 🚶",
        "imageUrl": "/quiz/options/q55_opt1.svg"
      },
      {
        "id": 2,
        "text": "Koi bhi chalegi 🤷",
        "imageUrl": "/quiz/options/q55_opt2.svg"
      },
      {
        "id": 3,
        "text": "Flight se thoda dar lagta hai 🛫",
        "imageUrl": "/quiz/options/q55_opt3.svg"
      }
    ]
  },
  {
    "id": "q56",
    "category": "travel",
    "question": "Chuttiyon par rehne ke liye meri choice kya hogi?",
    "emoji": "🏨",
    "options": [
      {
        "id": 0,
        "text": "Luxury 5-Star Hotel 🏨",
        "imageUrl": "/quiz/options/q56_opt0.svg"
      },
      {
        "id": 1,
        "text": "Paharon mein Cozy Wooden Cottage 🪵",
        "imageUrl": "/quiz/options/q56_opt1.svg"
      },
      {
        "id": 2,
        "text": "Adventure Camping Tent under Stars ⛺",
        "imageUrl": "/quiz/options/q56_opt2.svg"
      },
      {
        "id": 3,
        "text": "Budget friendly hostel 🎒",
        "imageUrl": "/quiz/options/q56_opt3.svg"
      }
    ]
  },
  {
    "id": "q57",
    "category": "travel",
    "question": "Naye sheher mein ghoomte waqt mera plan kya hota hai?",
    "emoji": "🗺️",
    "options": [
      {
        "id": 0,
        "text": "Subah se shaam sab tourist spots dekhna 📸",
        "imageUrl": "/quiz/options/q57_opt0.svg"
      },
      {
        "id": 1,
        "text": "Local food aur cafes explore karna ☕",
        "imageUrl": "/quiz/options/q57_opt1.svg"
      },
      {
        "id": 2,
        "text": "Bina kisi plan ke awara gardi karna 🚶",
        "imageUrl": "/quiz/options/q57_opt2.svg"
      },
      {
        "id": 3,
        "text": "Hotel mein aaram karna aur relax 🛋️",
        "imageUrl": "/quiz/options/q57_opt3.svg"
      }
    ]
  },
  {
    "id": "q58",
    "category": "travel",
    "question": "Agar travel par rasta bhatak jayein to mera reaction?",
    "emoji": "🧭",
    "options": [
      {
        "id": 0,
        "text": "Google Maps nikal kar rasta dhoondna 📱",
        "imageUrl": "/quiz/options/q58_opt0.svg"
      },
      {
        "id": 1,
        "text": "Kisi local se address poochna 🗣️",
        "imageUrl": "/quiz/options/q58_opt1.svg"
      },
      {
        "id": 2,
        "text": "Ghabra kar panic karna 😱",
        "imageUrl": "/quiz/options/q58_opt2.svg"
      },
      {
        "id": 3,
        "text": "Nayi jagah dekhne ka maza lena 🧭",
        "imageUrl": "/quiz/options/q58_opt3.svg"
      }
    ]
  },
  {
    "id": "q59",
    "category": "travel",
    "question": "Mera ideal travel partner kaisa hona chahiye?",
    "emoji": "🎒",
    "options": [
      {
        "id": 0,
        "text": "Chill aur bina nakhre wala dost 🤝",
        "imageUrl": "/quiz/options/q59_opt0.svg"
      },
      {
        "id": 1,
        "text": "Har cheez plan karne wala planner 📋",
        "imageUrl": "/quiz/options/q59_opt1.svg"
      },
      {
        "id": 2,
        "text": "Photographer dost jo achi photos le 📸",
        "imageUrl": "/quiz/options/q59_opt2.svg"
      },
      {
        "id": 3,
        "text": "Solo travel (Akela safar) 🧘",
        "imageUrl": "/quiz/options/q59_opt3.svg"
      }
    ]
  },
  {
    "id": "q60",
    "category": "travel",
    "question": "Travel ke dauran shopping par kitna kharcha karta hoon?",
    "emoji": "💸",
    "options": [
      {
        "id": 0,
        "text": "Souvenirs aur gifts se bag bhar dena 🎁",
        "imageUrl": "/quiz/options/q60_opt0.svg"
      },
      {
        "id": 1,
        "text": "Sirf local khane pe kharch karna 🍜",
        "imageUrl": "/quiz/options/q60_opt1.svg"
      },
      {
        "id": 2,
        "text": "Budget control mein rakhna 📉",
        "imageUrl": "/quiz/options/q60_opt2.svg"
      },
      {
        "id": 3,
        "text": "Har dukan par bargaining karna 🗣️",
        "imageUrl": "/quiz/options/q60_opt3.svg"
      }
    ]
  },
  {
    "id": "q61",
    "category": "travel",
    "question": "Adventure sports mein meri dilchaspi kitni hai?",
    "emoji": "🪂",
    "options": [
      {
        "id": 0,
        "text": "Bungee jumping & Skydiving ready! 🪂",
        "imageUrl": "/quiz/options/q61_opt0.svg"
      },
      {
        "id": 1,
        "text": "Water sports aur boating 🚤",
        "imageUrl": "/quiz/options/q61_opt1.svg"
      },
      {
        "id": 2,
        "text": "Zameen par reh kar video banana 📱",
        "imageUrl": "/quiz/options/q61_opt2.svg"
      },
      {
        "id": 3,
        "text": "Door se dekh kar hi tauba karna 🙈",
        "imageUrl": "/quiz/options/q61_opt3.svg"
      }
    ]
  },
  {
    "id": "q62",
    "category": "travel",
    "question": "Historical monuments vs Modern theme parks?",
    "emoji": "🏰",
    "options": [
      {
        "id": 0,
        "text": "Purani tareekhi imaratein aur museums 🏛️",
        "emoji": "🏛️",
        "imageUrl": "/quiz/options/q62_opt0.svg"
      },
      {
        "id": 1,
        "text": "Rollercoasters aur modern theme parks 🎢",
        "emoji": "🎢",
        "imageUrl": "/quiz/options/q62_opt1.svg"
      }
    ]
  },
  {
    "id": "q63",
    "category": "travel",
    "question": "Train journey par meri raye kya hai?",
    "emoji": "🚂",
    "options": [
      {
        "id": 0,
        "text": "Khirki se scenery dekhna bohot pasand hai 🚂",
        "imageUrl": "/quiz/options/q63_opt0.svg"
      },
      {
        "id": 1,
        "text": "Lambi aur thaka dene wali lagti hai 🥱",
        "imageUrl": "/quiz/options/q63_opt1.svg"
      },
      {
        "id": 2,
        "text": "Chai aur doston ke sath maza aata hai ☕",
        "imageUrl": "/quiz/options/q63_opt2.svg"
      },
      {
        "id": 3,
        "text": "Bus ya gaari zyada behtar hai 🚌",
        "imageUrl": "/quiz/options/q63_opt3.svg"
      }
    ]
  },
  {
    "id": "q64",
    "category": "childhood",
    "question": "Bachpan mein school classroom mein meri position?",
    "emoji": "🏫",
    "options": [
      {
        "id": 0,
        "text": "Front bencher (Teacher ka favourite) 🤓",
        "imageUrl": "/quiz/options/q64_opt0.svg"
      },
      {
        "id": 1,
        "text": "Backbencher (Masti aur hansi mazak) 😎",
        "imageUrl": "/quiz/options/q64_opt1.svg"
      },
      {
        "id": 2,
        "text": "Middle bencher (Khamosh student) 🎒",
        "imageUrl": "/quiz/options/q64_opt2.svg"
      },
      {
        "id": 3,
        "text": "Medical room mein aaram 🩺",
        "imageUrl": "/quiz/options/q64_opt3.svg"
      }
    ]
  },
  {
    "id": "q65",
    "category": "childhood",
    "question": "Bachpan ka mera dream profession kya tha?",
    "emoji": "🚀",
    "options": [
      {
        "id": 0,
        "text": "Pilot ya Astronaut 👨‍🚀",
        "imageUrl": "/quiz/options/q65_opt0.svg"
      },
      {
        "id": 1,
        "text": "Doctor ya Engineer 🩺",
        "imageUrl": "/quiz/options/q65_opt1.svg"
      },
      {
        "id": 2,
        "text": "Cricketer ya Sports Star 🏏",
        "imageUrl": "/quiz/options/q65_opt2.svg"
      },
      {
        "id": 3,
        "text": "Actor ya Rockstar 🎸",
        "imageUrl": "/quiz/options/q65_opt3.svg"
      }
    ]
  },
  {
    "id": "q66",
    "category": "childhood",
    "question": "Bachpan mein doston ke sath konsa game zyada khela?",
    "emoji": "🪁",
    "options": [
      {
        "id": 0,
        "text": "Chupan Chupai (Hide & Seek) 🙈",
        "imageUrl": "/quiz/options/q66_opt0.svg"
      },
      {
        "id": 1,
        "text": "Galli Cricket 🏏",
        "imageUrl": "/quiz/options/q66_opt1.svg"
      },
      {
        "id": 2,
        "text": "Video Games / Mario 🎮",
        "imageUrl": "/quiz/options/q66_opt2.svg"
      },
      {
        "id": 3,
        "text": "Baraf Pani / Pakram Pakrai 🏃",
        "imageUrl": "/quiz/options/q66_opt3.svg"
      }
    ]
  },
  {
    "id": "q67",
    "category": "childhood",
    "question": "School result card aane par mera haal kaisa hota tha?",
    "emoji": "📄",
    "options": [
      {
        "id": 0,
        "text": "Proudly ghar walon ko dikhana 🏅",
        "imageUrl": "/quiz/options/q67_opt0.svg"
      },
      {
        "id": 1,
        "text": "Sign khud karne ki koshish karna ✍️",
        "imageUrl": "/quiz/options/q67_opt1.svg"
      },
      {
        "id": 2,
        "text": "Pehle ammi ko dikhana taake bach sakoon 🛡️",
        "imageUrl": "/quiz/options/q67_opt2.svg"
      },
      {
        "id": 3,
        "text": "Dil ki dharkan tez ho jana 💓",
        "imageUrl": "/quiz/options/q67_opt3.svg"
      }
    ]
  },
  {
    "id": "q68",
    "category": "childhood",
    "question": "Bachpan mein sab se zyada kis baat par daant parti thi?",
    "emoji": "🗣️",
    "options": [
      {
        "id": 0,
        "text": "Der tak bahar khelne par ⚽",
        "imageUrl": "/quiz/options/q68_opt0.svg"
      },
      {
        "id": 1,
        "text": "Parrhai na karne aur TV dekhne par 📺",
        "imageUrl": "/quiz/options/q68_opt1.svg"
      },
      {
        "id": 2,
        "text": "Bhai behno se larrai karne par 🥊",
        "imageUrl": "/quiz/options/q68_opt2.svg"
      },
      {
        "id": 3,
        "text": "Cheezein tornay ya khonay par 💥",
        "imageUrl": "/quiz/options/q68_opt3.svg"
      }
    ]
  },
  {
    "id": "q69",
    "category": "childhood",
    "question": "Bachpan ka mera favourite cartoon konsa tha?",
    "emoji": "📺",
    "options": [
      {
        "id": 0,
        "text": "Tom and Jerry 🐱🐭",
        "imageUrl": "/quiz/options/q69_opt0.svg"
      },
      {
        "id": 1,
        "text": "Ben 10 / Dragon Ball ⚡",
        "imageUrl": "/quiz/options/q69_opt1.svg"
      },
      {
        "id": 2,
        "text": "Doraemon / Shinchan 🚪",
        "imageUrl": "/quiz/options/q69_opt2.svg"
      },
      {
        "id": 3,
        "text": "Scooby Doo / Courage 🐕",
        "imageUrl": "/quiz/options/q69_opt3.svg"
      }
    ]
  },
  {
    "id": "q70",
    "category": "childhood",
    "question": "Bachpan mein pocket money ka kya karta tha?",
    "emoji": "🪙",
    "options": [
      {
        "id": 0,
        "text": "Gullak mein save karta tha 🐖",
        "imageUrl": "/quiz/options/q70_opt0.svg"
      },
      {
        "id": 1,
        "text": "Canteen se chips aur toffees 🍬",
        "imageUrl": "/quiz/options/q70_opt1.svg"
      },
      {
        "id": 2,
        "text": "Toys aur stickers khareedna 🧸",
        "imageUrl": "/quiz/options/q70_opt2.svg"
      },
      {
        "id": 3,
        "text": "Ek hi din mein ura dena 💸",
        "imageUrl": "/quiz/options/q70_opt3.svg"
      }
    ]
  },
  {
    "id": "q71",
    "category": "childhood",
    "question": "Bachpan mein andhere se dar lagta tha?",
    "emoji": "👻",
    "options": [
      {
        "id": 0,
        "text": "Bohot zyada, light on rakh kar sona 💡",
        "imageUrl": "/quiz/options/q71_opt0.svg"
      },
      {
        "id": 1,
        "text": "Darr nahi lagta tha, bahadur tha 🦁",
        "imageUrl": "/quiz/options/q71_opt1.svg"
      },
      {
        "id": 2,
        "text": "Bhoot ki kahani sun kar dar lagta tha 📖",
        "imageUrl": "/quiz/options/q71_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sirf akele hone par 🙈",
        "imageUrl": "/quiz/options/q71_opt3.svg"
      }
    ]
  },
  {
    "id": "q72",
    "category": "childhood",
    "question": "School trip par jane ke liye ghar walon ko kaise manata tha?",
    "emoji": "🚌",
    "options": [
      {
        "id": 0,
        "text": "Pehli baar mein hi ijazat mil jati thi 👍",
        "imageUrl": "/quiz/options/q72_opt0.svg"
      },
      {
        "id": 1,
        "text": "Achay marks lane ka wada kar ke 🤝",
        "imageUrl": "/quiz/options/q72_opt1.svg"
      },
      {
        "id": 2,
        "text": "Ro dho kar manana parta tha 😭",
        "imageUrl": "/quiz/options/q72_opt2.svg"
      },
      {
        "id": 3,
        "text": "Doston ke ghar walon se call karwana 📞",
        "imageUrl": "/quiz/options/q72_opt3.svg"
      }
    ]
  },
  {
    "id": "q73",
    "category": "childhood",
    "question": "Bachpan mein bhai behno ke sath larrai ka style?",
    "emoji": "🤼",
    "options": [
      {
        "id": 0,
        "text": "WWE ke moves try karna 🤼",
        "imageUrl": "/quiz/options/q73_opt0.svg"
      },
      {
        "id": 1,
        "text": "Foran ammi ko shikayat lagana 🏃",
        "imageUrl": "/quiz/options/q73_opt1.svg"
      },
      {
        "id": 2,
        "text": "Room se bahar nikaal dena 🚪",
        "imageUrl": "/quiz/options/q73_opt2.svg"
      },
      {
        "id": 3,
        "text": "5 minute baad wapis dost ban jana 🤝",
        "imageUrl": "/quiz/options/q73_opt3.svg"
      }
    ]
  },
  {
    "id": "q74",
    "category": "funny scenarios",
    "question": "Agar elevator mein phans jayein to mera pehla reaction?",
    "emoji": "🛗",
    "options": [
      {
        "id": 0,
        "text": "Emergency button baar baar dabana 🚨",
        "imageUrl": "/quiz/options/q74_opt0.svg"
      },
      {
        "id": 1,
        "text": "Ghabraye bina phone par meme dekhna 📱",
        "imageUrl": "/quiz/options/q74_opt1.svg"
      },
      {
        "id": 2,
        "text": "Sab ko tasalli dena ke kuch nahi hoga 🦸",
        "imageUrl": "/quiz/options/q74_opt2.svg"
      },
      {
        "id": 3,
        "text": "Oxygen khatam hone ki overthinking 😰",
        "imageUrl": "/quiz/options/q74_opt3.svg"
      }
    ]
  },
  {
    "id": "q75",
    "category": "funny scenarios",
    "question": "Agar raste mein kisi ko pehchan kar ghalti se awaz de doon?",
    "emoji": "🤦",
    "options": [
      {
        "id": 0,
        "text": "Aise act karna jaise hawa ko awaz di thi 💨",
        "imageUrl": "/quiz/options/q75_opt0.svg"
      },
      {
        "id": 1,
        "text": "Sorry bol kar sharminda hona 🙈",
        "imageUrl": "/quiz/options/q75_opt1.svg"
      },
      {
        "id": 2,
        "text": "Foran apna rasta badal lena 🏃",
        "imageUrl": "/quiz/options/q75_opt2.svg"
      },
      {
        "id": 3,
        "text": "Hans kar baat ko mazak bana dena 😂",
        "imageUrl": "/quiz/options/q75_opt3.svg"
      }
    ]
  },
  {
    "id": "q76",
    "category": "funny scenarios",
    "question": "Zombie apocalypse mein mera role kya hoga?",
    "emoji": "🧟",
    "options": [
      {
        "id": 0,
        "text": "Sab se pehle zombie banne wala 🧟",
        "imageUrl": "/quiz/options/q76_opt0.svg"
      },
      {
        "id": 1,
        "text": "Leader ban kar group ko bachane wala 🛡️",
        "imageUrl": "/quiz/options/q76_opt1.svg"
      },
      {
        "id": 2,
        "text": "Kahin safe hideout dhoond kar chupne wala 🏚️",
        "imageUrl": "/quiz/options/q76_opt2.svg"
      },
      {
        "id": 3,
        "text": "Zombies ke sath friendship karne ki koshish 🤝",
        "imageUrl": "/quiz/options/q76_opt3.svg"
      }
    ]
  },
  {
    "id": "q77",
    "category": "funny scenarios",
    "question": "Bhari mehfil mein thokar lag kar girne par kya karunga?",
    "emoji": "🤸",
    "options": [
      {
        "id": 0,
        "text": "Aise uthna jaise yeh mera dance step tha 🕺",
        "imageUrl": "/quiz/options/q77_opt0.svg"
      },
      {
        "id": 1,
        "text": "Zameen ko ghoor kar dekhna 🪨",
        "imageUrl": "/quiz/options/q77_opt1.svg"
      },
      {
        "id": 2,
        "text": "Foran idhar udhar dekhna kis kis ne dekha 👀",
        "imageUrl": "/quiz/options/q77_opt2.svg"
      },
      {
        "id": 3,
        "text": "Khud par sab se uncha hasna 🤣",
        "imageUrl": "/quiz/options/q77_opt3.svg"
      }
    ]
  },
  {
    "id": "q78",
    "category": "funny scenarios",
    "question": "Agar lottery mein 1 arab rupay nikal ayein to?",
    "emoji": "💰",
    "options": [
      {
        "id": 0,
        "text": "Apna private island khareedunga 🏝️",
        "imageUrl": "/quiz/options/q78_opt0.svg"
      },
      {
        "id": 1,
        "text": "Saray doston ko luxury cars tohfe mein 🏎️",
        "imageUrl": "/quiz/options/q78_opt1.svg"
      },
      {
        "id": 2,
        "text": "Kisi ko bataye bina gaayab ho jaunga 🤫",
        "imageUrl": "/quiz/options/q78_opt2.svg"
      },
      {
        "id": 3,
        "text": "Charity aur business shuru karunga 🏢",
        "imageUrl": "/quiz/options/q78_opt3.svg"
      }
    ]
  },
  {
    "id": "q79",
    "category": "funny scenarios",
    "question": "Karaoke mic hath mein aane par meri singing?",
    "emoji": "🎤",
    "options": [
      {
        "id": 0,
        "text": "Full rockstar feeling ke sath besura gana 🎸",
        "imageUrl": "/quiz/options/q79_opt0.svg"
      },
      {
        "id": 1,
        "text": "Sharmate hue mic doosre ko pakra dena 🙈",
        "imageUrl": "/quiz/options/q79_opt1.svg"
      },
      {
        "id": 2,
        "text": "Emotional sad song gana 🥺",
        "imageUrl": "/quiz/options/q79_opt2.svg"
      },
      {
        "id": 3,
        "text": "Sur-taal ke sath perfect gana 🎶",
        "imageUrl": "/quiz/options/q79_opt3.svg"
      }
    ]
  },
  {
    "id": "q80",
    "category": "funny scenarios",
    "question": "Kisi boring function se nikalne ka mera bahana?",
    "emoji": "🏃",
    "options": [
      {
        "id": 0,
        "text": "'Ghar se emergency call aayi hai' 📱",
        "imageUrl": "/quiz/options/q80_opt0.svg"
      },
      {
        "id": 1,
        "text": "'Tabiyat achanak kharab ho gayi hai' 🤒",
        "imageUrl": "/quiz/options/q80_opt1.svg"
      },
      {
        "id": 2,
        "text": "'Subah bohot jaldi meeting hai' ⏰",
        "imageUrl": "/quiz/options/q80_opt2.svg"
      },
      {
        "id": 3,
        "text": "Bina bataye chupke se nikal jana (Ghost) 👻",
        "imageUrl": "/quiz/options/q80_opt3.svg"
      }
    ]
  },
  {
    "id": "q81",
    "category": "funny scenarios",
    "question": "Agar mujhe ek din ke liye invisible bana diya jaye?",
    "emoji": "👻",
    "options": [
      {
        "id": 0,
        "text": "Doston ke secrets aur baatein sununga 👂",
        "imageUrl": "/quiz/options/q81_opt0.svg"
      },
      {
        "id": 1,
        "text": "Mazaahiya prank kar ke logon ko daraunga 🎃",
        "imageUrl": "/quiz/options/q81_opt1.svg"
      },
      {
        "id": 2,
        "text": "Shopping malls mein aish karunga 🛍️",
        "imageUrl": "/quiz/options/q81_opt2.svg"
      },
      {
        "id": 3,
        "text": "Pura din aaram se bhatkunga 🚶",
        "imageUrl": "/quiz/options/q81_opt3.svg"
      }
    ]
  },
  {
    "id": "q82",
    "category": "funny scenarios",
    "question": "Jab koi ajeeb gift mile to mera reaction?",
    "emoji": "🎁",
    "options": [
      {
        "id": 0,
        "text": "Fake excitement: 'Yeh to bohot acha hai!' 🤩",
        "imageUrl": "/quiz/options/q82_opt0.svg"
      },
      {
        "id": 1,
        "text": "Chehre se sachai zahir ho jana 😐",
        "imageUrl": "/quiz/options/q82_opt1.svg"
      },
      {
        "id": 2,
        "text": "Agli dafa kisi aur ko re-gift kar dena 🔄",
        "imageUrl": "/quiz/options/q82_opt2.svg"
      },
      {
        "id": 3,
        "text": "Saaf bol dena ke pasand nahi aya 😅",
        "imageUrl": "/quiz/options/q82_opt3.svg"
      }
    ]
  },
  {
    "id": "q83",
    "category": "funny scenarios",
    "question": "Agar police ghalti se mujhe rok le to mera pehla dialogue?",
    "emoji": "👮",
    "options": [
      {
        "id": 0,
        "text": "'Janab maine kya kiya hai?' 😇",
        "imageUrl": "/quiz/options/q83_opt0.svg"
      },
      {
        "id": 1,
        "text": "'Aap jante hain mera chacha kaun hai?' 😂",
        "imageUrl": "/quiz/options/q83_opt1.svg"
      },
      {
        "id": 2,
        "text": "Ghabra kar saray documents nikal lena 📄",
        "imageUrl": "/quiz/options/q83_opt2.svg"
      },
      {
        "id": 3,
        "text": "Khamosh reh kar maskeen ban jana 🥺",
        "imageUrl": "/quiz/options/q83_opt3.svg"
      }
    ]
  },
  {
    "id": "q84",
    "category": "funny scenarios",
    "question": "Video call par achanak camera on hone par reaction?",
    "emoji": "📹",
    "options": [
      {
        "id": 0,
        "text": "Foran hath rakh kar camera band karna ✋",
        "imageUrl": "/quiz/options/q84_opt0.svg"
      },
      {
        "id": 1,
        "text": "Hair style theek karna 💁",
        "imageUrl": "/quiz/options/q84_opt1.svg"
      },
      {
        "id": 2,
        "text": "Background hide karna 🛋️",
        "imageUrl": "/quiz/options/q84_opt2.svg"
      },
      {
        "id": 3,
        "text": "Confidence se smile karna 😄",
        "imageUrl": "/quiz/options/q84_opt3.svg"
      }
    ]
  },
  {
    "id": "q85",
    "category": "funny scenarios",
    "question": "Horror movie dekhte waqt light chali jaye to?",
    "emoji": "🕯️",
    "options": [
      {
        "id": 0,
        "text": "Cheekh maar kar sath wale ko pakar lena 😱",
        "imageUrl": "/quiz/options/q85_opt0.svg"
      },
      {
        "id": 1,
        "text": "Phone ki torch foran on karna 🔦",
        "imageUrl": "/quiz/options/q85_opt1.svg"
      },
      {
        "id": 2,
        "text": "Mazak mein bhoot ban kar daraana 👻",
        "imageUrl": "/quiz/options/q85_opt2.svg"
      },
      {
        "id": 3,
        "text": "Khamoshi se blanket mein chup jana 🛌",
        "imageUrl": "/quiz/options/q85_opt3.svg"
      }
    ]
  },
  {
    "id": "q86",
    "category": "dreams",
    "question": "Mera dream ghar kahan hona chahiye?",
    "emoji": "🏡",
    "options": [
      {
        "id": 0,
        "text": "Paharon ke beech wooden villa 🏔️",
        "imageUrl": "/quiz/options/q86_opt0.svg"
      },
      {
        "id": 1,
        "text": "Samandar ke samne modern beach house 🏖️",
        "imageUrl": "/quiz/options/q86_opt1.svg"
      },
      {
        "id": 2,
        "text": "Sheher ke markaz mein luxury penthouse 🏙️",
        "imageUrl": "/quiz/options/q86_opt2.svg"
      },
      {
        "id": 3,
        "text": "Khula farm house garden ke sath 🌳",
        "imageUrl": "/quiz/options/q86_opt3.svg"
      }
    ]
  },
  {
    "id": "q87",
    "category": "dreams",
    "question": "Agar mujhe koi bhi car bilkul muft mile to konsi?",
    "emoji": "🏎️",
    "options": [
      {
        "id": 0,
        "text": "Super fast sports car (Ferrari / Porsche) 🏎️",
        "imageUrl": "/quiz/options/q87_opt0.svg"
      },
      {
        "id": 1,
        "text": "Heavy off-road 4x4 (Defender / Land Cruiser) 🚙",
        "imageUrl": "/quiz/options/q87_opt1.svg"
      },
      {
        "id": 2,
        "text": "Luxury smooth drive (Mercedes / Rolls Royce) 🚘",
        "imageUrl": "/quiz/options/q87_opt2.svg"
      },
      {
        "id": 3,
        "text": "Eco-friendly Tesla electric car ⚡",
        "imageUrl": "/quiz/options/q87_opt3.svg"
      }
    ]
  },
  {
    "id": "q88",
    "category": "dreams",
    "question": "Agar paise ki koi fikar na ho to mera dream kaam kya hoga?",
    "emoji": "🎨",
    "options": [
      {
        "id": 0,
        "text": "World Travel Vlogger ✈️",
        "emoji": "✈️",
        "imageUrl": "/quiz/options/q88_opt0.svg"
      },
      {
        "id": 1,
        "text": "Cozy Cafe Owner ☕",
        "emoji": "☕",
        "imageUrl": "/quiz/options/q88_opt1.svg"
      },
      {
        "id": 2,
        "text": "Animal Shelter / Rescue NGO 🐾",
        "emoji": "🐾",
        "imageUrl": "/quiz/options/q88_opt2.svg"
      },
      {
        "id": 3,
        "text": "Music / Gaming Studio Creator 🎮",
        "emoji": "🎮",
        "imageUrl": "/quiz/options/q88_opt3.svg"
      },
      {
        "id": 4,
        "text": "Wildlife Photographer 📸",
        "emoji": "📸",
        "imageUrl": "/quiz/options/q88_opt4.svg"
      },
      {
        "id": 5,
        "text": "Famous Fiction Book Author 📖",
        "emoji": "📖",
        "imageUrl": "/quiz/options/q88_opt5.svg"
      },
      {
        "id": 6,
        "text": "Pilot & Flight Explorer 👨‍✈️",
        "emoji": "👨‍✈️",
        "imageUrl": "/quiz/options/q88_opt6.svg"
      },
      {
        "id": 7,
        "text": "Luxury Resort Island Owner 🏝️",
        "emoji": "🏝️",
        "imageUrl": "/quiz/options/q88_opt7.svg"
      },
      {
        "id": 8,
        "text": "Space Astronaut 🚀",
        "emoji": "🚀",
        "imageUrl": "/quiz/options/q88_opt8.svg"
      }
    ]
  },
  {
    "id": "q89",
    "category": "dreams",
    "question": "Meri life ka sab se bara personal goal kya hai?",
    "emoji": "🎯",
    "options": [
      {
        "id": 0,
        "text": "Financial freedom aur be-hisaab daulat 💰",
        "imageUrl": "/quiz/options/q89_opt0.svg"
      },
      {
        "id": 1,
        "text": "Maa baap ko dunya ki har khushi dena ❤️",
        "imageUrl": "/quiz/options/q89_opt1.svg"
      },
      {
        "id": 2,
        "text": "Apne field mein mashhoor aur kamyab hona 🌟",
        "imageUrl": "/quiz/options/q89_opt2.svg"
      },
      {
        "id": 3,
        "text": "Dunya bhar mein sukoon aur peace of mind 🧘",
        "imageUrl": "/quiz/options/q89_opt3.svg"
      }
    ]
  },
  {
    "id": "q90",
    "category": "dreams",
    "question": "Agar mujhe Mars par rehne ka mauqa mile to?",
    "emoji": "🪐",
    "options": [
      {
        "id": 0,
        "text": "Pehle rocket mein baith kar nikal jaunga 🚀",
        "imageUrl": "/quiz/options/q90_opt0.svg"
      },
      {
        "id": 1,
        "text": "Zameen hi meri jaan hai, hargiz nahi 🌍",
        "imageUrl": "/quiz/options/q90_opt1.svg"
      },
      {
        "id": 2,
        "text": "Sirf chutti manane jaunga phir wapis 🪐",
        "imageUrl": "/quiz/options/q90_opt2.svg"
      },
      {
        "id": 3,
        "text": "Agar dost sath hon to zaroor 🤝",
        "imageUrl": "/quiz/options/q90_opt3.svg"
      }
    ]
  },
  {
    "id": "q91",
    "category": "dreams",
    "question": "Agar mere upar documentary bane to uska title kya hoga?",
    "emoji": "🎬",
    "options": [
      {
        "id": 0,
        "text": "'The Legend of Overthinking' 🧠",
        "imageUrl": "/quiz/options/q91_opt0.svg"
      },
      {
        "id": 1,
        "text": "'Haste Haste Kat Jayein Raste' 😂",
        "imageUrl": "/quiz/options/q91_opt1.svg"
      },
      {
        "id": 2,
        "text": "'A Masterpiece in Progress' ✨",
        "imageUrl": "/quiz/options/q91_opt2.svg"
      },
      {
        "id": 3,
        "text": "'Bhook, Neend aur Sukoon' 🍕",
        "imageUrl": "/quiz/options/q91_opt3.svg"
      }
    ]
  },
  {
    "id": "q92",
    "category": "dreams",
    "question": "Retirement ke baad mera kya plan hoga?",
    "emoji": "👴",
    "options": [
      {
        "id": 0,
        "text": "Paharon mein baaghbaani aur chai ☕",
        "imageUrl": "/quiz/options/q92_opt0.svg"
      },
      {
        "id": 1,
        "text": "Dunya bhar ke mulkon ka safar 🗺️",
        "imageUrl": "/quiz/options/q92_opt1.svg"
      },
      {
        "id": 2,
        "text": "Grandchildren ko jawani ki kahaniyan sunana 📖",
        "imageUrl": "/quiz/options/q92_opt2.svg"
      },
      {
        "id": 3,
        "text": "30 saal ki umar mein hi retire ho jana 🏖️",
        "imageUrl": "/quiz/options/q92_opt3.svg"
      }
    ]
  },
  {
    "id": "q93",
    "category": "dreams",
    "question": "Agar mujhe aik historic shakhsiyat se milne ka mauqa mile?",
    "emoji": "🏛️",
    "options": [
      {
        "id": 0,
        "text": "Quaid-e-Azam / National Leader 🇵🇰",
        "imageUrl": "/quiz/options/q93_opt0.svg"
      },
      {
        "id": 1,
        "text": "Albert Einstein / Big Scientist 🔬",
        "imageUrl": "/quiz/options/q93_opt1.svg"
      },
      {
        "id": 2,
        "text": "Rumi / Great Philosopher 📜",
        "imageUrl": "/quiz/options/q93_opt2.svg"
      },
      {
        "id": 3,
        "text": "Classic King ya Queen 👑",
        "imageUrl": "/quiz/options/q93_opt3.svg"
      }
    ]
  },
  {
    "id": "q94",
    "category": "dreams",
    "question": "Agar mujhe aik wish mangne ka haq mile jin se?",
    "emoji": "🧞",
    "options": [
      {
        "id": 0,
        "text": "Unlimited wishes mangna 💡",
        "imageUrl": "/quiz/options/q94_opt0.svg"
      },
      {
        "id": 1,
        "text": "Hamesha sehat aur khushiyan ❤️",
        "imageUrl": "/quiz/options/q94_opt1.svg"
      },
      {
        "id": 2,
        "text": "Har language bolne ki ability 🗣️",
        "imageUrl": "/quiz/options/q94_opt2.svg"
      },
      {
        "id": 3,
        "text": "Time machine ⏳",
        "imageUrl": "/quiz/options/q94_opt3.svg"
      }
    ]
  },
  {
    "id": "q95",
    "category": "dreams",
    "question": "Mera dream wardrobe kaisa hona chahiye?",
    "emoji": "👔",
    "options": [
      {
        "id": 0,
        "text": "Designer suits aur formal elegance 🤵",
        "imageUrl": "/quiz/options/q95_opt0.svg"
      },
      {
        "id": 1,
        "text": "Streetwear, hoodies aur sneakers 👟",
        "imageUrl": "/quiz/options/q95_opt1.svg"
      },
      {
        "id": 2,
        "text": "Traditional fancy eastern outfits 🥻",
        "imageUrl": "/quiz/options/q95_opt2.svg"
      },
      {
        "id": 3,
        "text": "Comfortable casual T-shirts only 👕",
        "imageUrl": "/quiz/options/q95_opt3.svg"
      }
    ]
  },
  {
    "id": "q96",
    "category": "hobbies",
    "question": "Farigh waqt mein mera sab se favourite creative hobby?",
    "emoji": "🎨",
    "options": [
      {
        "id": 0,
        "text": "Photography aur editing 📸",
        "imageUrl": "/quiz/options/q96_opt0.svg"
      },
      {
        "id": 1,
        "text": "Sketching, drawing ya craft 🎨",
        "imageUrl": "/quiz/options/q96_opt1.svg"
      },
      {
        "id": 2,
        "text": "Music sunna ya instrument bajana 🎸",
        "imageUrl": "/quiz/options/q96_opt2.svg"
      },
      {
        "id": 3,
        "text": "Writing ya journaling ✍️",
        "imageUrl": "/quiz/options/q96_opt3.svg"
      }
    ]
  },
  {
    "id": "q97",
    "category": "hobbies",
    "question": "Fitness aur sports mein mera kya interest hai?",
    "emoji": "🏃",
    "options": [
      {
        "id": 0,
        "text": "Regular gym aur workout 💪",
        "imageUrl": "/quiz/options/q97_opt0.svg"
      },
      {
        "id": 1,
        "text": "Cricket ya football match ⚽",
        "imageUrl": "/quiz/options/q97_opt1.svg"
      },
      {
        "id": 2,
        "text": "Evening walk ya cycling 🚴",
        "imageUrl": "/quiz/options/q97_opt2.svg"
      },
      {
        "id": 3,
        "text": "Bistar par let kar phone chalana 📱",
        "imageUrl": "/quiz/options/q97_opt3.svg"
      }
    ]
  },
  {
    "id": "q98",
    "category": "hobbies",
    "question": "Kitabein parhne ke baare mein meri kya raye hai?",
    "emoji": "📚",
    "options": [
      {
        "id": 0,
        "text": "Book lover (Novel & Stories) 📖",
        "imageUrl": "/quiz/options/q98_opt0.svg"
      },
      {
        "id": 1,
        "text": "Audiobooks aur podcasts sunna 🎧",
        "imageUrl": "/quiz/options/q98_opt1.svg"
      },
      {
        "id": 2,
        "text": "Sirf zarurat ke waqt syllabus dekhna 📑",
        "imageUrl": "/quiz/options/q98_opt2.svg"
      },
      {
        "id": 3,
        "text": "Kitab kholte hi neend aa jana 😴",
        "imageUrl": "/quiz/options/q98_opt3.svg"
      }
    ]
  },
  {
    "id": "q99",
    "category": "hobbies",
    "question": "New skills seekhne ka mera shouq kaisa hai?",
    "emoji": "💡",
    "options": [
      {
        "id": 0,
        "text": "Online courses aur tech skills 💻",
        "imageUrl": "/quiz/options/q99_opt0.svg"
      },
      {
        "id": 1,
        "text": "New language seekhna 🗣️",
        "imageUrl": "/quiz/options/q99_opt1.svg"
      },
      {
        "id": 2,
        "text": "DIY ghar ke kaam aur cooking 🍳",
        "imageUrl": "/quiz/options/q99_opt2.svg"
      },
      {
        "id": 3,
        "text": "Seekhna chahta hoon lekin waqt nahi ⏳",
        "imageUrl": "/quiz/options/q99_opt3.svg"
      }
    ]
  },
  {
    "id": "q100",
    "category": "preferences",
    "question": "Social gatherings vs Home alone on a holiday?",
    "emoji": "🏡",
    "options": [
      {
        "id": 0,
        "text": "Ghar par akele chill karna (Peace) 🧘",
        "emoji": "🧘",
        "imageUrl": "/quiz/options/q100_opt0.svg"
      },
      {
        "id": 1,
        "text": "Doston ke sath hangout aur party 🥳",
        "emoji": "🥳",
        "imageUrl": "/quiz/options/q100_opt1.svg"
      }
    ]
  },
  {
    "id": "q101",
    "category": "preferences",
    "question": "Pets aur animals ke sath mera kaisa connection hai?",
    "emoji": "🐾",
    "options": [
      {
        "id": 0,
        "text": "Billi (Cats) ka deewana 🐱",
        "imageUrl": "/quiz/options/q101_opt0.svg"
      },
      {
        "id": 1,
        "text": "Kutta (Dogs) ka loyal friend 🐶",
        "imageUrl": "/quiz/options/q101_opt1.svg"
      },
      {
        "id": 2,
        "text": "Parinday ya fishes 🦜",
        "imageUrl": "/quiz/options/q101_opt2.svg"
      },
      {
        "id": 3,
        "text": "Door se dekhna pasand hai, paas nahi 🙈",
        "imageUrl": "/quiz/options/q101_opt3.svg"
      }
    ]
  },
  {
    "id": "q102",
    "category": "preferences",
    "question": "Tech gadgets aur electronics ka kitna shouq hai?",
    "emoji": "💻",
    "options": [
      {
        "id": 0,
        "text": "Har naya phone aur gadget chahiye 📱",
        "imageUrl": "/quiz/options/q102_opt0.svg"
      },
      {
        "id": 1,
        "text": "Sirf kaam ki hadd tak theek hai ⚙️",
        "imageUrl": "/quiz/options/q102_opt1.svg"
      },
      {
        "id": 2,
        "text": "Gaming PC aur setups ka shouq 🖥️",
        "imageUrl": "/quiz/options/q102_opt2.svg"
      },
      {
        "id": 3,
        "text": "Purana mobile jab tak chalay chalne do 🔋",
        "imageUrl": "/quiz/options/q102_opt3.svg"
      }
    ]
  },
  {
    "id": "q103",
    "category": "preferences",
    "question": "Music sunne ka mera andaz kaisa hota hai?",
    "emoji": "🎧",
    "options": [
      {
        "id": 0,
        "text": "Headphones laga kar dunya se cut-off 🎧",
        "imageUrl": "/quiz/options/q103_opt0.svg"
      },
      {
        "id": 1,
        "text": "Gari ya kamray mein full volume speakers 🔊",
        "imageUrl": "/quiz/options/q103_opt1.svg"
      },
      {
        "id": 2,
        "text": "Sirf drive ya safar ke waqt 🚗",
        "imageUrl": "/quiz/options/q103_opt2.svg"
      },
      {
        "id": 3,
        "text": "Gungunana aur sath sath gaana 🎤",
        "imageUrl": "/quiz/options/q103_opt3.svg"
      }
    ]
  },
  {
    "id": "q104",
    "category": "preferences",
    "question": "Gardening aur plants ka kitna shouq hai?",
    "emoji": "🌱",
    "options": [
      {
        "id": 0,
        "text": "Ghar ko jungle bana rakha hai (Plant lover) 🌿",
        "imageUrl": "/quiz/options/q104_opt0.svg"
      },
      {
        "id": 1,
        "text": "Do teen gamlay hain jinhe paani deta hoon 🪴",
        "imageUrl": "/quiz/options/q104_opt1.svg"
      },
      {
        "id": 2,
        "text": "Plants murjha jate hain mere hath se 🥀",
        "imageUrl": "/quiz/options/q104_opt2.svg"
      },
      {
        "id": 3,
        "text": "Bilkul shouq nahi 🤷",
        "imageUrl": "/quiz/options/q104_opt3.svg"
      }
    ]
  },
  {
    "id": "q105",
    "category": "habits",
    "question": "Online shopping carts ka mera kya haal hota hai?",
    "emoji": "🛍️",
    "options": [
      {
        "id": 0,
        "text": "Cart mein 50 cheezein daal kar chhor dena 🛒",
        "imageUrl": "/quiz/options/q105_opt0.svg"
      },
      {
        "id": 1,
        "text": "Jo cart mein dala foran buy now karna 💳",
        "imageUrl": "/quiz/options/q105_opt1.svg"
      },
      {
        "id": 2,
        "text": "Reviews parh kar 3 din tak sochna 🧐",
        "imageUrl": "/quiz/options/q105_opt2.svg"
      },
      {
        "id": 3,
        "text": "Cart bana kar delete kar dena 🗑️",
        "imageUrl": "/quiz/options/q105_opt3.svg"
      }
    ]
  }
];

export function getQuestionsByCategory(category: QuizQuestionCategory): QuizQuestion[] {
  return DEFAULT_QUIZ_QUESTIONS.filter((q) => q.category === category);
}

// -------------------------------------------------------------
// Phase 10.2 / 10.3 Curated 30-Question Bank
// -------------------------------------------------------------

export const CURATED_UNIVERSAL_QUESTIONS: QuizQuestion[] = [
  {
    id: "curated_u01",
    category: "food",
    question: "If we're ordering late-night comfort food, what are we getting?",
    emoji: "🍕",
    options: [
      { id: 0, text: "Fresh Cheesy Pizza 🍕", imageUrl: "/prototype/photos/pizza.webp" },
      { id: 1, text: "Juicy Burger & Crispy Fries 🍔", imageUrl: "/prototype/photos/burger.webp" },
    ],
  },
  {
    id: "curated_u02",
    category: "hobbies",
    question: "What's our dream way to spend an unexpected free Saturday?",
    emoji: "✨",
    options: [
      { id: 0, text: "Scenic Mountain Road Trip 🚗", imageUrl: "/prototype/photos/roadtrip.webp" },
      { id: 1, text: "Chilling by the Beach Sunset 🏖️", imageUrl: "/prototype/photos/beach.webp" },
      { id: 2, text: "All-Day Gaming Marathon 🎮", imageUrl: "/prototype/photos/gaming.webp" },
      { id: 3, text: "Live Music Concert & Crowd 🎶", imageUrl: "/prototype/photos/concert.webp" },
    ],
  },
  {
    id: "curated_u03",
    category: "habits",
    question: "How many alarms does it honestly take to get me out of bed?",
    emoji: "⏰",
    options: [
      { id: 0, text: "Exactly one — up immediately ⏰", imageUrl: "/curated/photos/alarm_single_clock_wakeup.webp" },
      { id: 1, text: "2 to 3 alarms spaced 5 mins apart 📱", imageUrl: "/curated/photos/alarm_multiple_phone_alarms.webp" },
      { id: 2, text: "Chronic snooze button survivor 😴", imageUrl: "/curated/photos/alarm_snooze_button_hand.webp" },
      { id: 3, text: "No alarms needed, natural clock 😎", imageUrl: "/curated/photos/alarm_natural_sunlight_wakeup.webp" },
    ],
  },
  {
    id: "curated_u04",
    category: "habits",
    question: "When I'm excited or telling you a wild story, how do I text?",
    emoji: "💬",
    options: [
      { id: 0, text: "Rapid-fire 10 short messages in a row 💬⚡", imageUrl: "/curated/photos/texting_rapid_short_bubbles.webp" },
      { id: 1, text: "One giant, well-crafted paragraph essay 📝✨", imageUrl: "/curated/photos/texting_long_paragraph_essay.webp" },
    ],
  },
  {
    id: "curated_u05",
    category: "habits",
    question: "When a major deadline or exam is tomorrow, what's my energy?",
    emoji: "📚",
    options: [
      { id: 0, text: "Prepared days in advance, calm & organized 📚", imageUrl: "/curated/photos/deadline_organized_study_desk.webp" },
      { id: 1, text: "High-stakes grind the night before 🌙", imageUrl: "/curated/photos/deadline_midnight_oil_coffee.webp" },
      { id: 2, text: "Panic cramming 15 mins before 😭⚡", imageUrl: "/curated/photos/deadline_panic_cramming_hallway.webp" },
      { id: 3, text: "Inshallah & pure vibes only 💀✨", imageUrl: "/curated/photos/deadline_chill_vibes_relaxed.webp" },
    ],
  },
  {
    id: "curated_u06",
    category: "food",
    question: "What is my official stance on the pizza crust?",
    emoji: "🍕",
    options: [
      { id: 0, text: "Eat every single bite — crust is the best part! 😋", imageUrl: "/curated/photos/crust_eaten_golden.webp" },
      { id: 1, text: "Leave it on the plate like a pizza handle 🙅", imageUrl: "/curated/photos/crust_left_behind.webp" },
    ],
  },
  {
    id: "curated_u07",
    category: "food",
    question: "How much spice can I actually handle before tearing up?",
    emoji: "🌶️",
    options: [
      { id: 0, text: "Mild only — glass of milk on standby 🥛", imageUrl: "/curated/photos/spice_mild_milk.webp" },
      { id: 1, text: "Bring on the extra chili and hot sauce! 🔥🌶️", imageUrl: "/curated/photos/spice_extra_chili.webp" },
    ],
  },
  {
    id: "curated_u08",
    category: "habits",
    question: "What is my absolute favorite mode on a lazy, rainy Sunday?",
    emoji: "🌧️",
    options: [
      { id: 0, text: "Sleeping in under a cozy duvet 🛌", imageUrl: "/prototype/photos/sleeping.webp" },
      { id: 1, text: "Fresh warm cappuccino & quiet morning ☕", imageUrl: "/prototype/photos/coffee.webp" },
    ],
  },
  {
    id: "curated_u09",
    category: "childhood",
    question: "What was my absolute favorite playground game growing up?",
    emoji: "🛝",
    options: [
      { id: 0, text: "Hide-and-seek champion 🙈", imageUrl: "/curated/photos/playground_hide_and_seek.webp" },
      { id: 1, text: "Tag & running full speed 🏃", imageUrl: "/curated/photos/playground_tag_sprinting.webp" },
      { id: 2, text: "UNO & card game rivalries 🃏", imageUrl: "/curated/photos/playground_cards_rivalry.webp" },
      { id: 3, text: "Street soccer / kickball ⚽", imageUrl: "/curated/photos/playground_street_soccer.webp" },
    ],
  },
  {
    id: "curated_u10",
    category: "childhood",
    question: "Where did I usually gravitate in any classroom or lecture hall?",
    emoji: "🏫",
    options: [
      { id: 0, text: "Front row — locked in and observant 🥇", imageUrl: "/curated/photos/classroom_front_row_focused.webp" },
      { id: 1, text: "Back row corner — relaxed and chatting 😎", imageUrl: "/curated/photos/classroom_back_row_relaxed.webp" },
    ],
  },
];

export const CURATED_HIM_QUESTIONS: QuizQuestion[] = [
  {
    id: "curated_h01",
    category: "preferences",
    question: "Where does my discretionary money disappear to the fastest?",
    emoji: "💸",
    options: [
      { id: 0, text: "Good food & late-night munchies 🍔", imageUrl: "/curated/photos/spending_munchies.webp" },
      { id: 1, text: "Fresh sneakers & clothes 👟", imageUrl: "/curated/photos/spending_sneakers.webp" },
      { id: 2, text: "Gaming passes & gear 🎮", imageUrl: "/curated/photos/spending_gaming_gear.webp" },
      { id: 3, text: "Tech gadgets & accessories 🎧", imageUrl: "/curated/photos/spending_tech_headphones.webp" },
      { id: 4, text: "Fuel & road trips with the crew 🚗", imageUrl: "/curated/photos/spending_road_trip.webp" },
      { id: 5, text: "Secretly disciplined saver 💰", imageUrl: "/curated/photos/spending_saver.webp" },
    ],
  },
  {
    id: "curated_h02",
    category: "habits",
    question: "How do I actually carry my backpack or gym bag?",
    emoji: "🎒",
    options: [
      { id: 0, text: "Both straps on, ergonomic and secure 🎒", imageUrl: "/curated/photos/backpack_two_straps.webp" },
      { id: 1, text: "Slung over one shoulder, easygoing 😎", imageUrl: "/curated/photos/backpack_one_strap.webp" },
    ],
  },
  {
    id: "curated_h03",
    category: "favorites",
    question: "Which animated show can I still rewatch without ever getting bored?",
    emoji: "📺",
    options: [
      { id: 0, text: "Shonen Anime battles ⚔️", imageUrl: "/curated/photos/show_anime_battle_action.webp" },
      { id: 1, text: "SpongeBob SquarePants classics 🧽", imageUrl: "/curated/photos/show_underwater_sponge_burger.webp" },
      { id: 2, text: "Avatar: The Last Airbender 🌪️", imageUrl: "/curated/photos/show_elemental_air_fire.webp" },
      { id: 3, text: "Gravity Falls & Cartoon Network gold 🌲", imageUrl: "/curated/photos/show_mystery_cabin_journal.webp" },
    ],
  },
  {
    id: "curated_h04",
    category: "habits",
    question: "When a hot meal arrives, what is my eating speed?",
    emoji: "🍽️",
    options: [
      { id: 0, text: "Inhaled in 3 minutes flat ⚡🍽️", imageUrl: "/curated/photos/eating_speed_fast_empty_plate.webp" },
      { id: 1, text: "Taking my sweet time, conversation pace 🐢🥗", imageUrl: "/curated/photos/eating_speed_slow_relaxed_dinner.webp" },
    ],
  },
  {
    id: "curated_h05",
    category: "funny scenarios",
    question: "Which of these would give me genuine chills?",
    emoji: "😨",
    options: [
      { id: 0, text: "Medical injections & needles 💉", imageUrl: "/curated/photos/fear_medical_needle_syringe.webp" },
      { id: 1, text: "Massive vertical drop roller coasters 🎢", imageUrl: "/curated/photos/fear_roller_coaster_drop.webp" },
    ],
  },
  {
    id: "curated_h06",
    category: "food",
    question: "What is my policy on ketchup and hot sauce with fries?",
    emoji: "🥫",
    options: [
      { id: 0, text: "Minimalist dip — let the food speak 🍟", imageUrl: "/curated/photos/sauce_fries_minimalist_dip.webp" },
      { id: 1, text: "Completely drowning the plate in sauce 🥫🍅", imageUrl: "/curated/photos/sauce_fries_drowned_ketchup.webp" },
    ],
  },
  {
    id: "curated_h07",
    category: "habits",
    question: "What position am I usually found sleeping in?",
    emoji: "💤",
    options: [
      { id: 0, text: "Curled on my side 😴", imageUrl: "/curated/photos/sleep_side.webp" },
      { id: 1, text: "Flat on my stomach 🛏️", imageUrl: "/curated/photos/sleep_stomach.webp" },
      { id: 2, text: "Hands folded on my back like a statue 😌", imageUrl: "/curated/photos/sleep_back.webp" },
    ],
  },
  {
    id: "curated_h08",
    category: "hobbies",
    question: "When I turn on a video game, what mode am I in?",
    emoji: "🎮",
    options: [
      { id: 0, text: "Ranked competitive sweat — here to win 🏆", imageUrl: "/curated/photos/gaming_competitive_esports_sweat.webp" },
      { id: 1, text: "Casual open-world chill — just exploring 🌿", imageUrl: "/curated/photos/gaming_open_world_scenic_explore.webp" },
    ],
  },
  {
    id: "curated_h09",
    category: "childhood",
    question: "Which game brings out my most competitive streak?",
    emoji: "🎲",
    options: [
      { id: 0, text: "Monopoly property empire 🎩", imageUrl: "/curated/photos/game_monopoly.webp" },
      { id: 1, text: "UNO friendship-destroying +4s 🃏", imageUrl: "/curated/photos/game_uno.webp" },
      { id: 2, text: "Jenga high-stakes tower 🪵", imageUrl: "/curated/photos/game_jenga.webp" },
      { id: 3, text: "Connect Four tactical grid 🔴", imageUrl: "/curated/photos/game_connect_four.webp" },
    ],
  },
  {
    id: "curated_h10",
    category: "food",
    question: "If we make a sudden late-night food run, what do I pick first?",
    emoji: "🍔",
    options: [
      { id: 0, text: "Loaded Smash Burger 🍔", imageUrl: "/curated/photos/burger_smash_loaded.webp" },
      { id: 1, text: "Crispy Stone-Baked Pizza 🍕", imageUrl: "/curated/photos/pizza_stone_baked_slice.webp" },
    ],
  },
];

export const CURATED_HER_QUESTIONS: QuizQuestion[] = [
  {
    id: "curated_g01",
    category: "preferences",
    question: "What is the 100% foolproof way to instantly boost my mood?",
    emoji: "✨",
    options: [
      { id: 0, text: "Delicious sweet treat or comfort dessert 🍰", imageUrl: "/curated/photos/mood_sweet_berry_cheesecake.webp" },
      { id: 1, text: "Genuine, heartfelt compliments & hugs 💕", imageUrl: "/curated/photos/mood_warm_hug_besties.webp" },
      { id: 2, text: "Spontaneous retail therapy & shopping 🛍️", imageUrl: "/curated/photos/mood_shopping_luxury_bags.webp" },
      { id: 3, text: "Uninterrupted 10-hour beauty sleep 😴", imageUrl: "/curated/photos/mood_beauty_sleep_silk_pillow.webp" },
      { id: 4, text: "Juicy gossip & deep talk with besties ☕", imageUrl: "/curated/photos/mood_besties_tea_talk.webp" },
      { id: 5, text: "Relaxing quiet cafe date ☕✨", imageUrl: "/curated/photos/mood_quiet_cafe_corner_book.webp" },
    ],
  },
  {
    id: "curated_g02",
    category: "funny scenarios",
    question: "How long do I actually get lost scrolling on my phone in the bathroom?",
    emoji: "📱",
    options: [
      { id: 0, text: "2 minutes flat — quick check ⏱️", imageUrl: "/curated/photos/scrolling_quick_smartwatch_check.webp" },
      { id: 1, text: "Until my legs are genuinely numb from TikTok 📱🦵", imageUrl: "/curated/photos/scrolling_infinite_phone_glow.webp" },
    ],
  },
  {
    id: "curated_g03",
    category: "preferences",
    question: "Which aesthetic color palette dominates my favorite outfits?",
    emoji: "🎨",
    options: [
      { id: 0, text: "Minimalist Monochrome (Black & White) 🖤", imageUrl: "/curated/photos/palette_monochrome.webp" },
      { id: 1, text: "Soft Dreamy Pastels (Lavender & Pink) 🎀", imageUrl: "/curated/photos/palette_pastels.webp" },
      { id: 2, text: "Warm Earth Tones (Sage & Neutral Beige) 🌿", imageUrl: "/curated/photos/palette_earth_tones.webp" },
      { id: 3, text: "Bold Statement (Cherry Red & Burgundy) 🍒", imageUrl: "/curated/photos/palette_bold_red.webp" },
    ],
  },
  {
    id: "curated_g04",
    category: "habits",
    question: "What is my most relatable everyday guilty habit?",
    emoji: "😬",
    options: [
      { id: 0, text: "Overthinking random conversations at 2 AM 🧠🌙", imageUrl: "/curated/photos/habit_late_night_overthinking.webp" },
      { id: 1, text: "Forgetting my passwords every single month 🔐😅", imageUrl: "/curated/photos/habit_forgot_password_prompt.webp" },
      { id: 2, text: "Filling online shopping carts and never buying 🛍️", imageUrl: "/curated/photos/habit_online_cart_unbought.webp" },
      { id: 3, text: "Watching TikToks when I should be fast asleep 📱💤", imageUrl: "/curated/photos/habit_scrolling_in_bed_dark.webp" },
    ],
  },
  {
    id: "curated_g05",
    category: "preferences",
    question: "What behavior gives me the quickest instant ick?",
    emoji: "🙅‍♀️",
    options: [
      { id: 0, text: "Two-faced people & fake energy 🎭", imageUrl: "/curated/photos/ick_two_faced_theater_masks.webp" },
      { id: 1, text: "Broken promises & last-minute cancellations 😕", imageUrl: "/curated/photos/ick_cancelled_calendar_alert.webp" },
      { id: 2, text: "Chronic slow texters who stay online 📱🙄", imageUrl: "/curated/photos/ick_seen_unread_active_status.webp" },
      { id: 3, text: "People who chew loudly 🤐", imageUrl: "/curated/photos/ick_loud_chewing_popcorn.webp" },
    ],
  },
  {
    id: "curated_g06",
    category: "habits",
    question: "What sounds do I make when I'm sound asleep?",
    emoji: "😴",
    options: [
      { id: 0, text: "Completely silent angel 😇", imageUrl: "/curated/photos/sleep_silent_peaceful_angel.webp" },
      { id: 1, text: "Soft gentle breathing 💤", imageUrl: "/curated/photos/sleep_gentle_soft_breathing.webp" },
      { id: 2, text: "Full-on sleep talker or giggler 💬😂", imageUrl: "/curated/photos/sleep_talker_smiling_dream.webp" },
      { id: 3, text: "Subtle locomotive snorer 🚂", imageUrl: "/curated/photos/sleep_funny_earplugs_snoring.webp" },
    ],
  },
  {
    id: "curated_g07",
    category: "preferences",
    question: "What is my absolute favorite everyday hair vibe?",
    emoji: "💇‍♀️",
    options: [
      { id: 0, text: "Soft, effortless beach waves 🎀", imageUrl: "/curated/photos/hair_beach_waves.webp" },
      { id: 1, text: "Sleek, glossy and pin-straight ✨", imageUrl: "/curated/photos/hair_straight.webp" },
      { id: 2, text: "The effortless claw-clip messy bun 🦋", imageUrl: "/curated/photos/hair_claw_clip.webp" },
      { id: 3, text: "Fresh braids or high ponytail 🩰", imageUrl: "/curated/photos/hair_ponytail.webp" },
    ],
  },
  {
    id: "curated_g08",
    category: "food",
    question: "When we sit down at an aesthetic cafe, what's my go-to order?",
    emoji: "☕",
    options: [
      { id: 0, text: "Warm Artisan Cappuccino with Latte Art ☕", imageUrl: "/curated/photos/cafe_artisan_latte.webp" },
      { id: 1, text: "Sweet Blended Iced Caramel Beverage 🥤", imageUrl: "/curated/photos/drink_iced_caramel.webp" },
    ],
  },
  {
    id: "curated_g09",
    category: "favorites",
    question: "Where did my first romance or crush story begin?",
    emoji: "💘",
    options: [
      { id: 0, text: "Classroom / campus hallway glance 🏫", imageUrl: "/curated/photos/crush_school_hallway_lockers.webp" },
      { id: 1, text: "Introduced through mutual close friends 🫶", imageUrl: "/curated/photos/crush_mutual_friends_gathering.webp" },
      { id: 2, text: "Slid into the DMs / social media 📱", imageUrl: "/curated/photos/crush_social_media_dm_bubble.webp" },
      { id: 3, text: "Still waiting on my main-character moment 😅✨", imageUrl: "/curated/photos/crush_daydreaming_window_view.webp" },
    ],
  },
  {
    id: "curated_g10",
    category: "preferences",
    question: "What denim silhouette do I wear the most?",
    emoji: "👖",
    options: [
      { id: 0, text: "Relaxed, wide-leg baggy fit 👖", imageUrl: "/curated/photos/jeans_wide_leg.webp" },
      { id: 1, text: "Classic timeless straight leg 🩵", imageUrl: "/curated/photos/jeans_straight.webp" },
      { id: 2, text: "Retro 70s flare ✨", imageUrl: "/curated/photos/jeans_flare.webp" },
      { id: 3, text: "Sleek high-waisted slim 🫧", imageUrl: "/curated/photos/jeans_slim.webp" },
    ],
  },
];

export const CURATED_QUIZ_QUESTIONS: QuizQuestion[] = [
  ...CURATED_UNIVERSAL_QUESTIONS,
  ...CURATED_HIM_QUESTIONS,
  ...CURATED_HER_QUESTIONS,
];

export const ALL_AVAILABLE_QUIZ_QUESTIONS: QuizQuestion[] = [
  ...CURATED_QUIZ_QUESTIONS,
  ...DEFAULT_QUIZ_QUESTIONS,
];

export type CuratedTheme = "universal" | "him" | "her" | "all";

export function getCuratedQuestionsByTheme(theme: CuratedTheme): QuizQuestion[] {
  switch (theme) {
    case "universal":
      return CURATED_UNIVERSAL_QUESTIONS;
    case "him":
      return CURATED_HIM_QUESTIONS;
    case "her":
      return CURATED_HER_QUESTIONS;
    case "all":
    default:
      return CURATED_QUIZ_QUESTIONS;
  }
}

export function getQuestionById(id: string): QuizQuestion | undefined {
  return (
    CURATED_QUIZ_QUESTIONS.find((q) => q.id === id) ||
    DEFAULT_QUIZ_QUESTIONS.find((q) => q.id === id)
  );
}

