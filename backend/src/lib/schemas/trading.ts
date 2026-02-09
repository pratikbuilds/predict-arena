import { z } from "zod";

export const sideSchema = z.enum(["YES", "NO"]);

export const buyTradeSchema = z.object({
  marketTicker: z.string().min(1),
  side: sideSchema,
  amount: z.number().positive(),
});

export const sellTradeSchema = z.object({
  marketTicker: z.string().min(1),
  side: sideSchema,
  contracts: z.number().positive(),
});

export const redeemTradeSchema = z.object({
  marketTicker: z.string().min(1),
});

export type BuyTradeBody = z.infer<typeof buyTradeSchema>;
export type SellTradeBody = z.infer<typeof sellTradeSchema>;
export type RedeemTradeBody = z.infer<typeof redeemTradeSchema>;
