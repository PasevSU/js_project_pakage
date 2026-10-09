/**
 * Extend Error - Пълна имплементация
 * @module ExtendError
 */

(function(window) {
    'use strict';

    // ================================================================
    // BASE
    // ================================================================

    class ExtendableError extends Error {
        constructor(message, code = null, details = null) {
            super(message);
            this.name = this.constructor.name;
            this.code = code;
            this.details = details;
            this.timestamp = new Date().toISOString();
            
            if (typeof Error.captureStackTrace === 'function') {
                Error.captureStackTrace(this, this.constructor);
            }
        }

        toJSON() {
            return {
                name: this.name,
                message: this.message,
                code: this.code,
                details: this.details,
                timestamp: this.timestamp,
                stack: this.stack
            };
        }

        toString() {
            let result = `${this.name}: ${this.message}`;
            if (this.code) result += ` (${this.code})`;
            return result;
        }
    }

    // ================================================================
    // SPECIFIC ERRORS
    // ================================================================

    class OTSFileError extends ExtendableError {
        constructor(message, details = null) {
            super(message, 'OTS_FILE_ERROR', details);
        }
    }

    class OTSVerificationError extends ExtendableError {
        constructor(message, details = null) {
            super(message, 'OTS_VERIFICATION_ERROR', details);
        }
    }

    class BlockchainError extends ExtendableError {
        constructor(message, details = null) {
            super(message, 'BLOCKCHAIN_ERROR', details);
        }
    }

    class CalendarError extends ExtendableError {
        constructor(message, details = null) {
            super(message, 'CALENDAR_ERROR', details);
        }
    }

    class EvidencePackageError extends ExtendableError {
        constructor(message, details = null) {
            super(message, 'EVIDENCE_PACKAGE_ERROR', details);
        }
    }

    // ================================================================
    // HELPERS
    // ================================================================

    function safeExecute(fn, fallback = null) {
        try { return fn(); } catch { return fallback; }
    }

    async function safeExecuteAsync(fn, fallback = null) {
        try { return await fn(); } catch { return fallback; }
    }

    function safeJSONParse(str, fallback = null) {
        try { return JSON.parse(str); } catch { return fallback; }
    }

    // ================================================================
    // EXPORT
    // ================================================================

    const ExtendError = {
        ExtendableError,
        OTSFileError,
        OTSVerificationError,
        BlockchainError,
        CalendarError,
        EvidencePackageError,
        safeExecute,
        safeExecuteAsync,
        safeJSONParse
    };

    window.ExtendError = ExtendError;

})(typeof window !== 'undefined' ? window : this);