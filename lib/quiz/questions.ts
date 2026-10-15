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
        "text": "Bathroom Singer 🎤"
      },
      {
        "id": 1,
        "text": "Biryani Expert 🍲"
      },
      {
        "id": 2,
        "text": "14 Ghante Sona 😴"
      },
      {
        "id": 3,
        "text": "Pro Gamer 🎮"
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
        "text": "World Tour par nikal jaunga ✈️"
      },
      {
        "id": 1,
        "text": "Dream Car khareedunga 🏎️"
      },
      {
        "id": 2,
        "text": "Bank mein safe rakhunga 🏦"
      },
      {
        "id": 3,
        "text": "Doston ko shandaar party 🥳"
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
        "text": "Bhook lagne par 🍔"
      },
      {
        "id": 1,
        "text": "Internet slow hone par 📶"
      },
      {
        "id": 2,
        "text": "Jab koi call na uthaye 📵"
      },
      {
        "id": 3,
        "text": "Jhoot bolne par 🤥"
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
        "text": "Reels / TikTok scroll karna 📱"
      },
      {
        "id": 1,
        "text": "Ghor neend sona 🛌"
      },
      {
        "id": 2,
        "text": "Online Gaming 🎯"
      },
      {
        "id": 3,
        "text": "Doston se lambi baatein 🗣️"
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
        "text": "Har waqt phone use karna 📲"
      },
      {
        "id": 1,
        "text": "Dopehar tak sona ⏰"
      },
      {
        "id": 2,
        "text": "Overthinking karna 🧠"
      },
      {
        "id": 3,
        "text": "Har baat par hasna 😂"
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
        "text": "Garma Garam Biryani 🍛"
      },
      {
        "id": 1,
        "text": "Cheesy Pizza / Burger 🍔"
      },
      {
        "id": 2,
        "text": "Chai & Paratha ☕"
      },
      {
        "id": 3,
        "text": "Gol Gappay / Chaat 🥣"
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
        "text": "Chipkali ya Keeray 🦎"
      },
      {
        "id": 1,
        "text": "Exams / Fail hone se 📝"
      },
      {
        "id": 2,
        "text": "Bhoot aur andheray se 👻"
      },
      {
        "id": 3,
        "text": "Phone ki battery 1% hona 🪫"
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
        "text": "Switzerland / Mountains 🏔️"
      },
      {
        "id": 1,
        "text": "Dubai / Shopping 🏙️"
      },
      {
        "id": 2,
        "text": "Turkey / Historic 🇹🇷"
      },
      {
        "id": 3,
        "text": "Ghar ka bistar 🛋️"
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
        "text": "Meri pasand ka khana 🍕"
      },
      {
        "id": 1,
        "text": "Karak Chai ya Coffee ☕"
      },
      {
        "id": 2,
        "text": "Mujhe akela chhor do 🤫"
      },
      {
        "id": 3,
        "text": "Lambi Drive ya Walk 🚗"
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
        "text": "Haan, kabar tak sath le jaunga 🔒"
      },
      {
        "id": 1,
        "text": "Sirf 5 minute tak ⏳"
      },
      {
        "id": 2,
        "text": "Pet mein dard hota hai bataye bina 😅"
      },
      {
        "id": 3,
        "text": "Sirf best friend ko bataunga 🤫"
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
        "text": "Mein sab se pehle bhaag jaunga 🏃"
      },
      {
        "id": 1,
        "text": "Himmat se rasta dhoondenge 🧭"
      },
      {
        "id": 2,
        "text": "Sher humein kha jayega 🦁"
      },
      {
        "id": 3,
        "text": "Ek doosre par cheekhenge 😱"
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
        "text": "Raat ka Ullu (Night Owl) 🦉"
      },
      {
        "id": 1,
        "text": "Subah ka Parinda (Early Bird) 🌅"
      },
      {
        "id": 2,
        "text": "24 Ghante Sona Pasand Hai 🛌"
      },
      {
        "id": 3,
        "text": "Routine ka koi pata nahi 🌀"
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
        "text": "WhatsApp 🟢"
      },
      {
        "id": 1,
        "text": "Instagram 📸"
      },
      {
        "id": 2,
        "text": "YouTube 🔴"
      },
      {
        "id": 3,
        "text": "TikTok 🎵"
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
        "text": "Invisibility (Ghayab hona) 👻"
      },
      {
        "id": 1,
        "text": "Mind Reading (Dimagh parhna) 🧠"
      },
      {
        "id": 2,
        "text": "Time Travel ⏳"
      },
      {
        "id": 3,
        "text": "Udne ki taqat (Flying) 🦅"
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
        "text": "Haste haste video banayenge 😂"
      },
      {
        "id": 1,
        "text": "Thane aakar chhurwayenge 🤝"
      },
      {
        "id": 2,
        "text": "Pehchanne se inkar kar denge 🏃"
      },
      {
        "id": 3,
        "text": "Ghar walon ko shikayat lagayenge 📞"
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
        "text": "Arijit / Sad Melodies 💔"
      },
      {
        "id": 1,
        "text": "Atif Aslam / Romantic Hits 🎸"
      },
      {
        "id": 2,
        "text": "Sidhu / Punjabi Beats 🏎️"
      },
      {
        "id": 3,
        "text": "EDM / English Pop 🎧"
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
        "text": "Sardi (Chilly Winter) ❄️"
      },
      {
        "id": 1,
        "text": "Barish (Rainy Monsoon) 🌧️"
      },
      {
        "id": 2,
        "text": "Khushgawar Spring (Bahar) 🌸"
      },
      {
        "id": 3,
        "text": "Garmi (AC Lover) ☀️"
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
        "text": "Action & Thriller 💥"
      },
      {
        "id": 1,
        "text": "Romantic Comedy ❤️"
      },
      {
        "id": 2,
        "text": "Horror & Mystery 👻"
      },
      {
        "id": 3,
        "text": "Sci-Fi / Marvel Universe 🚀"
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
        "text": "Classic Black / Dark 🖤"
      },
      {
        "id": 1,
        "text": "Calm Blue / Sky 💙"
      },
      {
        "id": 2,
        "text": "Vibrant Yellow / Red 💛"
      },
      {
        "id": 3,
        "text": "Pastel & Minimalist 🤍"
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
        "text": "Chocolate Brownie 🍫"
      },
      {
        "id": 1,
        "text": "Vanilla / Caramel 🍨"
      },
      {
        "id": 2,
        "text": "Mango / Fruity 🥭"
      },
      {
        "id": 3,
        "text": "Pistachio / Kulfa 🍧"
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
        "text": "Bistar mein Netflix & Chill 🍿"
      },
      {
        "id": 1,
        "text": "Doston ke sath chai & gup-shup ☕"
      },
      {
        "id": 2,
        "text": "Outdoor shopping ya sports ⚽"
      },
      {
        "id": 3,
        "text": "Nayi jagah explore karna 🚗"
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
        "text": "Eid / Family gatherings 🌙"
      },
      {
        "id": 1,
        "text": "New Year Eve bash 🎆"
      },
      {
        "id": 2,
        "text": "Apna Birthday party 🎂"
      },
      {
        "id": 3,
        "text": "Shaadi functions 💃"
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
        "text": "Maths / Science 🔬"
      },
      {
        "id": 1,
        "text": "Literature & Arts 🎨"
      },
      {
        "id": 2,
        "text": "History & Stories 🏛️"
      },
      {
        "id": 3,
        "text": "Sports & Break Period 🏃"
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
        "text": "Karak Doodh Patti Chai ☕"
      },
      {
        "id": 1,
        "text": "Iced Cold Coffee 🧋"
      },
      {
        "id": 2,
        "text": "Fresh Juice / Smoothie 🥤"
      },
      {
        "id": 3,
        "text": "Chilled Soda / Cold Drink 🧊"
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
        "text": "Kapray aur Outfits 👗"
      },
      {
        "id": 1,
        "text": "Sneakers aur Jootay 👟"
      },
      {
        "id": 2,
        "text": "Tech gadgets & accessories 📱"
      },
      {
        "id": 3,
        "text": "Khane peene ki cheezein 🍕"
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
        "text": "Ludo Star 🎲"
      },
      {
        "id": 1,
        "text": "PUBG / COD Mobile 🔫"
      },
      {
        "id": 2,
        "text": "Chess / Mind games ♟️"
      },
      {
        "id": 3,
        "text": "Subway Surfers / Casual games 🏃"
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
        "text": "Early morning freshness 🌅"
      },
      {
        "id": 1,
        "text": "Golden sunset evening 🌇"
      },
      {
        "id": 2,
        "text": "Late midnight peace 🌌"
      },
      {
        "id": 3,
        "text": "Dopehar ki neend 😴"
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
        "text": "Soch samajh kar budget mein 💡"
      },
      {
        "id": 1,
        "text": "Impulsive buyer (jo dikhe khareed lo) 💸"
      },
      {
        "id": 2,
        "text": "Window shopping only 👀"
      },
      {
        "id": 3,
        "text": "Sirf sale ya discounts par 🏷️"
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
        "text": "Hamesha waqt se 10 minute pehle 🕒"
      },
      {
        "id": 1,
        "text": "Bilkul exact time par 🎯"
      },
      {
        "id": 2,
        "text": "Hamesha 'bas 5 minute' late 🐢"
      },
      {
        "id": 3,
        "text": "Aakhri minute par plan cancel 🙈"
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
        "text": "Super neat aur organized ✨"
      },
      {
        "id": 1,
        "text": "Organized chaos (mujhe sab pata hai) 📁"
      },
      {
        "id": 2,
        "text": "Har taraf saman bikhra hua 🌀"
      },
      {
        "id": 3,
        "text": "Jab mehman ayen tab hi saaf 🛋️"
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
        "text": "1 second mein (Phone hamesha hath mein) ⚡"
      },
      {
        "id": 1,
        "text": "Kuch ghanton baad ⏳"
      },
      {
        "id": 2,
        "text": "Seen karke bhool jana 👻"
      },
      {
        "id": 3,
        "text": "Sirf voice notes se 🎙️"
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
        "text": "Start hone se pehle popcorn khatam 🍿"
      },
      {
        "id": 1,
        "text": "Darmiyan mein spoiler maangna 🗣️"
      },
      {
        "id": 2,
        "text": "15 minute mein so jana 😴"
      },
      {
        "id": 3,
        "text": "Puri movie concentrate karna 🤫"
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
        "text": "Pehle alarm par foran uthna 🏃"
      },
      {
        "id": 1,
        "text": "5 baar snooze dabana 💤"
      },
      {
        "id": 2,
        "text": "Alarm band karke dobara sona 🛌"
      },
      {
        "id": 3,
        "text": "Alarm sune bina sote rehna 🔕"
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
        "text": "Pocket check (Phone, Wallet, Keys) 🔍"
      },
      {
        "id": 1,
        "text": "Hamesha koi cheez bhool jana 🤦"
      },
      {
        "id": 2,
        "text": "Aaine mein 10 baar dekhna 🪞"
      },
      {
        "id": 3,
        "text": "Late ho kar bhaagte hue nikalna ⚡"
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
        "text": "Foran maan kar maafi mangna 🤝"
      },
      {
        "id": 1,
        "text": "Kisi doosre par ilzam lagana 😂"
      },
      {
        "id": 2,
        "text": "Haste hue baat taal dena 😅"
      },
      {
        "id": 3,
        "text": "Deep overthinking mein chale jana 🧠"
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
        "text": "Din mein 3-4 cup lazmi ☕"
      },
      {
        "id": 1,
        "text": "Sirf nashte ke waqt 🍞"
      },
      {
        "id": 2,
        "text": "Kabhi kabhi jab mood ho 🥤"
      },
      {
        "id": 3,
        "text": "Chai bilkul pasand nahi 🚫"
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
        "text": "Foran dost ban jana (Extrovert) 🤗"
      },
      {
        "id": 1,
        "text": "Thoda sharmila aur reserved (Introvert) 😶"
      },
      {
        "id": 2,
        "text": "Observe karna phir baat karna 🧐"
      },
      {
        "id": 3,
        "text": "Sirf formality wali baatein 👔"
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
        "text": "Daily stories aur posts 🌟"
      },
      {
        "id": 1,
        "text": "Mahine mein ek adhi photo 🖼️"
      },
      {
        "id": 2,
        "text": "Sirf doosron ki posts dekhna (Lurker) 👀"
      },
      {
        "id": 3,
        "text": "Sirf memes share karna 🤣"
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
        "text": "Chup chaap dawa le kar aaram 💊"
      },
      {
        "id": 1,
        "text": "Thoda sa bimaar ho kar dramay karna 🎭"
      },
      {
        "id": 2,
        "text": "Bimari ko ignore karke kaam karna 💼"
      },
      {
        "id": 3,
        "text": "Doctor ke paas jaane se darna 🏥"
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
        "text": "Desi Dum Biryani hamesha! 🍛"
      },
      {
        "id": 1,
        "text": "Cheesy Loaded Pizza! 🍕"
      },
      {
        "id": 2,
        "text": "Dono 50-50 ⚖️"
      },
      {
        "id": 3,
        "text": "Burger aur Fries 🍔"
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
        "text": "Masterchef level khana banana 👨‍🍳"
      },
      {
        "id": 1,
        "text": "Maggi aur Anda banana bas 🍜"
      },
      {
        "id": 2,
        "text": "Chai aur toast tak limited ☕"
      },
      {
        "id": 3,
        "text": "Kitchen mein aag lag sakti hai 🔥"
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
        "text": "Teekha aur Chatpata Spicy 🌶️"
      },
      {
        "id": 1,
        "text": "Meethi Desserts & Chocolates 🍰"
      },
      {
        "id": 2,
        "text": "Pehle Spicy phir Meetha 😋"
      },
      {
        "id": 3,
        "text": "Simple sada khana 🥗"
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
        "text": "Zulm hai pizza par! Bilkul nahi ❌"
      },
      {
        "id": 1,
        "text": "Delicious combo hai! Pasandeeda 🍍"
      },
      {
        "id": 2,
        "text": "Kha leta hoon koi issue nahi 🤷"
      },
      {
        "id": 3,
        "text": "Kabhi try nahi kiya 🤔"
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
        "text": "Instant 2-Minute Noodles 🍜"
      },
      {
        "id": 1,
        "text": "Lays chips ya biscuits 🍪"
      },
      {
        "id": 2,
        "text": "Fridge mein bacha hua salan 🍲"
      },
      {
        "id": 3,
        "text": "Late night food delivery order 🛵"
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
        "text": "Crispy Zinger Burger 🍗"
      },
      {
        "id": 1,
        "text": "Juicy Beef Burger 🥩"
      },
      {
        "id": 2,
        "text": "Desi Bun Kabab 🥙"
      },
      {
        "id": 3,
        "text": "Grilled Chicken Burger 🥪"
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
        "text": "Crispy Samosa ya Pakoray 🥟"
      },
      {
        "id": 1,
        "text": "Bakery Cake Rusk ya Biscuit 🍪"
      },
      {
        "id": 2,
        "text": "Namak Paray ya Nimko 🥨"
      },
      {
        "id": 3,
        "text": "Sirf sada chai kafi hai ☕"
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
        "text": "Crispy Gol Gappay 🥣"
      },
      {
        "id": 1,
        "text": "Dahi Bhallay ya Chaat 🥗"
      },
      {
        "id": 2,
        "text": "Shawarma Roll 🌯"
      },
      {
        "id": 3,
        "text": "French Fries with Mayo 🍟"
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
        "text": "Kitna bhi mirch ho, aaram se khata hoon 💪"
      },
      {
        "id": 1,
        "text": "Aankhon se ansoo aur naak behna 😭"
      },
      {
        "id": 2,
        "text": "Pani ki botal gatak jana 🚰"
      },
      {
        "id": 3,
        "text": "Spicy khane se door rehta hoon 🥛"
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
        "text": "Halwa Puri ya Nihari 🥞"
      },
      {
        "id": 1,
        "text": "Anda Paratha with Karak Chai 🍳"
      },
      {
        "id": 2,
        "text": "Cereal ya Bread Butter 🥣"
      },
      {
        "id": 3,
        "text": "Subah ka nashta skip karna ⏩"
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
        "text": "Hamesha purani safe pasand order karna 🎯"
      },
      {
        "id": 1,
        "text": "Har dafa naya dish experiment karna 🧪"
      },
      {
        "id": 2,
        "text": "Jo sath wale order karein wahi 👥"
      },
      {
        "id": 3,
        "text": "Waiter se recommendation maangna 🤵"
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
        "text": "Strict gym diet aur protein 🥑"
      },
      {
        "id": 1,
        "text": "Monday ko start, Tuesday ko khatam 🍔"
      },
      {
        "id": 2,
        "text": "Dieting mere bas ki baat nahi 🤤"
      },
      {
        "id": 3,
        "text": "Balance eating (har cheez thodi thodi) ⚖️"
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
        "text": "Barfani Pahar aur Thandi Hawa 🏔️"
      },
      {
        "id": 1,
        "text": "Samandar ka Kinara aur Sunset 🏖️"
      },
      {
        "id": 2,
        "text": "Dono jagah bari pasand hain 🌍"
      },
      {
        "id": 3,
        "text": "Ghar ka sakoon best hai 🛋️"
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
        "text": "1 hafte pehle checklist bana kar 📝"
      },
      {
        "id": 1,
        "text": "Travel se 1 ghanta pehle jald bazi mein ⚡"
      },
      {
        "id": 2,
        "text": "Poora ghar bag mein daal lena 🎒"
      },
      {
        "id": 3,
        "text": "Sirf 2 joray aur charger le jana 🧳"
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
        "text": "Driver aur Navigator 🗺️"
      },
      {
        "id": 1,
        "text": "DJ (Music controller) 🎶"
      },
      {
        "id": 2,
        "text": "Snack khane wala aur baatein karne wala 🍟"
      },
      {
        "id": 3,
        "text": "Puri drive sote hue guzarna 😴"
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
        "text": "Window seat (View dekhne ke liye) 🪟"
      },
      {
        "id": 1,
        "text": "Aisle seat (Aana jana aasan) 🚶"
      },
      {
        "id": 2,
        "text": "Koi bhi chalegi 🤷"
      },
      {
        "id": 3,
        "text": "Flight se thoda dar lagta hai 🛫"
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
        "text": "Luxury 5-Star Hotel 🏨"
      },
      {
        "id": 1,
        "text": "Paharon mein Cozy Wooden Cottage 🪵"
      },
      {
        "id": 2,
        "text": "Adventure Camping Tent under Stars ⛺"
      },
      {
        "id": 3,
        "text": "Budget friendly hostel 🎒"
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
        "text": "Subah se shaam sab tourist spots dekhna 📸"
      },
      {
        "id": 1,
        "text": "Local food aur cafes explore karna ☕"
      },
      {
        "id": 2,
        "text": "Bina kisi plan ke awara gardi karna 🚶"
      },
      {
        "id": 3,
        "text": "Hotel mein aaram karna aur relax 🛋️"
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
        "text": "Google Maps nikal kar rasta dhoondna 📱"
      },
      {
        "id": 1,
        "text": "Kisi local se address poochna 🗣️"
      },
      {
        "id": 2,
        "text": "Ghabra kar panic karna 😱"
      },
      {
        "id": 3,
        "text": "Nayi jagah dekhne ka maza lena 🧭"
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
        "text": "Chill aur bina nakhre wala dost 🤝"
      },
      {
        "id": 1,
        "text": "Har cheez plan karne wala planner 📋"
      },
      {
        "id": 2,
        "text": "Photographer dost jo achi photos le 📸"
      },
      {
        "id": 3,
        "text": "Solo travel (Akela safar) 🧘"
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
        "text": "Souvenirs aur gifts se bag bhar dena 🎁"
      },
      {
        "id": 1,
        "text": "Sirf local khane pe kharch karna 🍜"
      },
      {
        "id": 2,
        "text": "Budget control mein rakhna 📉"
      },
      {
        "id": 3,
        "text": "Har dukan par bargaining karna 🗣️"
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
        "text": "Bungee jumping & Skydiving ready! 🪂"
      },
      {
        "id": 1,
        "text": "Water sports aur boating 🚤"
      },
      {
        "id": 2,
        "text": "Zameen par reh kar video banana 📱"
      },
      {
        "id": 3,
        "text": "Door se dekh kar hi tauba karna 🙈"
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
        "text": "Purani tareekhi imaratein aur museums 🏛️"
      },
      {
        "id": 1,
        "text": "Rollercoasters aur theme parks 🎢"
      },
      {
        "id": 2,
        "text": "Khuli qudrat aur jungles 🌲"
      },
      {
        "id": 3,
        "text": "Shopping malls 🛍️"
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
        "text": "Khirki se scenery dekhna bohot pasand hai 🚂"
      },
      {
        "id": 1,
        "text": "Lambi aur thaka dene wali lagti hai 🥱"
      },
      {
        "id": 2,
        "text": "Chai aur doston ke sath maza aata hai ☕"
      },
      {
        "id": 3,
        "text": "Bus ya gaari zyada behtar hai 🚌"
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
        "text": "Front bencher (Teacher ka favourite) 🤓"
      },
      {
        "id": 1,
        "text": "Backbencher (Masti aur hansi mazak) 😎"
      },
      {
        "id": 2,
        "text": "Middle bencher (Khamosh student) 🎒"
      },
      {
        "id": 3,
        "text": "Medical room mein aaram 🩺"
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
        "text": "Pilot ya Astronaut 👨‍🚀"
      },
      {
        "id": 1,
        "text": "Doctor ya Engineer 🩺"
      },
      {
        "id": 2,
        "text": "Cricketer ya Sports Star 🏏"
      },
      {
        "id": 3,
        "text": "Actor ya Rockstar 🎸"
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
        "text": "Chupan Chupai (Hide & Seek) 🙈"
      },
      {
        "id": 1,
        "text": "Galli Cricket 🏏"
      },
      {
        "id": 2,
        "text": "Video Games / Mario 🎮"
      },
      {
        "id": 3,
        "text": "Baraf Pani / Pakram Pakrai 🏃"
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
        "text": "Proudly ghar walon ko dikhana 🏅"
      },
      {
        "id": 1,
        "text": "Sign khud karne ki koshish karna ✍️"
      },
      {
        "id": 2,
        "text": "Pehle ammi ko dikhana taake bach sakoon 🛡️"
      },
      {
        "id": 3,
        "text": "Dil ki dharkan tez ho jana 💓"
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
        "text": "Der tak bahar khelne par ⚽"
      },
      {
        "id": 1,
        "text": "Parrhai na karne aur TV dekhne par 📺"
      },
      {
        "id": 2,
        "text": "Bhai behno se larrai karne par 🥊"
      },
      {
        "id": 3,
        "text": "Cheezein tornay ya khonay par 💥"
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
        "text": "Tom and Jerry 🐱🐭"
      },
      {
        "id": 1,
        "text": "Ben 10 / Dragon Ball ⚡"
      },
      {
        "id": 2,
        "text": "Doraemon / Shinchan 🚪"
      },
      {
        "id": 3,
        "text": "Scooby Doo / Courage 🐕"
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
        "text": "Gullak mein save karta tha 🐖"
      },
      {
        "id": 1,
        "text": "Canteen se chips aur toffees 🍬"
      },
      {
        "id": 2,
        "text": "Toys aur stickers khareedna 🧸"
      },
      {
        "id": 3,
        "text": "Ek hi din mein ura dena 💸"
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
        "text": "Bohot zyada, light on rakh kar sona 💡"
      },
      {
        "id": 1,
        "text": "Darr nahi lagta tha, bahadur tha 🦁"
      },
      {
        "id": 2,
        "text": "Bhoot ki kahani sun kar dar lagta tha 📖"
      },
      {
        "id": 3,
        "text": "Sirf akele hone par 🙈"
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
        "text": "Pehli baar mein hi ijazat mil jati thi 👍"
      },
      {
        "id": 1,
        "text": "Achay marks lane ka wada kar ke 🤝"
      },
      {
        "id": 2,
        "text": "Ro dho kar manana parta tha 😭"
      },
      {
        "id": 3,
        "text": "Doston ke ghar walon se call karwana 📞"
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
        "text": "WWE ke moves try karna 🤼"
      },
      {
        "id": 1,
        "text": "Foran ammi ko shikayat lagana 🏃"
      },
      {
        "id": 2,
        "text": "Room se bahar nikaal dena 🚪"
      },
      {
        "id": 3,
        "text": "5 minute baad wapis dost ban jana 🤝"
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
        "text": "Emergency button baar baar dabana 🚨"
      },
      {
        "id": 1,
        "text": "Ghabraye bina phone par meme dekhna 📱"
      },
      {
        "id": 2,
        "text": "Sab ko tasalli dena ke kuch nahi hoga 🦸"
      },
      {
        "id": 3,
        "text": "Oxygen khatam hone ki overthinking 😰"
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
        "text": "Aise act karna jaise hawa ko awaz di thi 💨"
      },
      {
        "id": 1,
        "text": "Sorry bol kar sharminda hona 🙈"
      },
      {
        "id": 2,
        "text": "Foran apna rasta badal lena 🏃"
      },
      {
        "id": 3,
        "text": "Hans kar baat ko mazak bana dena 😂"
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
        "text": "Sab se pehle zombie banne wala 🧟"
      },
      {
        "id": 1,
        "text": "Leader ban kar group ko bachane wala 🛡️"
      },
      {
        "id": 2,
        "text": "Kahin safe hideout dhoond kar chupne wala 🏚️"
      },
      {
        "id": 3,
        "text": "Zombies ke sath friendship karne ki koshish 🤝"
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
        "text": "Aise uthna jaise yeh mera dance step tha 🕺"
      },
      {
        "id": 1,
        "text": "Zameen ko ghoor kar dekhna 🪨"
      },
      {
        "id": 2,
        "text": "Foran idhar udhar dekhna kis kis ne dekha 👀"
      },
      {
        "id": 3,
        "text": "Khud par sab se uncha hasna 🤣"
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
        "text": "Apna private island khareedunga 🏝️"
      },
      {
        "id": 1,
        "text": "Saray doston ko luxury cars tohfe mein 🏎️"
      },
      {
        "id": 2,
        "text": "Kisi ko bataye bina gaayab ho jaunga 🤫"
      },
      {
        "id": 3,
        "text": "Charity aur business shuru karunga 🏢"
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
        "text": "Full rockstar feeling ke sath besura gana 🎸"
      },
      {
        "id": 1,
        "text": "Sharmate hue mic doosre ko pakra dena 🙈"
      },
      {
        "id": 2,
        "text": "Emotional sad song gana 🥺"
      },
      {
        "id": 3,
        "text": "Sur-taal ke sath perfect gana 🎶"
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
        "text": "'Ghar se emergency call aayi hai' 📱"
      },
      {
        "id": 1,
        "text": "'Tabiyat achanak kharab ho gayi hai' 🤒"
      },
      {
        "id": 2,
        "text": "'Subah bohot jaldi meeting hai' ⏰"
      },
      {
        "id": 3,
        "text": "Bina bataye chupke se nikal jana (Ghost) 👻"
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
        "text": "Doston ke secrets aur baatein sununga 👂"
      },
      {
        "id": 1,
        "text": "Mazaahiya prank kar ke logon ko daraunga 🎃"
      },
      {
        "id": 2,
        "text": "Shopping malls mein aish karunga 🛍️"
      },
      {
        "id": 3,
        "text": "Pura din aaram se bhatkunga 🚶"
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
        "text": "Fake excitement: 'Yeh to bohot acha hai!' 🤩"
      },
      {
        "id": 1,
        "text": "Chehre se sachai zahir ho jana 😐"
      },
      {
        "id": 2,
        "text": "Agli dafa kisi aur ko re-gift kar dena 🔄"
      },
      {
        "id": 3,
        "text": "Saaf bol dena ke pasand nahi aya 😅"
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
        "text": "'Janab maine kya kiya hai?' 😇"
      },
      {
        "id": 1,
        "text": "'Aap jante hain mera chacha kaun hai?' 😂"
      },
      {
        "id": 2,
        "text": "Ghabra kar saray documents nikal lena 📄"
      },
      {
        "id": 3,
        "text": "Khamosh reh kar maskeen ban jana 🥺"
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
        "text": "Foran hath rakh kar camera band karna ✋"
      },
      {
        "id": 1,
        "text": "Hair style theek karna 💁"
      },
      {
        "id": 2,
        "text": "Background hide karna 🛋️"
      },
      {
        "id": 3,
        "text": "Confidence se smile karna 😄"
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
        "text": "Cheekh maar kar sath wale ko pakar lena 😱"
      },
      {
        "id": 1,
        "text": "Phone ki torch foran on karna 🔦"
      },
      {
        "id": 2,
        "text": "Mazak mein bhoot ban kar daraana 👻"
      },
      {
        "id": 3,
        "text": "Khamoshi se blanket mein chup jana 🛌"
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
        "text": "Paharon ke beech wooden villa 🏔️"
      },
      {
        "id": 1,
        "text": "Samandar ke samne modern beach house 🏖️"
      },
      {
        "id": 2,
        "text": "Sheher ke markaz mein luxury penthouse 🏙️"
      },
      {
        "id": 3,
        "text": "Khula farm house garden ke sath 🌳"
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
        "text": "Super fast sports car (Ferrari / Porsche) 🏎️"
      },
      {
        "id": 1,
        "text": "Heavy off-road 4x4 (Defender / Land Cruiser) 🚙"
      },
      {
        "id": 2,
        "text": "Luxury smooth drive (Mercedes / Rolls Royce) 🚘"
      },
      {
        "id": 3,
        "text": "Eco-friendly Tesla electric car ⚡"
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
        "text": "Poori dunya ghoomna aur vlogs banana ✈️"
      },
      {
        "id": 1,
        "text": "Apna cozy cafe ya restaurant kholna ☕"
      },
      {
        "id": 2,
        "text": "Animals shelter aur NGO chalana 🐾"
      },
      {
        "id": 3,
        "text": "Music, art ya gaming studio banana 🎮"
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
        "text": "Financial freedom aur be-hisaab daulat 💰"
      },
      {
        "id": 1,
        "text": "Maa baap ko dunya ki har khushi dena ❤️"
      },
      {
        "id": 2,
        "text": "Apne field mein mashhoor aur kamyab hona 🌟"
      },
      {
        "id": 3,
        "text": "Dunya bhar mein sukoon aur peace of mind 🧘"
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
        "text": "Pehle rocket mein baith kar nikal jaunga 🚀"
      },
      {
        "id": 1,
        "text": "Zameen hi meri jaan hai, hargiz nahi 🌍"
      },
      {
        "id": 2,
        "text": "Sirf chutti manane jaunga phir wapis 🪐"
      },
      {
        "id": 3,
        "text": "Agar dost sath hon to zaroor 🤝"
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
        "text": "'The Legend of Overthinking' 🧠"
      },
      {
        "id": 1,
        "text": "'Haste Haste Kat Jayein Raste' 😂"
      },
      {
        "id": 2,
        "text": "'A Masterpiece in Progress' ✨"
      },
      {
        "id": 3,
        "text": "'Bhook, Neend aur Sukoon' 🍕"
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
        "text": "Paharon mein baaghbaani aur chai ☕"
      },
      {
        "id": 1,
        "text": "Dunya bhar ke mulkon ka safar 🗺️"
      },
      {
        "id": 2,
        "text": "Grandchildren ko jawani ki kahaniyan sunana 📖"
      },
      {
        "id": 3,
        "text": "30 saal ki umar mein hi retire ho jana 🏖️"
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
        "text": "Quaid-e-Azam / National Leader 🇵🇰"
      },
      {
        "id": 1,
        "text": "Albert Einstein / Big Scientist 🔬"
      },
      {
        "id": 2,
        "text": "Rumi / Great Philosopher 📜"
      },
      {
        "id": 3,
        "text": "Classic King ya Queen 👑"
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
        "text": "Unlimited wishes mangna 💡"
      },
      {
        "id": 1,
        "text": "Hamesha sehat aur khushiyan ❤️"
      },
      {
        "id": 2,
        "text": "Har language bolne ki ability 🗣️"
      },
      {
        "id": 3,
        "text": "Time machine ⏳"
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
        "text": "Designer suits aur formal elegance 🤵"
      },
      {
        "id": 1,
        "text": "Streetwear, hoodies aur sneakers 👟"
      },
      {
        "id": 2,
        "text": "Traditional fancy eastern outfits 🥻"
      },
      {
        "id": 3,
        "text": "Comfortable casual T-shirts only 👕"
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
        "text": "Photography aur editing 📸"
      },
      {
        "id": 1,
        "text": "Sketching, drawing ya craft 🎨"
      },
      {
        "id": 2,
        "text": "Music sunna ya instrument bajana 🎸"
      },
      {
        "id": 3,
        "text": "Writing ya journaling ✍️"
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
        "text": "Regular gym aur workout 💪"
      },
      {
        "id": 1,
        "text": "Cricket ya football match ⚽"
      },
      {
        "id": 2,
        "text": "Evening walk ya cycling 🚴"
      },
      {
        "id": 3,
        "text": "Bistar par let kar phone chalana 📱"
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
        "text": "Book lover (Novel & Stories) 📖"
      },
      {
        "id": 1,
        "text": "Audiobooks aur podcasts sunna 🎧"
      },
      {
        "id": 2,
        "text": "Sirf zarurat ke waqt syllabus dekhna 📑"
      },
      {
        "id": 3,
        "text": "Kitab kholte hi neend aa jana 😴"
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
        "text": "Online courses aur tech skills 💻"
      },
      {
        "id": 1,
        "text": "New language seekhna 🗣️"
      },
      {
        "id": 2,
        "text": "DIY ghar ke kaam aur cooking 🍳"
      },
      {
        "id": 3,
        "text": "Seekhna chahta hoon lekin waqt nahi ⏳"
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
        "text": "Ghar par akele chill karna (Peace) 🧘"
      },
      {
        "id": 1,
        "text": "Doston ke sath hangout aur party 🥳"
      },
      {
        "id": 2,
        "text": "Family ke sath dinner 🍲"
      },
      {
        "id": 3,
        "text": "Naye logon se networking 💼"
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
        "text": "Billi (Cats) ka deewana 🐱"
      },
      {
        "id": 1,
        "text": "Kutta (Dogs) ka loyal friend 🐶"
      },
      {
        "id": 2,
        "text": "Parinday ya fishes 🦜"
      },
      {
        "id": 3,
        "text": "Door se dekhna pasand hai, paas nahi 🙈"
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
        "text": "Har naya phone aur gadget chahiye 📱"
      },
      {
        "id": 1,
        "text": "Sirf kaam ki hadd tak theek hai ⚙️"
      },
      {
        "id": 2,
        "text": "Gaming PC aur setups ka shouq 🖥️"
      },
      {
        "id": 3,
        "text": "Purana mobile jab tak chalay chalne do 🔋"
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
        "text": "Headphones laga kar dunya se cut-off 🎧"
      },
      {
        "id": 1,
        "text": "Gari ya kamray mein full volume speakers 🔊"
      },
      {
        "id": 2,
        "text": "Sirf drive ya safar ke waqt 🚗"
      },
      {
        "id": 3,
        "text": "Gungunana aur sath sath gaana 🎤"
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
        "text": "Ghar ko jungle bana rakha hai (Plant lover) 🌿"
      },
      {
        "id": 1,
        "text": "Do teen gamlay hain jinhe paani deta hoon 🪴"
      },
      {
        "id": 2,
        "text": "Plants murjha jate hain mere hath se 🥀"
      },
      {
        "id": 3,
        "text": "Bilkul shouq nahi 🤷"
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
        "text": "Cart mein 50 cheezein daal kar chhor dena 🛒"
      },
      {
        "id": 1,
        "text": "Jo cart mein dala foran buy now karna 💳"
      },
      {
        "id": 2,
        "text": "Reviews parh kar 3 din tak sochna 🧐"
      },
      {
        "id": 3,
        "text": "Cart bana kar delete kar dena 🗑️"
      }
    ]
  }
];

export function getQuestionsByCategory(category: QuizQuestionCategory): QuizQuestion[] {
  return DEFAULT_QUIZ_QUESTIONS.filter((q) => q.category === category);
}

export function getQuestionById(id: string): QuizQuestion | undefined {
  return DEFAULT_QUIZ_QUESTIONS.find((q) => q.id === id);
}
