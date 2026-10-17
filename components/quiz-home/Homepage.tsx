"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark, FriendsArt, StepIcon } from "./Illustrations";
import { saveCreatorSetup } from "./creatorSetup";
import AdsterraNativeBanner from "@/components/ads/AdsterraNativeBanner";
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
          <HowItWorks />
          <CTASection onStart={openCreator} />
          <div className="max-w-md mx-auto px-4">
            <AdsterraNativeBanner />
          </div>
        </main>
        <Footer />
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
