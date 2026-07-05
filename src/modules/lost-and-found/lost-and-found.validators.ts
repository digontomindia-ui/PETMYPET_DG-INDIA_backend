import { z } from 'zod';
import { LOST_AND_FOUND_TYPES } from './lost-and-found.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createLostAndFoundSchema = z.object({
  type: z.enum([LOST_AND_FOUND_TYPES.LOST, LOST_AND_FOUND_TYPES.FOUND]),
  petName: z.string().max(100).default(''),
  species: z.string().min(1).max(50),
  breed: z.string().max(100).default(''),
  description: z.string().min(1).max(2000),
  photoUrls: z.array(z.string().url()).max(10).default([]),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).optional(),
  contactPhone: z.string().min(7).max(20),
});

export const rejectLostAndFoundSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const listLostAndFoundQuerySchema = z.object({
  type: z.enum([LOST_AND_FOUND_TYPES.LOST, LOST_AND_FOUND_TYPES.FOUND]).optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  radiusMeters: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const listPendingQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
