import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, hashToCompare, action } = await req.json();

    console.log(`Processing ${action || 'hash'} request`);

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compare password with hash
    if (action === 'compare' && hashToCompare) {
      const isMatch = await compare(password, hashToCompare);
      console.log('Password comparison completed');
      return new Response(
        JSON.stringify({ isMatch }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password
    const hashedPassword = await hash(password);
    console.log('Password hashed successfully');
    
    return new Response(
      JSON.stringify({ hash: hashedPassword }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
