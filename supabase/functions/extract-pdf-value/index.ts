import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing file:', file.name, 'Size:', file.size);

    // Convert file to base64 for the AI model
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI to extract value from PDF...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em extrair valores de documentos financeiros brasileiros como boletos, faturas e comprovantes de pagamento.
            
Sua tarefa é analisar o documento e extrair APENAS o valor total a ser pago.

REGRAS:
1. Procure por campos como "Valor do Documento", "Valor Total", "Total a Pagar", "Valor", "(=) Valor do Documento"
2. Retorne APENAS o valor numérico, sem o símbolo R$
3. Use ponto como separador decimal (ex: 1234.56)
4. Se encontrar múltiplos valores, retorne o valor total/final
5. Se não conseguir identificar o valor, retorne null

Responda APENAS com um JSON no formato: {"value": 1234.56} ou {"value": null}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia o valor total a ser pago deste documento financeiro:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse));
    
    const content = aiResponse.choices?.[0]?.message?.content || '';
    console.log('Content:', content);
    
    // Try to parse the JSON response
    let extractedValue = null;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      extractedValue = parsed.value;
    } catch (parseError) {
      console.log('Could not parse JSON, trying regex...');
      // Fallback: try to extract number from response
      const match = content.match(/[\d.,]+/);
      if (match) {
        extractedValue = parseFloat(match[0].replace(',', '.'));
      }
    }

    console.log('Extracted value:', extractedValue);

    return new Response(
      JSON.stringify({ value: extractedValue }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in extract-pdf-value function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
