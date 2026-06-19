import { describe, expect, it } from "vitest";
import { parseProvinceChoice, validateCityName } from "../geo/rdc-provinces";

describe("parseProvinceChoice", () => {
  it("accepts menu number", () => {
    expect(parseProvinceChoice("9")?.name).toBe("Kinshasa");
    expect(parseProvinceChoice("1")?.id).toBe("CD-BC");
  });

  it("accepts province name", () => {
    expect(parseProvinceChoice("Kinshasa")?.id).toBe("CD-KN");
    expect(parseProvinceChoice("nord-kivu")?.id).toBe("CD-NK");
  });

  it("rejects invalid input", () => {
    expect(parseProvinceChoice("99")).toBeNull();
    expect(parseProvinceChoice("")).toBeNull();
  });
});

describe("validateCityName", () => {
  it("accepts valid city names", () => {
    expect(validateCityName("Goma")).toBe("Goma");
    expect(validateCityName("  Kinshasa  ")).toBe("Kinshasa");
  });

  it("rejects invalid city names", () => {
    expect(validateCityName("1")).toBeNull();
    expect(validateCityName("a")).toBeNull();
  });
});
