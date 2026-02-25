/**
 * PiiScrubber
 * 
 * A fast, regex-based utility designed to sanitize conversational text 
 * of Personally Identifiable Information (PII) before it is transmitted
 * to external LLM providers, ensuring basic CCPA/GDPR compliance.
 */

export class PiiScrubber {

    // Core Regex Heuristics
    private static readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    private static readonly SSN_REGEX = /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g;
    private static readonly CC_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;
    private static readonly PHONE_REGEX = /\b(?:\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;

    /**
     * Sanitizes a string by replacing identified PII metrics with a masking string.
     * @param text The raw conversational input from the user.
     * @returns The scrubbed string safe for LLM transmission.
     */
    public static scrub(text: string): string {
        if (!text) return text;

        let sanitized = text;

        sanitized = sanitized.replace(this.EMAIL_REGEX, '[REDACTED_EMAIL]');
        sanitized = sanitized.replace(this.SSN_REGEX, '[REDACTED_SSN]');
        sanitized = sanitized.replace(this.CC_REGEX, '[REDACTED_CREDIT_CARD]');
        sanitized = sanitized.replace(this.PHONE_REGEX, '[REDACTED_PHONE]');

        // Add additional deterministic Regex heuristics here as needed
        // e.g., Address detection or precise Geolocation coordinates

        return sanitized;
    }
}
