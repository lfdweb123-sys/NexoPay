/**
 * FeexPay v2 — voir https://docs.feexpay.me/?section=api-rest-status&version=v2
 *
 * FeexPay ne fournit pas de secret de signature webhook sur cette offre.
 * Donc PLUTÔT QUE de faire confiance au contenu brut du webhook reçu (ce qui
 * serait usurpable par n'importe qui connaissant l'URL), on vérifie le
 * statut réel de la transaction en rappelant nous-mêmes l'API FeexPay dès
 * réception du webhook (fonction verifyTransactionStatus ci-dessous). Le
 * webhook ne sert alors que de déclencheur ("va vérifier"), jamais de
 * source de vérité.
 */
export const FEEXPAY_BASE_URL = "https://api.feexpay.me";

/**
 * Interroge FeexPay pour connaître le VRAI statut d'une transaction,
 * indépendamment de ce que prétend le payload du webhook reçu.
 * Adapte l'URL exacte selon la doc de ton compte (endpoint "status").
 */
export async function verifyTransactionStatus(reference: string): Promise<{
  status: string;
  amount?: number;
  transactionId?: string;
}> {
  const apiKey = process.env.FEEXPAY_API_KEY;
  const shopId = process.env.FEEXPAY_SHOP_ID;
  if (!apiKey || !shopId) {
    throw new Error("FEEXPAY_API_KEY / FEEXPAY_SHOP_ID manquants");
  }

  const res = await fetch(
    `${FEEXPAY_BASE_URL}/api/transactions/public/status/${shopId}/${reference}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur vérification statut FeexPay (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    status: data.status ?? data.transactionStatus ?? "UNKNOWN",
    amount: data.amount,
    transactionId: data.transaction_id ?? data.reference,
  };
}

export async function initiateFeexpayPayment(params: {
  amount: number;
  phoneNumber: string;
  reference: string;
  network: string;
  callbackUrl: string;
}) {
  const apiKey = process.env.FEEXPAY_API_KEY;
  const shopId = process.env.FEEXPAY_SHOP_ID;
  if (!apiKey || !shopId) {
    throw new Error("FEEXPAY_API_KEY / FEEXPAY_SHOP_ID manquants");
  }

  const res = await fetch(`${FEEXPAY_BASE_URL}/api/transactions/public/requesttopay/${shopId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      phoneNumber: params.phoneNumber,
      network: params.network,
      reference: params.reference,
      callback_url: params.callbackUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur FeexPay (${res.status}): ${text}`);
  }
  return res.json();
}
