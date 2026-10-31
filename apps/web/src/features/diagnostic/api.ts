import { api } from "@/lib/api/client";

import type {
  DiagnosticAnswerRequest,
  DiagnosticAnswerResponse,
  DiagnosticCompleteResponse,
  DiagnosticCompleted,
  DiagnosticStartRequest,
  DiagnosticStartResponse,
} from "@ai-tutor/types";

export async function startDiagnostic(
  request: DiagnosticStartRequest
): Promise<DiagnosticStartResponse> {
  return api<DiagnosticStartResponse>("/diagnostic/start", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function submitDiagnosticAnswer(
  diagnosticId: string,
  request: DiagnosticAnswerRequest
): Promise<DiagnosticAnswerResponse> {
  return api<DiagnosticAnswerResponse>(
    `/diagnostic/${encodeURIComponent(diagnosticId)}/answers`,
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );
}

export async function completeDiagnostic(
  diagnosticId: string
): Promise<DiagnosticCompleteResponse> {
  return api<DiagnosticCompleteResponse>(
    `/diagnostic/${encodeURIComponent(diagnosticId)}/complete`,
    { method: "POST" }
  );
}

/**
 * The API returns HTTP 202 with status "grading" while queued C++ submissions
 * are still being judged. The shared api() client parses the envelope for both
 * 200 and 202 responses. The backend stops waiting after its grading window;
 * this client adds a defensive upper bound in case the API becomes unavailable.
 */
export async function completeDiagnosticAndWait(
  diagnosticId: string
): Promise<DiagnosticCompleted> {
  const deadline = Date.now() + 130_000;

  while (Date.now() < deadline) {
    const response = await completeDiagnostic(diagnosticId);
    const diagnostic = response.diagnostic;

    if (diagnostic.status === "completed") {
      return diagnostic;
    }

    const delay = Math.min(Math.max(diagnostic.retryAfterMs, 500), 10_000);
    if (Date.now() + delay > deadline) break;

    await new Promise<void>((resolve) => window.setTimeout(resolve, delay));
  }

  throw new Error(
    "Code evaluation is taking longer than expected. Please try completing the assessment again."
  );
}
