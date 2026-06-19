import type { QuickBetType } from "@whatsbet/types";
import { BetEngine, type SelectionInput } from "./bet-engine";

export interface AvailableOdd {
  matchId: string;
  oddId: string;
  selection: string;
  oddValue: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
}

export class QuickBetEngine {
  static generate(
    type: QuickBetType,
    availableOdds: AvailableOdd[],
    stake: number,
    count = 3
  ): SelectionInput[] {
    const sorted = [...availableOdds].sort((a, b) => a.oddValue - b.oddValue);

    let pool: AvailableOdd[];
    switch (type) {
      case "safe":
        pool = sorted.slice(0, Math.min(count * 3, sorted.length));
        break;
      case "balanced":
        pool = sorted.filter((o) => o.oddValue >= 1.5 && o.oddValue <= 3.0);
        break;
      case "jackpot":
        pool = sorted.reverse().slice(0, Math.min(count * 3, sorted.length));
        break;
      case "custom":
      default:
        pool = sorted;
        break;
    }

    const usedMatches = new Set<string>();
    const selections: SelectionInput[] = [];

    for (const odd of pool) {
      if (selections.length >= count) break;
      if (usedMatches.has(odd.matchId)) continue;
      usedMatches.add(odd.matchId);
      selections.push({
        matchId: odd.matchId,
        oddId: odd.oddId,
        selection: odd.selection,
        oddValue: odd.oddValue,
      });
    }

    if (selections.length === 0) throw new Error("Aucune cote disponible pour QuickBet.");

    const validation = BetEngine.validate({ userId: "", stake, selections });
    if (!validation.valid) throw new Error(validation.error);

    return selections;
  }
}
