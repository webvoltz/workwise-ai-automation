import { z } from 'zod';

export const ticketCategorySchema = z.enum(['billing', 'technical', 'account', 'general']);
export const ticketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const ticketClassificationSchema = z.object({
  category: ticketCategorySchema,
  priority: ticketPrioritySchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
});

export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;
export type TicketClassification = z.infer<typeof ticketClassificationSchema>;
