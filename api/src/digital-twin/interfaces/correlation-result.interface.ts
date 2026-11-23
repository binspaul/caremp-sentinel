export interface CorrelationResult {
    vitalPair: string;
    coefficient: number;
    strength: "WEAK" | "MODERATE" | "STRONG";
    direction: "POSITIVE" | "NEGATIVE";
}
