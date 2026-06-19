import { getDb } from "@/lib/db";
import { matches, markets, odds } from "@whatsbet/database";
import { eq } from "drizzle-orm";

interface OddsApiEvent {
  id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers?: Array<{
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>;
}

export async function syncOddsFromApi(): Promise<{ synced: number }> {
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) {
    throw new Error("THE_ODDS_API_KEY not set");
  }

  const res = await fetch(
    `https://api.the-odds-api.com/v4/sports/soccer/odds?apiKey=${apiKey}&regions=eu&markets=h2h,totals&oddsFormat=decimal`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Odds API error (${res.status})${body ? `: ${body.slice(0, 120)}` : ""}`);
  }

  const events: OddsApiEvent[] = await res.json();
  const db = getDb();
  let synced = 0;

  for (const event of events.slice(0, 30)) {
    const [existing] = await db.select().from(matches).where(eq(matches.externalId, event.id)).limit(1);

    let matchId: string;
    if (existing) {
      matchId = existing.id;
    } else {
      const [created] = await db
        .insert(matches)
        .values({
          externalId: event.id,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          league: event.sport_key,
          startTime: new Date(event.commence_time),
          status: "scheduled",
        })
        .returning();
      matchId = created.id;
    }

    const bookmaker = event.bookmakers?.[0];
    if (!bookmaker) continue;

    for (const market of bookmaker.markets) {
      const marketType = market.key === "h2h" ? "1x2" : market.key === "totals" ? "over_under" : "1x2";

      let [marketRow] = await db.select().from(markets).where(eq(markets.matchId, matchId)).limit(1);

      if (!marketRow) {
        [marketRow] = await db
          .insert(markets)
          .values({ matchId, type: marketType as "1x2" | "over_under", name: market.key })
          .returning();
      }

      for (const outcome of market.outcomes) {
        const [existingOdd] = await db.select().from(odds).where(eq(odds.marketId, marketRow.id)).limit(1);

        if (!existingOdd) {
          await db.insert(odds).values({
            marketId: marketRow.id,
            selection: outcome.name,
            value: String(outcome.price),
          });
        } else {
          await db
            .update(odds)
            .set({ value: String(outcome.price), updatedAt: new Date() })
            .where(eq(odds.id, existingOdd.id));
        }
      }
    }
    synced++;
  }

  return { synced };
}
