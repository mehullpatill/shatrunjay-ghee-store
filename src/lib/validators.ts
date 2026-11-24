import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: passwordSchema,
  referralCodeUsed: z.string().trim().max(32).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
  totpCode: z.string().trim().max(10).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(40).default("Home"),
  recipientName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(15),
  line1: z.string().trim().min(4).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian pincode"),
  isDefault: z.boolean().optional().default(false),
});

export const checkoutCreateSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1, "Cart cannot be empty"),
  address: addressSchema,
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  discountCode: z.string().trim().max(40).optional().nullable(),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms, Privacy, Shipping, and Refund policies." }),
  }),
});

export const contactFormSchema = z.object({
  type: z.enum(["CONTACT", "BULK_ENQUIRY"]),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().min(5).max(3000),
  website: z.string().max(0).optional(), // honeypot
});

export const orderQuerySchema = z.object({
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(5).max(2000),
});

export const processStepArraySchema = z
  .array(
    z.object({
      heading: z.string().trim().min(1).max(150),
      subheading: z.string().trim().max(400).optional().nullable(),
      imageUrl: z.string().max(500).optional().nullable(),
      imageS3Key: z.string().max(300).optional().nullable(),
    })
  )
  .max(9, "Maximum 9 steps allowed per process block");

export const pincodeRowSchema = z.object({
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/),
  isMumbai: z.boolean(),
  isCodAllowed: z.boolean(),
  city: z.string().trim().max(80).optional().nullable(),
  area: z.string().trim().max(120).optional().nullable(),
});
