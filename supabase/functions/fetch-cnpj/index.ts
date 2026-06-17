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

    // Try BrasilAPI first
    let data: any = null;
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (response.ok) {
        data = await response.json();
      } else {
        console.log('BrasilAPI miss, trying ReceitaWS...');
      }
    } catch (e) {
      console.log('BrasilAPI error, trying ReceitaWS...', e);
    }

    // Fallback: ReceitaWS
    if (!data) {
      const rwsResp = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`);
      if (rwsResp.ok) {
        const rws = await rwsResp.json();
        if (rws && rws.status !== 'ERROR' && (rws.nome || rws.razao_social)) {
          data = {
            razao_social: rws.nome,
            nome_fantasia: rws.fantasia,
            cnpj: rws.cnpj,
            email: rws.email,
            ddd_telefone_1: rws.telefone,
            logradouro: rws.logradouro,
            numero: rws.numero,
            bairro: rws.bairro,
            municipio: rws.municipio,
            uf: rws.uf,
            cep: rws.cep,
          };
        }
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'CNPJ não encontrado. Verifique o número ou preencha manualmente.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map response to our format with separate fields
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
