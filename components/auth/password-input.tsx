"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function PasswordInput({
  label,
  error,
  id,
  className = "",
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const inputId = id || props.name || "password-input";

  return (
    <div className={`auth-field ${error ? "has-error" : ""}`}>
      <div className="auth-field-header">
        <label htmlFor={inputId}>{label}</label>
      </div>
      <div className="password-input-wrapper">
        <input
          id={inputId}
          type={show ? "text" : "password"}
          className={`auth-input ${className}`}
          autoComplete={props.name === "password" ? "current-password" : "new-password"}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          className="password-toggle-btn"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span className="auth-field-error" role="alert">{error}</span>}
    </div>
  );
}
