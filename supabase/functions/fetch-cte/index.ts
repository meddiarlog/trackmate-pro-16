import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { chaveAcesso } = await req.json();
    
    if (!chaveAcesso) {
      return new Response(
        JSON.stringify({ error: 'Chave de acesso é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove espaços e caracteres não numéricos
    const cleanedKey = chaveAcesso.replace(/\D/g, '');
    
    if (cleanedKey.length !== 44) {
      return new Response(
        JSON.stringify({ error: 'Chave de acesso inválida. Deve conter 44 dígitos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair informações da chave de acesso do CT-e (formato similar ao NF-e)
    const uf = cleanedKey.substring(0, 2);
    const aamm = cleanedKey.substring(2, 6);
    const cnpj = cleanedKey.substring(6, 20);
    const modelo = cleanedKey.substring(20, 22);
    const serie = cleanedKey.substring(22, 25);
    const numero = cleanedKey.substring(25, 34);

    // Mapeamento de códigos UF para siglas
    const ufMap: { [key: string]: string } = {
      '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA',
      '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
      '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE',
      '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
      '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT',
      '52': 'GO', '53': 'DF'
    };

    const ufSigla = ufMap[uf] || 'Desconhecido';
    const ano = '20' + aamm.substring(0, 2);
    const mes = aamm.substring(2, 4);
    const dataEmissao = `${ano}-${mes}-01`;

    // Buscar razão social via BrasilAPI
    let razaoSocial = '';
    try {
      const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (brasilApiResponse.ok) {
        const brasilApiData = await brasilApiResponse.json();
        razaoSocial = brasilApiData.razao_social || '';
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ na BrasilAPI:', error);
    }

    return new Response(
      JSON.stringify({
        chaveAcesso: cleanedKey,
        uf: ufSigla,
        dataEmissao,
        cnpjEmitente: cnpj,
        razaoSocial,
        modelo,
        serie,
        numeroCte: numero,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar chave de acesso:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar chave de acesso' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
