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
        JSON.stringify({ error: 'Nenhum arquivo fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing CTE PDF:', file.name, 'Size:', file.size);

    // Convert file to base64 for the AI model
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI to extract CTE data from PDF...');
    
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
            content: `Você é um assistente especializado em extrair dados de documentos CT-e (Conhecimento de Transporte Eletrônico) brasileiros.

Analise o documento PDF e extraia TODOS os dados disponíveis seguindo estas regras:

CAMPOS A EXTRAIR:
1. DADOS BÁSICOS:
   - chaveAcesso: Chave de acesso de 44 dígitos (geralmente no topo ou código de barras)
   - numeroCte: Número do CT-e
   - serie: Série do documento
   - dataEmissao: Data de emissão (formato YYYY-MM-DD)
   - cfop: Código CFOP
   - modalTransporte: Modal (Rodoviário, Aéreo, etc)

2. ORIGEM E DESTINO:
   - origem: Cidade/UF de origem
   - destino: Cidade/UF de destino

3. EMITENTE (Transportadora):
   - emitenteNome: Razão Social
   - emitenteCnpj: CNPJ (apenas números)
   - emitenteEndereco: Endereço completo
   - emitenteIe: Inscrição Estadual

4. REMETENTE (Quem envia a carga):
   - remetenteNome: Razão Social
   - remetenteCnpj: CNPJ (apenas números)
   - remetenteEndereco: Endereço completo
   - remetenteIe: Inscrição Estadual

5. DESTINATÁRIO (Quem recebe a carga):
   - destinatarioNome: Razão Social
   - destinatarioCnpj: CNPJ (apenas números)
   - destinatarioEndereco: Endereço completo
   - destinatarioIe: Inscrição Estadual

6. VALORES:
   - valorTotal: Valor total do serviço (número decimal, ex: 1234.56)
   - valorFrete: Valor do frete (número decimal)
   - peso: Peso em kg (número decimal)

7. CARGA:
   - produtoDescricao: Descrição da mercadoria/produto
   - quantidadeCarga: Quantidade de volumes

8. VEÍCULO E MOTORISTA (se disponível):
   - placaVeiculo: Placa do veículo
   - motoristaNome: Nome do motorista
   - motoristaCpf: CPF do motorista (apenas números)

REGRAS IMPORTANTES:
- Use apenas números para CNPJ e CPF (sem pontos, barras ou traços)
- Datas devem estar no formato YYYY-MM-DD
- Valores monetários devem ser números decimais com ponto (ex: 1234.56)
- Se um campo não for encontrado, use null
- Retorne APENAS o JSON, sem markdown

Responda APENAS com um JSON válido contendo os campos extraídos.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia todos os dados deste documento CT-e:'
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
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Entre em contato com o suporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received');
    
    const content = aiResponse.choices?.[0]?.message?.content || '';
    console.log('Raw content:', content);
    
    // Try to parse the JSON response
    let extractedData = null;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanContent);
      console.log('Successfully parsed CTE data:', JSON.stringify(extractedData));
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Não foi possível extrair os dados do PDF. Tente novamente.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in extract-cte-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido ao processar o PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
