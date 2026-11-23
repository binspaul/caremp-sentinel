export interface TrendResult {
    vital: string;
    window: "30m";
    direction: "UP" | "DOWN" | "STABLE";
    percentageChange: number;
    rateOfChange: number;
}
