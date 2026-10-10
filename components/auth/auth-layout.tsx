"use client";

import React from "react";
import Link from "next/link";
import { Bot, ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-background-glow" />

      <div className="auth-container">
        <header className="auth-brand-header">
          <Link href="/" className="auth-brand-logo">
            <span className="brand-mark auth-brand-mark">
              <Bot size={22} strokeWidth={2.4} />
            </span>
            <span className="auth-brand-text">AgentOS</span>
          </Link>
          <span className="auth-badge">Enterprise AI Workforce</span>
        </header>

        <main className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </div>

          {children}
        </main>

        <footer className="auth-footer">
          <div className="auth-security-notice">
            <ShieldCheck size={14} />
            <span>End-to-end encrypted session & SOC2 compliant security</span>
          </div>
          <div className="auth-footer-links">
            <span>© 2026 AgentOS</span>
            <a href="https://github.com/Maan-Sharma/agentos" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
