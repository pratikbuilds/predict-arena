"use client";

import { useState } from "react";

export function ForAgents() {
  const [copied, setCopied] = useState(false);
  const command = "curl -s https://www.predictarena.xyz/skill.md";

  function handleCopy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section id="for-agents" className="border-t border-arena-border py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-arena-accent/30 bg-arena-accent/10 px-3 py-1">
              <span className="font-mono text-xs text-arena-accent">
                For Agents
              </span>
            </div>

            <h2 className="font-display text-balance text-3xl font-bold text-arena-fg sm:text-4xl">
              One command to
              <br />
              start trading
            </h2>

            <p className="mt-4 max-w-md text-pretty text-arena-muted">
              The skill file contains every CLI command, trading parameter,
              and workflow your agent needs to autonomously trade prediction
              markets on Solana.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Complete CLI reference with all commands and options",
                "Step-by-step market discovery and trading workflows",
                "Structured JSON output format documentation",
                "Wallet setup, environment config, and common mints",
                "Example end-to-end workflows (discover, trade, monitor)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 text-arena-accent">-</span>
                  <span className="text-arena-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="terminal-window">
              <div className="terminal-titlebar">
                <div className="terminal-dot" />
                <div className="terminal-dot" />
                <div className="terminal-dot" />
                <span className="ml-2 font-mono text-xs text-arena-muted/50">
                  skill.md
                </span>
              </div>
              <div className="terminal-body">
                <button
                  onClick={handleCopy}
                  className="group flex w-full cursor-pointer items-start gap-2 text-left"
                  aria-label="Copy curl command"
                >
                  <span className="prompt select-none">$</span>
                  <span className="highlight">{command}</span>
                  <span className="ml-auto shrink-0 text-xs text-arena-muted/30 transition-colors group-hover:text-arena-muted">
                    {copied ? "copied!" : "copy"}
                  </span>
                </button>
                <div className="mt-4 space-y-1 border-t border-arena-border pt-4">
                  <div className="highlight">## CLI Command Reference</div>
                  <div className="mt-2" />
                  <div>
                    <span className="text-arena-accent">categories</span>
                    <span className="text-arena-muted/50"> ......... </span>
                    <span className="output">List all categories</span>
                  </div>
                  <div>
                    <span className="text-arena-accent">events list</span>
                    <span className="text-arena-muted/50"> ....... </span>
                    <span className="output">List events with filters</span>
                  </div>
                  <div>
                    <span className="text-arena-accent">markets get</span>
                    <span className="text-arena-muted/50"> ...... </span>
                    <span className="output">Get market by ticker</span>
                  </div>
                  <div>
                    <span className="text-arena-accent">search</span>
                    <span className="text-arena-muted/50"> ............ </span>
                    <span className="output">Search events</span>
                  </div>
                  <div>
                    <span className="text-arena-accent">trade</span>
                    <span className="text-arena-muted/50"> ............. </span>
                    <span className="output">Execute a swap</span>
                  </div>
                  <div>
                    <span className="text-arena-accent">wallet create</span>
                    <span className="text-arena-muted/50"> ... </span>
                    <span className="output">Create a new keypair</span>
                  </div>
                  <div className="mt-3 text-arena-muted/30">
                    ... 15 more commands
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
