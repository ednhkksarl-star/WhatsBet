import { describe, expect, it } from "vitest";
import { BetEngine } from "../services/bet-engine";
import { DEFAULT_QUICKBET_STAKE, MIN_BET_STAKE } from "../constants";
import { inferProvinceFromPhone } from "../geo/infer-province";

describe("BetEngine", () => {
  it("accepts minimum stake of 300 CDF", () => {
    expect(BetEngine.MIN_STAKE).toBe(300);
    expect(MIN_BET_STAKE).toBe(300);
    expect(DEFAULT_QUICKBET_STAKE).toBe(300);
  });

  it("builds a valid ticket", () => {
    const result = BetEngine.build({
      userId: "user-1",
      stake: 300,
      selections: [
        { matchId: "m1", oddId: "o1", selection: "Home", oddValue: 1.5 },
        { matchId: "m2", oddId: "o2", selection: "Draw", oddValue: 2.0 },
      ],
    });
    expect(result.totalOdds).toBeCloseTo(3.0);
    expect(result.potentialWin).toBeCloseTo(900);
  });

  it("rejects stake below minimum", () => {
    expect(() =>
      BetEngine.build({
        userId: "u",
        stake: 100,
        selections: [{ matchId: "m1", oddId: "o1", selection: "Home", oddValue: 1.5 }],
      })
    ).toThrow(/Mise minimum/);
  });
});

describe("inferProvinceFromPhone", () => {
  it("maps Kinshasa prefixes", () => {
    expect(inferProvinceFromPhone("+243812345678")).toBe("CD-KN");
  });
});
