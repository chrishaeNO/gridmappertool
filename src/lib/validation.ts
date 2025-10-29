import { z } from 'zod';

// Grid map validation schema
export const gridMapSchema = z.object({
  name: z.string().min(1).max(100),
  imageSrc: z.string().optional(),
  splitCols: z.number().int().min(1).max(10),
  splitRows: z.number().int().min(1).max(10),
  cellSizePx: z.number().min(10).max(500),
  gridOffset: z.object({
    x: z.number(),
    y: z.number()
  }),
  panOffset: z.object({
    x: z.number(),
    y: z.number()
  }),
  imageZoom: z.number().min(0.1).max(10),
  showGrid: z.boolean(),
  showCoordinates: z.boolean(),
  showReferencePoints: z.boolean(),
  gridColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  coordinateColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  referenceColors: z.record(z.string()),
  sliceNames: z.record(z.string()).optional(),
  imageDimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  sliceImageSettings: z.record(z.object({
    zoom: z.number().min(0.1).max(10),
    panOffset: z.object({
      x: z.number(),
      y: z.number()
    })
  })).optional(),
  // Add missing fields from Prisma schema
  imageFile: z.object({
    name: z.string(),
    size: z.number(),
    type: z.string()
  }).optional(),
  cellSize: z.number().optional(),
  unit: z.string().optional(),
  dpi: z.number().optional(),
  backgroundColor: z.string().optional(),
  gridThickness: z.number().optional(),
  showCenterCoords: z.boolean().optional(),
  showScaleBar: z.boolean().optional(),
  shared: z.boolean().optional()
});

// User registration validation
export const registerSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

// User login validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Password reset validation
export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128)
});

// Email validation
export const emailSchema = z.object({
  email: z.string().email()
});

export type GridMapInput = z.infer<typeof gridMapSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
