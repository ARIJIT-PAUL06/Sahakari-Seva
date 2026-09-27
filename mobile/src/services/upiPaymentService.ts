// src/services/upiPaymentService.ts
// ==============================================================================
// SAHAKARI SEVA — NPCI UPI SPECIFICATION & COMPLETION TOKEN SERVICE
// Standard deep-link builders, intent launchers, and payload parsers.
// ==============================================================================

import { Linking, Platform } from 'react-native';

export interface UPIPaymentParams {
  pa?: string; // Payee VPA
  pn?: string; // Payee Name
  am: number;  // Amount in INR
  cu?: string; // Currency (INR)
  tn?: string; // Transaction note
  tr?: string; // Transaction reference
}

export interface CompletionQRPayload {
  type: 'COOP_COMPLETION';
  bookingId: string;
  bookingCode: string;
  code: string;
  amount: number;
  timestamp: number;
  v: number;
}

export const COOP_DEFAULT_VPA = 'sahakari.coop@npci';
export const COOP_PAYEE_NAME = 'Sahakari Seva Cooperative Federation';

export class UPIPaymentService {
  /**
   * Generates a standard NPCI-compliant UPI deep link.
   * e.g., upi://pay?pa=sahakari.coop@npci&pn=Sahakari%20Seva&am=450.00&cu=INR&tn=BK-2026-Jaipur&tr=TXN-178923
   */
  public static buildUPIUri(params: UPIPaymentParams): string {
    const vpa = params.pa || COOP_DEFAULT_VPA;
    const payee = params.pn || COOP_PAYEE_NAME;
    const amount = Number(params.am).toFixed(2);
    const currency = params.cu || 'INR';
    const note = params.tn || 'Sahakari Seva Service Payment';
    const ref = params.tr || `TXN-${Date.now().toString().slice(-8)}`;

    const query = [
      `pa=${encodeURIComponent(vpa)}`,
      `pn=${encodeURIComponent(payee)}`,
      `am=${encodeURIComponent(amount)}`,
      `cu=${encodeURIComponent(currency)}`,
      `tn=${encodeURIComponent(note)}`,
      `tr=${encodeURIComponent(ref)}`,
    ].join('&');

    return `upi://pay?${query}`;
  }

  /**
   * Generates an app-specific UPI deep-link URI if requested.
   */
  public static buildAppSpecificUPIUri(
    app: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'default',
    params: UPIPaymentParams
  ): string {
    const baseUri = this.buildUPIUri(params);
    if (Platform.OS === 'web') return baseUri;

    // Platform-specific package or custom schemes
    switch (app) {
      case 'gpay':
        return Platform.OS === 'android'
          ? `tez://upi/pay?${baseUri.replace('upi://pay?', '')}`
          : baseUri;
      case 'phonepe':
        return Platform.OS === 'android'
          ? `phonepe://pay?${baseUri.replace('upi://pay?', '')}`
          : baseUri;
      case 'paytm':
        return `paytmmp://pay?${baseUri.replace('upi://pay?', '')}`;
      default:
        return baseUri;
    }
  }

  /**
   * Launches installed UPI app or standard intent chooser.
   */
  public static async launchUPIApp(
    app: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'default',
    params: UPIPaymentParams
  ): Promise<boolean> {
    const uri = this.buildAppSpecificUPIUri(app, params);
    try {
      const canOpen = await Linking.canOpenURL(uri);
      if (canOpen) {
        await Linking.openURL(uri);
        return true;
      }
      // Fallback to standard upi:// scheme
      const defaultUri = this.buildUPIUri(params);
      const canOpenDefault = await Linking.canOpenURL(defaultUri);
      if (canOpenDefault) {
        await Linking.openURL(defaultUri);
        return true;
      }
      return false;
    } catch {
      // Fallback for Web or restricted device
      return false;
    }
  }

  /**
   * Encodes a structured completion payload for customer QR pass.
   */
  public static buildCompletionPayload(
    bookingId: string,
    bookingCode: string,
    code: string,
    amount: number
  ): string {
    const payload: CompletionQRPayload = {
      type: 'COOP_COMPLETION',
      bookingId,
      bookingCode,
      code,
      amount,
      timestamp: Date.now(),
      v: 1,
    };
    return JSON.stringify(payload);
  }

  /**
   * Decodes scanned string (handles JSON payload, delimited string, or raw PIN).
   */
  public static parseCompletionPayload(raw: string): {
    code: string;
    bookingId?: string;
    bookingCode?: string;
    amount?: number;
    isValidStructure: boolean;
  } {
    const trimmed = (raw || '').trim();

    // 1. Try parsing JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.code) {
          return {
            code: String(parsed.code).trim(),
            bookingId: parsed.bookingId,
            bookingCode: parsed.bookingCode,
            amount: Number(parsed.amount),
            isValidStructure: true,
          };
        }
      } catch {
        // Not valid json, continue to fallbacks
      }
    }

    // 2. Delimited format: BK-2026-8492
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      const lastPart = parts[parts.length - 1];
      if (/^\d{4}$/.test(lastPart)) {
        return {
          code: lastPart,
          bookingCode: parts.slice(0, parts.length - 1).join('-'),
          isValidStructure: true,
        };
      }
    }

    // 3. Raw 4-digit code
    if (/^\d{4}$/.test(trimmed)) {
      return {
        code: trimmed,
        isValidStructure: true,
      };
    }

    // Return whatever text was read as code fallback
    return {
      code: trimmed,
      isValidStructure: false,
    };
  }
}
