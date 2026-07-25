import { defineCollection, z } from 'astro:content';

const shows = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    order: z.number(),
    accent: z.string(),
    hours: z.string(),
    months: z.string(),
    heroImage: z.string().optional(),
    featured: z.boolean().default(false),
    charity: z.string().optional(),
    charityUrl: z.string().optional(),
  }),
});

const events = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    showSlug: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const collections = { shows, events };
