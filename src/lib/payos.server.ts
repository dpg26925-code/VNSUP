import { createHmac, timingSafeEqual } from "crypto";

const PAYOS_BASE = "https://api-merchant.payos.vn";

export type PayOSCreatePayload = {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  buyerName?: string;
  buyerEmail?: string;
  expiredAt?: number; // unix seconds
};

export type PayOSPaymentLink = {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
};

function requireEnv() {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!clientId || !apiKey || !checksumKey) {
    throw new Error("payOS credentials chưa được cấu hình");
  }
  return { clientId, apiKey, checksumKey };
}

// Signature cho request tạo payment: theo docs payOS
// dataStr = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`
function signCreateRequest(p: PayOSCreatePayload, checksumKey: string) {
  const dataStr = `amount=${p.amount}&cancelUrl=${p.cancelUrl}&description=${p.description}&orderCode=${p.orderCode}&returnUrl=${p.returnUrl}`;
  return createHmac("sha256", checksumKey).update(dataStr).digest("hex");
}

export async function createPayOSPaymentLink(payload: PayOSCreatePayload): Promise<PayOSPaymentLink> {
  const { clientId, apiKey, checksumKey } = requireEnv();
  const signature = signCreateRequest(payload, checksumKey);

  const res = await fetch(`${PAYOS_BASE}/v2/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ ...payload, signature }),
  });

  const json = (await res.json()) as { code: string; desc: string; data?: PayOSPaymentLink };
  if (!res.ok || json.code !== "00" || !json.data) {
    throw new Error(`payOS API lỗi [${json.code}]: ${json.desc}`);
  }
  return json.data;
}

// Xác minh chữ ký webhook: HMAC-SHA256 của queryString(sortedKeys(data)) với checksumKey
export function verifyWebhookSignature(data: Record<string, unknown>, signature: string): boolean {
  const { checksumKey } = requireEnv();
  const sortedKeys = Object.keys(data).sort();
  const dataStr = sortedKeys
    .map((k) => {
      let v = data[k];
      if (v === null || v === undefined) v = "";
      if (typeof v === "object") v = JSON.stringify(v);
      return `${k}=${v}`;
    })
    .join("&");
  const expected = createHmac("sha256", checksumKey).update(dataStr).digest("hex");
  const sigBuf = Buffer.from(signature, "utf-8");
  const expBuf = Buffer.from(expected, "utf-8");
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

// Tạo order code duy nhất từ timestamp (bigint, phạm vi payOS: 1..9007199254740992)
export function generateOrderCode(): number {
  const base = Date.now();
  const rand = Math.floor(Math.random() * 1000);
  return Number(`${base}${rand.toString().padStart(3, "0")}`.slice(-15));
}

export const PLAN_CATALOG = {
  featured_listing: { name: "Featured Listing", amount: 499000, scope: "company" as const, days: 30 },
  verified_badge:   { name: "Verified Badge",   amount: 299000, scope: "company" as const, days: 30 },
  lead_notification:{ name: "Lead Notification",amount: 199000, scope: "account" as const, days: 30 },
} as const;

export type PlanKey = keyof typeof PLAN_CATALOG;
