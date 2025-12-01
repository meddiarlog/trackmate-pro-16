import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { chaveAcesso } = await req.json();
    
    console.log('Chave recebida (original):', chaveAcesso);
    console.log('Tamanho da chave original:', chaveAcesso?.length);
    
    if (!chaveAcesso) {
      return new Response(
        JSON.stringify({ error: "Chave de acesso não fornecida" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Limpar a chave de acesso (remover espaços e caracteres especiais)
    const chaveClean = chaveAcesso.replace(/\D/g, '');
    
    console.log('Chave limpa:', chaveClean);
    console.log('Tamanho da chave limpa:', chaveClean.length);
    
    if (chaveClean.length !== 44) {
      return new Response(
        JSON.stringify({ 
          error: `Chave de acesso inválida. Deve conter 44 dígitos, mas foram recebidos ${chaveClean.length} dígitos.`,
          chaveRecebida: chaveClean,
          tamanho: chaveClean.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Buscando dados da NF-e com chave:', chaveClean);

    // Extrair informações da chave de acesso
    // Formato da chave: UF + AAMM + CNPJ + Modelo + Série + Número + Forma Emissão + Código + DV
    const uf = chaveClean.substring(0, 2);
    const aamm = chaveClean.substring(2, 6);
    const cnpj = chaveClean.substring(6, 20);
    const modelo = chaveClean.substring(20, 22);
    const serie = chaveClean.substring(22, 25);
    const numero = chaveClean.substring(25, 34);

    // Converter AAMM para data
    const ano = '20' + aamm.substring(0, 2);
    const mes = aamm.substring(2, 4);
    const dataEmissao = `${ano}-${mes}-01`;

    // Tentar buscar dados do CNPJ usando a BrasilAPI
    let razaoSocial = '';
    try {
      const cnpjResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (cnpjResponse.ok) {
        const cnpjData = await cnpjResponse.json();
        razaoSocial = cnpjData.razao_social || cnpjData.nome_fantasia || '';
        console.log('Dados do CNPJ encontrados:', razaoSocial);
      }
    } catch (error) {
      console.log('Erro ao buscar CNPJ:', error);
    }

    // Mapear código UF para sigla
    const ufMap: { [key: string]: string } = {
      '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA',
      '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
      '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE',
      '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
      '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT',
      '52': 'GO', '53': 'DF'
    };

    const ufSigla = ufMap[uf] || 'XX';

    return new Response(
      JSON.stringify({
        chave_acesso: chaveClean,
        cnpj_emitente: cnpj,
        razao_social: razaoSocial,
        data_emissao: dataEmissao,
        numero_nfe: numero,
        uf: ufSigla,
        modelo: modelo,
        serie: serie
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao buscar dados da NF-e" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
