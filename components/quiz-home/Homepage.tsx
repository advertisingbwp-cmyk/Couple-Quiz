"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark, FriendsArt, StepIcon } from "./Illustrations";
import { saveCreatorSetup } from "./creatorSetup";
import AdsterraFooter from "@/components/ads/AdsterraFooter";
import styles from "./homepage.module.css";

type StartProps = { onStart: () => void };

function StartButton({
  onStart,
  children,
  secondary = false,
}: StartProps & { children: React.ReactNode; secondary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className={`${styles.button} ${secondary ? styles.secondary : ""}`}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </button>
  );
}

function Brand() {
  return (
    <a href="/quiz" className={styles.brand} aria-label="Click and Clique home">
      <BrandMark />
      <span>
        click <span className={styles.amp}>&</span> clique
        <span className={styles.brandDot}>.</span>
      </span>
    </a>
  );
}

export function Navbar({ onStart }: StartProps) {
  return (
    <header className={styles.navbar}>
      <Brand />
      <nav aria-label="Main navigation">
        <a href="#challenges">The quizzes</a>
        <a href="#how-it-works">How it works</a>
        <a href="#faq">FAQs</a>
      </nav>
      <button className={styles.navCta} onClick={onStart}>
        Create quiz <span aria-hidden="true">↗</span>
      </button>
    </header>
  );
}

export function HeroSection({ onStart }: StartProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>
          <span aria-hidden="true">✦</span> A little quiz. A lot of friendship.
        </p>
        <h1 id="hero-title">
          How well do your friends <span>really</span> know you?
        </h1>
        <p className={styles.heroDescription}>
          Your favorite snack. Your biggest dream. Your very questionable
          habits. Let&apos;s see who&apos;s been paying attention.
        </p>
        <StartButton onStart={onStart}>Create My Quiz</StartButton>
        <p className={styles.micro}>
          Free <span>•</span> Fun <span>•</span> Share with Friends
        </p>
      </div>
      <div className={styles.heroArt}>
        <div className={styles.artCaption}>
          the group chat is about to get interesting
        </div>
        <FriendsArt />
        <span className={styles.artSticker}>
          Bestie energy <span aria-hidden="true">✦</span>
        </span>
      </div>
    </section>
  );
}

export function CategoryCard({
  couple = false,
  onStart,
}: StartProps & { couple?: boolean }) {
  return (
    <article
      className={`${styles.category} ${couple ? styles.couple : styles.friendship}`}
    >
      <div className={styles.categoryTop}>
        <span className={styles.categoryTag}>
          {couple ? "FOR YOUR FAVORITE PERSON" : "FOR THE WHOLE GROUP CHAT"}
        </span>
        <span aria-hidden="true">{couple ? "♡" : "✦"}</span>
      </div>
      <div className={styles.categoryArt}>
        <FriendsArt couple={couple} />
      </div>
      <div className={styles.categoryContent}>
        <h3>{couple ? "Couple Love Quiz" : "Best Friends Challenge"}</h3>
        <p>
          {couple
            ? "The little things. The big feelings. A quiz for your kind of love is on its way."
            : "Put your friendship to the test. Ten questions about you. Who will know you best?"}
        </p>
        {couple ? (
          <span className={styles.comingSoon}>
            Coming Soon <span aria-hidden="true">♡</span>
          </span>
        ) : (
          <StartButton onStart={onStart} secondary>
            Start Friendship Quiz
          </StartButton>
        )}
      </div>
    </article>
  );
}

export function HowItWorks() {
  const steps = [
    {
      kind: "write" as const,
      title: "Make it yours",
      text: "Answer 10 fun questions about yourself. Yes, even the tricky ones.",
    },
    {
      kind: "share" as const,
      title: "Drop the link",
      text: "Send your quiz to friends on WhatsApp or your favorite social app.",
    },
    {
      kind: "results" as const,
      title: "Meet your know-it-all",
      text: "Check the scoreboard and discover who really gets you.",
    },
  ];
  return (
    <section
      id="how-it-works"
      className={styles.how}
      aria-labelledby="how-title"
    >
      <p className={styles.eyebrow}>NO RULEBOOK REQUIRED</p>
      <h2 id="how-title">Three steps. Endless banter.</h2>
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <article className={styles.step} key={step.kind}>
            <div className={styles.stepIcon}>
              <StepIcon kind={step.kind} />
              <span>{index + 1}</span>
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CTASection({ onStart }: StartProps) {
  return (
    <section className={styles.engagement} aria-labelledby="cta-title">
      <span className={styles.bannerDoodle} aria-hidden="true">
        ✦
      </span>
      <p className={styles.eyebrow}>GO ON, SURPRISE THEM.</p>
      <h2 id="cta-title">
        Think your friends know
        <br className={styles.desktopBreak} /> everything about you?
      </h2>
      <p>There&apos;s only one way to find out.</p>
      <StartButton onStart={onStart}>Let&apos;s find out</StartButton>
      <span className={styles.bannerHeart} aria-hidden="true">
        ♡
      </span>
    </section>
  );
}

export const FAQ_ITEMS = [
  {
    question: "What is Click & Clique and how does this friendship quiz work?",
    answer:
      "Click & Clique is a free, interactive friendship test and BFF challenge. You answer 10 photographic, fun multiple-choice questions about your habits, preferences, and personality, get a personalized link, and send it to your friends on WhatsApp or social chats to see how well they actually know you.",
  },
  {
    question: "Do my friends need an account or app to play?",
    answer:
      "No sign-up, account, or app installation is required. Anyone with your quiz link can open it instantly in any smartphone or desktop web browser, enter their name or nickname, and answer your 10 questions in under two minutes.",
  },
  {
    question: "How does the scoring and live leaderboard work?",
    answer:
      "Each question your friend answers correctly scores points toward their total score out of 10. When they complete the quiz, their score is automatically recorded on your live challenge scoreboard so you can see who took first place in your friend circle.",
  },
  {
    question: "How do I share my friendship quiz on WhatsApp and Instagram?",
    answer:
      "Once you finish picking your answers, Click & Clique gives you a one-tap WhatsApp share button, a direct copy-link option, and an Instagram story share option. You can share your link in any group chat, status update, or DM.",
  },
  {
    question: "Is my quiz data private, and can I delete my quiz later?",
    answer:
      "Yes. When creating your quiz, you set a private 4 to 6-digit Secret PIN. This PIN allows only you to access the creator controls and permanently delete your quiz and all its player attempts at any time.",
  },
  {
    question: "Is Click & Clique completely free to play?",
    answer:
      "Yes, Click & Clique is 100% free to create and play. There are no fees, subscriptions, paywalls, or limits on how many friends can participate in your challenge.",
  },
  {
    question: "Can I play this friend quiz on mobile phones?",
    answer:
      "Yes. Click & Clique is designed mobile-first and optimized for iOS and Android smartphones, tablets, and desktop computers with high-speed photographic cards.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className={styles.faq} aria-labelledby="faq-title">
      <div className={styles.faqHeading}>
        <p className={styles.eyebrow}>GOT QUESTIONS?</p>
        <h2 id="faq-title">Frequently Asked Questions</h2>
      </div>
      <div className={styles.faqList}>
        {FAQ_ITEMS.map((item, index) => (
          <details key={index} className={styles.faqItem}>
            <summary className={styles.faqQuestion}>
              <span>{item.question}</span>
              <span className={styles.faqIcon} aria-hidden="true">+</span>
            </summary>
            <p className={styles.faqAnswer}>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const HOMEPAGE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://friend-quiz-game.vercel.app/#website",
      "url": "https://friend-quiz-game.vercel.app",
      "name": "Click & Clique",
      "description":
        "Create a free 10-question friendship quiz or BFF test in seconds. Share your friend quiz link on WhatsApp and see who knows you best on the live leaderboard.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://friend-quiz-game.vercel.app/#app",
      "name": "Click & Clique Friendship Quiz",
      "applicationCategory": "GameApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "url": "https://friend-quiz-game.vercel.app",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://friend-quiz-game.vercel.app/#faq",
      "mainEntity": FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer,
        },
      })),
    },
  ],
};

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div>
        <Brand />
        <p>Little quizzes. Closer connections.</p>
      </div>
      <div className={styles.footerNote}>
        <p>
          Keep it light. Use a nickname and share only
          <br /> what you&apos;re happy for friends to know.
        </p>
        <a href="#how-it-works">
          How it works <span aria-hidden="true">↗</span>
        </a>
        {" • "}
        <a href="#faq">
          FAQs <span aria-hidden="true">↗</span>
        </a>
      </div>
      <p className={styles.copyright}>
        © {new Date().getFullYear()} Click & Clique. Made for a little fun.
      </p>
    </footer>
  );
}

export default function Homepage() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const nameField = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [error, setError] = useState("");
  function openCreator() {
    trigger.current = document.activeElement as HTMLElement;
    setError("");
    dialog.current?.showModal();
    nameField.current?.focus();
  }
  function closeCreator() {
    dialog.current?.close();
  }
  function startQuiz(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Add your name or a nickname to get started.");
      nameField.current?.focus();
      return;
    }
    if (trimmed.length > 30) {
      setError("Keep your name or nickname to 30 characters.");
      nameField.current?.focus();
      return;
    }

    try {
      saveCreatorSetup(name, gender, sessionStorage);
    } catch {
      // Storage unavailable or blocked; creator page inline fallback will safely handle setup
    }

    // Privacy-conscious handoff: avoid leaking personal names in URL query strings
    router.push("/quiz/create");
  }
  return (
    <div className={styles.home}>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <div className={styles.shell}>
        <Navbar onStart={openCreator} />
        <main id="main">
          <HeroSection onStart={openCreator} />
          <section
            id="challenges"
            className={styles.challenges}
            aria-labelledby="challenges-title"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>PICK YOUR PEOPLE</p>
                <h2 id="challenges-title">
                  A quiz for your kind of connection.
                </h2>
              </div>
              <span className={styles.handwritten}>
                Good times start here ↙
              </span>
            </div>
            <div className={styles.categories}>
              <CategoryCard onStart={openCreator} />
              <CategoryCard couple onStart={openCreator} />
            </div>
          </section>
          <CTASection onStart={openCreator} />
          <HowItWorks />
          <FAQSection />
        </main>
        <AdsterraFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(HOMEPAGE_JSON_LD) }}
        />
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="creator-title"
        aria-describedby="creator-description"
        onClose={() => trigger.current?.focus()}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>(
            'button, input:not([type="radio"]), input[type="radio"]:checked',
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <button
          onClick={closeCreator}
          className={styles.close}
          aria-label="Close quiz setup"
        >
          ×
        </button>
        <span className={styles.dialogBadge} aria-hidden="true">
          ✦
        </span>
        <h2 id="creator-title">
          First, what do
          <br />
          your friends call you?
        </h2>
        <p id="creator-description">
          A nickname works. This name will appear on your quiz.
        </p>
        <form onSubmit={startQuiz} noValidate>
          <label htmlFor="creator-name">Your name or nickname</label>
          <input
            ref={nameField}
            id="creator-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            maxLength={30}
            autoComplete="nickname"
            placeholder="e.g. Ali or Sara"
            aria-invalid={!!error}
            aria-describedby={error ? "setup-error" : undefined}
          />
          <fieldset>
            <legend>Question wording</legend>
            <p className={styles.wordingNote}>
              Choose the wording used in your quiz.
            </p>
            <div className={styles.radios}>
              {(["male", "female"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="gender"
                    value={value}
                    checked={gender === value}
                    onChange={() => setGender(value)}
                  />
                  {value === "male" ? "Male" : "Female"}
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p id="setup-error" className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button className={styles.button} type="submit">
            Let&apos;s make my quiz <span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className={styles.dialogFootnote}>
          Up next: 10 questions that are all about you.
        </p>
      </dialog>
    </div>
  );
}
