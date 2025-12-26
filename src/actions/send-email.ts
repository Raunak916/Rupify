import React from "react";
import { Resend } from "resend";

interface EmailTemplateProps {
    to:string,
    subject:string,
    react:React.ReactNode
}
export async function sendEmail({
  to,
  subject,
  react
}:EmailTemplateProps
) {
  const resend = new Resend(process.env.RESEND_API_KEY || "");

  try {
    const data = await resend.emails.send({
      from: "Rupify-App <onboarding@resend.dev>",
      to,
      subject,
      react,
    });
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
}
