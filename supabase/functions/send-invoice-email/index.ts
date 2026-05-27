import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the email payload
    const { to, subject, html, replyTo } = (await req.json()) as EmailPayload;

    console.log(`Sending email to: ${to} with subject: ${subject}`);

    if (!to || !subject || !html) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Resend API key from secrets
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY secret is not set in Supabase");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please set RESEND_API_KEY secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "InvoPilot <onboarding@resend.dev>";
    console.log(`Using from address: ${fromEmail}`);

    // Call Resend API directly via fetch
    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });

      const resendData = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error("Resend API error:", JSON.stringify(resendData));
        return new Response(
          JSON.stringify({ 
            error: resendData.message || "Failed to send email via Resend",
            details: resendData 
          }),
          { status: resendResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Email sent successfully. ID: ${resendData.id}`);
      return new Response(
        JSON.stringify({ success: true, id: resendData.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (resendFetchError) {
      console.error("Failed to fetch Resend API:", resendFetchError);
      return new Response(
        JSON.stringify({ error: "Failed to connect to email service provider" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Edge function top-level error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
