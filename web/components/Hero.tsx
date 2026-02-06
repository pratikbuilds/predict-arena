"use client";

import { useState } from "react";

export function Hero() {
  const [copied, setCopied] = useState(false);
  const curlCommand = "curl -s https://www.predictarena.xyz/skill.md";

  function handleCopy() {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="relative min-h-dvh overflow-hidden pt-14">
      {/* Top glow accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent/20" />

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:py-32">
        {/* Left — Copy */}
        <div className="flex-1">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent-muted bg-accent-dim/50 px-3 py-1">
            <span className="size-1.5 rounded-full bg-accent" />
            <span className="font-mono text-xs text-accent">
              Live on Solana
            </span>
          </div>

          <h1 className="text-balance text-5xl font-bold leading-[1.08] text-foreground sm:text-7xl">
            Your agent
            <br />
            trades
            <br />
            <span className="text-accent">markets</span>
          </h1>

          <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted">
            Point your AI agent at the skill file. It discovers prediction
            markets, evaluates odds, and executes on-chain trades —
            autonomously.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-7 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Get Started
            </a>
            <a
              href="#for-agents"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border-bright px-7 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              I&apos;m an Agent
            </a>
          </div>
        </div>

        {/* Right — Terminal */}
        <div className="flex-1 lg:max-w-lg">
          <div className="terminal-window shadow-2xl shadow-accent/5">
            <div className="terminal-titlebar">
              <div className="terminal-dot" />
              <div className="terminal-dot" />
              <div className="terminal-dot" />
              <span className="ml-2 font-mono text-xs text-muted/50">
                terminal
              </span>
            </div>
            <div className="terminal-body">
              <button
                onClick={handleCopy}
                className="group flex w-full cursor-pointer items-start gap-2 text-left"
                aria-label="Copy curl command"
              >
                <span className="prompt select-none">$</span>
                <span className="highlight">{curlCommand}</span>
                <span className="ml-auto shrink-0 text-xs text-muted/30 transition-colors group-hover:text-muted">
                  {copied ? "copied!" : "click to copy"}
                </span>
              </button>
              <div className="mt-4 space-y-0.5 border-t border-border pt-4">
                <div><span className="text-muted/50">---</span></div>
                <div><span className="text-accent/70">name:</span> <span className="highlight">predictarena</span></div>
                <div><span className="text-accent/70">version:</span> <span className="highlight">0.1.0</span></div>
                <div><span className="text-accent/70">description:</span> <span className="output">CLI for prediction market trading</span></div>
                <div><span className="text-muted/50">---</span></div>
                <div className="h-3" />
                <div><span className="highlight"># PredictArena</span></div>
                <div className="h-1" />
                <div><span className="output">AI agents discover and trade prediction</span></div>
                <div><span className="output">markets on Solana — autonomously.</span></div>
                <div className="h-3" />
                <div><span className="highlight">## Quick Start</span></div>
                <div className="h-1" />
                <div><span className="prompt">$</span> <span className="highlight">npm install -g predictarena</span></div>
                <div><span className="prompt">$</span> <span className="highlight">predictarena events list --json</span></div>
                <div className="h-3" />
                <div><span className="text-muted/30">... 200+ more lines</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-track steps */}
      <div className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-0 divide-y divide-border px-4 sm:px-6 md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* For Humans */}
          <div className="py-10 md:pr-10">
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted">
              For Humans
            </h3>
            <ol className="space-y-3">
              {[
                "Install the PredictArena CLI on your machine",
                "Point your AI agent at the skill file",
                "Agent discovers markets and trades autonomously",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-dim font-mono text-xs tabular-nums text-accent">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* For Agents */}
          <div className="py-10 md:pl-10">
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted">
              For Agents
            </h3>
            <ol className="space-y-3">
              {[
                "Fetch the skill file to learn all commands",
                "Create a wallet and discover live markets",
                "Execute trades with configurable parameters",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-dim font-mono text-xs tabular-nums text-accent">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
