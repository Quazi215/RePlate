type WalkingFare = {
  kind: "walking-fare";
  label: "Walking fare";
  amountCents: 0;
  currency: "USD";
};

type LocalBusExample = {
  kind: "local-bus-example";
  label: "Example local-bus fare";
  currency: "USD";
  perPaidRideCents: number;
  twoSeparatelyPaidRidesCents: number;
  sourceUrl: string;
  reviewedAt: string;
};

type UnknownFare = {
  kind: "unknown";
  label: "Local-bus fare unavailable";
  amountCents: null;
  reason: string;
};

type CommonContext = {
  scope: "generic-mode-context";
  caveats: string[];
  unavailable: {
    storeSpecificFare: null;
    routeAvailability: null;
    busReachability: null;
    routeDistance: null;
    routeDuration: null;
    groceryCost: null;
    totalShoppingCost: null;
  };
};

export type FareContext = CommonContext & (
  | { mode: "walking"; fare: WalkingFare }
  | { mode: "bus"; fare: LocalBusExample | UnknownFare }
);

export type FareContextResult =
  | { status: "ready"; context: FareContext }
  | { status: "malformed"; code: "INVALID_TRAVEL_MODE"; message: string };

type ReviewedFare = {
  status: "reviewed";
  sourceUrl: string;
  reviewedAt: string;
  serviceClass: "local-bus";
  currency: "USD";
  perPaidRideCents: number;
};

function isReviewedFare(value: unknown): value is ReviewedFare {
  if (typeof value !== "object" || value === null) return false;
  const reference = value as Record<string, unknown>;
  if (reference.status !== "reviewed" || reference.sourceUrl !== "https://www.mta.info/fares-tolls/subway-bus" ||
      reference.serviceClass !== "local-bus" || reference.currency !== "USD" ||
      typeof reference.reviewedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(reference.reviewedAt) ||
      typeof reference.perPaidRideCents !== "number" || !Number.isSafeInteger(reference.perPaidRideCents) ||
      reference.perPaidRideCents <= 0 || reference.perPaidRideCents > Math.floor(Number.MAX_SAFE_INTEGER / 2)) return false;
  const date = new Date(reference.reviewedAt);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === reference.reviewedAt;
}

/** Mode-wide display context only. It accepts no retailer, route, or basket inputs. */
export function getFareContext(mode: unknown, reference: unknown): FareContextResult {
  if (mode !== "walking" && mode !== "bus") {
    return { status: "malformed", code: "INVALID_TRAVEL_MODE", message: "Choose walking or bus." };
  }
  const common: CommonContext = {
    scope: "generic-mode-context",
    caveats: [
      "Route availability, travel time, and store-specific travel costs are unverified.",
      "Grocery prices and total shopping cost are unknown. Fare context does not determine retailer ordering.",
    ],
    unavailable: {
      storeSpecificFare: null, routeAvailability: null, busReachability: null,
      routeDistance: null, routeDuration: null, groceryCost: null, totalShoppingCost: null,
    },
  };
  if (mode === "walking") {
    return { status: "ready", context: {
      ...common, mode,
      fare: { kind: "walking-fare", label: "Walking fare", amountCents: 0, currency: "USD" },
    } };
  }
  common.caveats.push(
    "Transfers, fare caps, and reduced fares can change what you pay.",
    "These examples use the regular local-bus fare. Express buses have a different fare; the service class for your trip is unverified.",
    "Two separately paid rides are an arithmetic example, not a verified round trip or a fare estimate for reaching a store.",
  );
  if (!isReviewedFare(reference)) {
    return { status: "ready", context: {
      ...common, mode,
      fare: { kind: "unknown", label: "Local-bus fare unavailable", amountCents: null,
        reason: "A reviewed source for the local-bus fare is unavailable. Check MTA for current fares." },
    } };
  }
  return { status: "ready", context: {
    ...common, mode,
    fare: {
      kind: "local-bus-example", label: "Example local-bus fare", currency: "USD",
      perPaidRideCents: reference.perPaidRideCents,
      twoSeparatelyPaidRidesCents: reference.perPaidRideCents * 2,
      sourceUrl: reference.sourceUrl, reviewedAt: reference.reviewedAt,
    },
  } };
}
