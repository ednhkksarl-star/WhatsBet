import { calculatePotentialWin, calculateTotalOdds } from "../utils";

export interface SelectionInput {
  matchId: string;
  oddId: string;
  selection: string;
  oddValue: number;
}

export interface TicketInput {
  userId: string;
  stake: number;
  selections: SelectionInput[];
}

export interface TicketResult {
  totalOdds: number;
  potentialWin: number;
  selections: SelectionInput[];
}

export class OddsCalculator {
  static total(odds: number[]): number {
    return calculateTotalOdds(odds);
  }

  static potentialWin(stake: number, totalOdds: number): number {
    return calculatePotentialWin(stake, totalOdds);
  }
}

export class BetEngine {
  static readonly MIN_SELECTIONS = 1;
  static readonly MAX_SELECTIONS = 15;
  static readonly MIN_STAKE = 300;
  static readonly MAX_STAKE = 5_000_000;

  static validate(input: TicketInput): { valid: boolean; error?: string } {
    if (input.selections.length < this.MIN_SELECTIONS) {
      return { valid: false, error: `Minimum ${this.MIN_SELECTIONS} sélection requise.` };
    }
    if (input.selections.length > this.MAX_SELECTIONS) {
      return { valid: false, error: `Maximum ${this.MAX_SELECTIONS} sélections autorisées.` };
    }
    if (input.stake < this.MIN_STAKE) {
      return { valid: false, error: `Mise minimum : ${this.MIN_STAKE} CDF.` };
    }
    if (input.stake > this.MAX_STAKE) {
      return { valid: false, error: `Mise maximum : ${this.MAX_STAKE.toLocaleString()} CDF.` };
    }
    const matchIds = input.selections.map((s) => s.matchId);
    if (new Set(matchIds).size !== matchIds.length) {
      return { valid: false, error: "Un seul pari par match autorisé." };
    }
    for (const sel of input.selections) {
      if (sel.oddValue < 1.01) {
        return { valid: false, error: "Cote invalide." };
      }
    }
    return { valid: true };
  }

  static build(input: TicketInput): TicketResult {
    const validation = this.validate(input);
    if (!validation.valid) throw new Error(validation.error);

    const oddValues = input.selections.map((s) => s.oddValue);
    const totalOdds = OddsCalculator.total(oddValues);
    const potentialWin = OddsCalculator.potentialWin(input.stake, totalOdds);

    return { totalOdds, potentialWin, selections: input.selections };
  }
}
