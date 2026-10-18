
"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  aiTraining: boolean;
  research: boolean;
  showOptionalConsent: boolean;
  errors: {
    acceptTerms?: string;
    acceptPrivacy?: string;
  };
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  onAiTrainingChange: (checked: boolean) => void;
  onResearchChange: (checked: boolean) => void;
};

export default function SignupConsents(props: Props) {
  const [expanded, setExpanded] = useState(false);
  const {
    acceptTerms,
    acceptPrivacy,
    aiTraining,
    research,
    showOptionalConsent,
    errors,
  } = props;

  return (
    <div className="space-y-3 text-sm text-indigo-100">
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={acceptTerms && acceptPrivacy}
          required
          onChange={(event) => {
            props.onTermsChange(event.target.checked);
            props.onPrivacyChange(event.target.checked);
          }}
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {(errors.acceptTerms || errors.acceptPrivacy) && (
        <p role="alert" className="text-red-300">
          Please accept the terms and privacy policy.
        </p>
      )}

      {showOptionalConsent && (
        <div className="border-t border-indigo-300/20 pt-3">
          <button
            type="button"
            className="text-indigo-200 underline"
            aria-expanded={expanded}
            onClick={() => setExpanded((previous) => !previous)}
          >
            Optional data preferences {expanded ? "−" : "+"}
          </button>

          {expanded && (
            <label className="mt-3 flex items-start gap-2">
              <input
                type="checkbox"
                checked={aiTraining && research}
                onChange={(event) => {
                  props.onAiTrainingChange(event.target.checked);
                  props.onResearchChange(event.target.checked);
                }}
              />
              <span>
                Allow my data to be used for AI training and research
                (optional).
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
