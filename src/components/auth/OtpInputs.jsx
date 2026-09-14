import { useRef } from "react";

const OTP_LENGTH = 6;

function digitsOnly(raw) {
  return String(raw || "").replace(/\D/g, "").slice(0, OTP_LENGTH);
}

function emptyCode() {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

/** Fill boxes from `startIndex`, or from 0 when the pasted/autofilled value is a full code. */
function fillCode(current, startIndex, digits) {
  const next = current.length === OTP_LENGTH ? [...current] : emptyCode();
  const from = digits.length === OTP_LENGTH ? 0 : startIndex;
  for (let i = 0; i < digits.length && from + i < OTP_LENGTH; i += 1) {
    next[from + i] = digits[i];
  }
  const focusAt = Math.min(from + digits.length, OTP_LENGTH) - 1;
  return { next, focusAt: Math.max(0, focusAt) };
}

export default function OtpInputs({ value, onChange, disabled = false, inputClassName = "" }) {
  const refs = useRef([]);
  const code = Array.isArray(value) && value.length === OTP_LENGTH ? value : emptyCode();

  const apply = (startIndex, digits) => {
    if (!digits) return;
    const { next, focusAt } = fillCode(code, startIndex, digits);
    onChange(next);
    requestAnimationFrame(() => refs.current[focusAt]?.focus());
  };

  const setDigit = (i, raw) => {
    const digits = digitsOnly(raw);
    if (!digits) {
      const next = [...code];
      next[i] = "";
      onChange(next);
      return;
    }
    // Full or partial paste / SMS autofill landed in this box.
    if (digits.length > 1) {
      const typedOverExisting = digits.length === 2 && code[i] && digits[0] === code[i];
      if (!typedOverExisting) {
        apply(i, digits);
        return;
      }
    }
    const next = [...code];
    next[i] = digits.slice(-1);
    onChange(next);
    if (i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time verification code">
      {code.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          onChange={(e) => setDigit(i, e.target.value)}
          onBeforeInput={(e) => {
            const incoming = digitsOnly(e.data);
            if (incoming.length <= 1) return;
            e.preventDefault();
            apply(i, incoming);
          }}
          onPaste={(e) => {
            const pasted = digitsOnly(
              e.clipboardData?.getData("text/plain") || e.clipboardData?.getData("text") || ""
            );
            if (!pasted) return;
            e.preventDefault();
            apply(i, pasted);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) {
              e.preventDefault();
              refs.current[i - 1]?.focus();
            }
            if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
              e.preventDefault();
              refs.current[i + 1]?.focus();
            }
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={OTP_LENGTH}
          pattern="[0-9]*"
          aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
          className={inputClassName}
        />
      ))}
    </div>
  );
}
