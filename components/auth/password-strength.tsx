"use client";

import React from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  confirmPassword?: string;
  showConfirmCheck?: boolean;
}

export function PasswordStrength({
  password,
  confirmPassword,
  showConfirmCheck = false,
}: PasswordStrengthProps) {
  const hasMinLength = password.length >= 8;
  const hasMixedChars = /[a-zA-Z]/.test(password) && /[\d\W_]/.test(password);
  const matchesConfirm = Boolean(
    confirmPassword && password && password === confirmPassword
  );

  let strengthScore = 0;
  if (password.length > 0) strengthScore += 1;
  if (hasMinLength) strengthScore += 1;
  if (hasMixedChars) strengthScore += 1;

  let strengthLabel = "";
  let strengthColorClass = "";

  if (password.length === 0) {
    strengthLabel = "";
  } else if (strengthScore === 1) {
    strengthLabel = "Weak";
    strengthColorClass = "strength-weak";
  } else if (strengthScore === 2) {
    strengthLabel = "Fair";
    strengthColorClass = "strength-fair";
  } else {
    strengthLabel = "Strong";
    strengthColorClass = "strength-strong";
  }

  if (!password && !confirmPassword) return null;

  return (
    <div className="password-strength-container" aria-live="polite">
      {password.length > 0 && (
        <>
          <div className="strength-bar-row">
            <div className="strength-bars">
              <span className={`strength-bar-segment ${strengthScore >= 1 ? strengthColorClass : ""}`} />
              <span className={`strength-bar-segment ${strengthScore >= 2 ? strengthColorClass : ""}`} />
              <span className={`strength-bar-segment ${strengthScore >= 3 ? strengthColorClass : ""}`} />
            </div>
            {strengthLabel && (
              <span className={`strength-label ${strengthColorClass}`}>
                {strengthLabel}
              </span>
            )}
          </div>

          <div className="strength-rules">
            <div className={`strength-rule ${hasMinLength ? "rule-met" : "rule-unmet"}`}>
              {hasMinLength ? <Check size={12} /> : <X size={12} />}
              <span>At least 8 characters</span>
            </div>
            <div className={`strength-rule ${hasMixedChars ? "rule-met" : "rule-unmet"}`}>
              {hasMixedChars ? <Check size={12} /> : <X size={12} />}
              <span>Letters and at least one number or symbol</span>
            </div>
          </div>
        </>
      )}

      {showConfirmCheck && confirmPassword && confirmPassword.length > 0 && (
        <div className={`strength-rule confirm-rule ${matchesConfirm ? "rule-met" : "rule-unmet"}`}>
          {matchesConfirm ? <Check size={12} /> : <X size={12} />}
          <span>{matchesConfirm ? "Passwords match" : "Passwords do not match"}</span>
        </div>
      )}
    </div>
  );
}
