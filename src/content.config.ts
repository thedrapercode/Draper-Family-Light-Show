import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const shows = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/shows' }),
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
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    showSlug: z.string().optional(),
    cancelled: z.boolean().default(false),
  }),
});

const albums = defineCollection({
  loader: glob({ pattern: '**/index.json', base: './src/content/albums' }),
  schema: z.object({
    title: z.string(),
    showSlug: z.string(),
    year: z.number(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    photos: z.array(z.string()).default([]),
  }),
});

const partnerEvents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/partner-events' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().optional(),
    externalTicketUrl: z.string().optional(),
    ticketLabel: z.string().default('Get Tickets'),
    inviteOnly: z.boolean().default(false),
    partnerOrgs: z.array(z.string()).default([]),
    charity: z.string().optional(),
    charityUrl: z.string().optional(),
    heroImage: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { shows, events, albums, partnerEvents };
