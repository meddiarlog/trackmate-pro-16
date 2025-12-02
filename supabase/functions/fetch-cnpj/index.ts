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
    const { cnpj } = await req.json();
    
    if (!cnpj) {
      throw new Error('CNPJ é obrigatório');
    }

    // Remove special characters from CNPJ
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');

    // Validate CNPJ format (must be 14 digits)
    if (cleanCnpj.length !== 14) {
      throw new Error('CNPJ inválido. Deve conter 14 dígitos. CPF não é suportado.');
    }

    console.log('Fetching CNPJ data for:', cleanCnpj);

    // Try BrasilAPI first (more reliable and free)
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    
    if (!response.ok) {
      throw new Error('CNPJ não encontrado na base de dados');
    }

    const data = await response.json();

    // Map BrasilAPI response to our format with separate fields
    const companyData = {
      name: data.razao_social || data.nome_fantasia,
      cnpj: data.cnpj,
      email: data.email || '',
      phone: data.ddd_telefone_1 || '',
      address: data.logradouro ? `${data.logradouro}${data.numero ? ', ' + data.numero : ''}` : '',
      neighborhood: data.bairro || '',
      city: data.municipio || '',
      state: data.uf || '',
      cep: data.cep || '',
    };

    return new Response(JSON.stringify(companyData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching CNPJ:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao buscar dados do CNPJ' }), 
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
