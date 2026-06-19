const BASE_URL = process.env.SIMPLYPAYE_API_BASE ?? "https://api-simply-pay.net";
const MERCHANT_CODE = process.env.SIMPLYPAYE_MERCHANT_CODE ?? "";
const API_KEY = process.env.SIMPLYPAYE_API_KEY ?? "";
const MODE = process.env.SIMPLYPAYE_MODE ?? "production";
const TIMEOUT_MS = parseInt(process.env.SIMPLYPAYE_TIMEOUT ?? "30000", 10);

export class SimplyPayeError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "SimplyPayeError";
  }
}

export function phoneForSimplyPaye(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isValidMobileMoneyPhone(phone: string): boolean {
  const digits = phoneForSimplyPaye(phone);
  if (digits.startsWith("243")) return digits.length === 12;
  if (digits.startsWith("0")) return digits.length === 10;
  return digits.length >= 9 && digits.length <= 12;
}

function apiPath(): string {
  return MODE === "sandbox" ? "/api/simply-simulation" : "/api/simply-production";
}

function callbackUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/webhooks/simplypaye`;
}

export async function initiateMobilePayment(params: {
  phone: string;
  amount: number;
  reference: string;
}) {
  if (!MERCHANT_CODE || !API_KEY) {
    throw new SimplyPayeError("SimplyPaye non configuré");
  }

  const body: Record<string, string> = {
    merchantCode: MERCHANT_CODE,
    phone: phoneForSimplyPaye(params.phone),
    amount: String(params.amount),
    currency: "CDF",
    reference: params.reference,
    callbackUrl: callbackUrl(),
  };

  if (MODE === "sandbox") {
    body.simulationStatus = "pending";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, "")}${apiPath()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": API_KEY,
        ...(process.env.SIMPLYPAYE_USER_AGENT
          ? { "User-Agent": process.env.SIMPLYPAYE_USER_AGENT }
          : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new SimplyPayeError(
        (data as { message?: string }).message ?? "Erreur SimplyPaye",
        res.status,
        data
      );
    }

    const orderNumber =
      (data as { simply_pay?: { orderNumber?: string } }).simply_pay?.orderNumber ??
      (data as { transaction?: { orderNumberFlex?: string } }).transaction?.orderNumberFlex;

    if (!orderNumber) {
      throw new SimplyPayeError("Réponse SimplyPaye invalide", res.status, data);
    }

    return {
      orderNumber,
      message: (data as { message?: string }).message ?? "",
      status: (data as { status?: string }).status ?? "",
      raw: data,
    };
  } finally {
    clearTimeout(timer);
  }
}
