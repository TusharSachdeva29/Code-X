import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { validateRegisterInput } from "../../validations/auth.validation";
import db from "../../db";
import { usersTable } from "../../db/schema";
import { sendVerificationEmail } from "../../utils/email";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📥 Register request body:", JSON.stringify(req.body, null, 2));
    const { name, username, email, password } = req.body;
    console.log("📋 Extracted fields - name:", name, "username:", username, "email:", email, "password length:", password?.length);
    
    const validationError = validateRegisterInput({
      username,
      email,
      password,
    });
    if (validationError) {
      console.log("❌ Validation failed:", validationError);
      res.status(400).json({ message: validationError });
      return;
    }
    console.log("✅ Validation passed");

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    console.log("🔍 Existing user check:", existingUser.length > 0 ? "User exists" : "User not found");
    if (existingUser.length > 0) {
      console.log("❌ Email already in use");
      res.status(400).json({ message: "Email is already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db
      .insert(usersTable)
      .values({
        name,
        username,
        email,
        password: hashedPassword,
        is_verified: true,  // Skip email verification for development
      })
      .returning();

    // Skip email verification for development - just mark as verified
    // TODO: Enable email verification in production
    // const verificationToken = jwt.sign(
    //   { userId: newUser[0].id },
    //   process.env.JWT_EMAIL_SECRET!,
    //   { expiresIn: "1d" }
    // );
    // await sendVerificationEmail(email, verificationToken);

    console.log("✅ User registered successfully:", newUser[0].email);

    res.status(201).json({
      message: "User registered successfully!",
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
