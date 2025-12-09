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

    console.log('Processando chave de acesso do CT-e:', cleanedKey);

    // Extrair informações da chave de acesso do CT-e
    // Formato: UF(2) + AAMM(4) + CNPJ(14) + MOD(2) + SERIE(3) + NUMERO(9) + TPEMI(1) + COD(8) + DV(1)
    const uf = cleanedKey.substring(0, 2);
    const aamm = cleanedKey.substring(2, 6);
    const cnpjEmitente = cleanedKey.substring(6, 20);
    const modelo = cleanedKey.substring(20, 22);
    const serie = cleanedKey.substring(22, 25);
    const numero = cleanedKey.substring(25, 34);
    const tipoEmissao = cleanedKey.substring(34, 35);
    const codigoNumerico = cleanedKey.substring(35, 43);
    const digitoVerificador = cleanedKey.substring(43, 44);

    // Mapeamento de códigos UF para siglas
    const ufMap: { [key: string]: string } = {
      '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA',
      '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
      '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE',
      '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
      '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT',
      '52': 'GO', '53': 'DF'
    };

    // Mapeamento de modal de transporte
    const modalMap: { [key: string]: string } = {
      '01': 'Rodoviário',
      '02': 'Aéreo',
      '03': 'Aquaviário',
      '04': 'Ferroviário',
      '05': 'Dutoviário',
      '06': 'Multimodal'
    };

    const ufSigla = ufMap[uf] || 'Desconhecido';
    const ano = '20' + aamm.substring(0, 2);
    const mes = aamm.substring(2, 4);
    const dataEmissao = `${ano}-${mes}-01`;

    // Remover zeros à esquerda do número do CT-e para exibição
    const numeroCte = numero.replace(/^0+/, '') || '0';
    const serieFormatada = serie.replace(/^0+/, '') || '0';

    // Buscar dados do emitente via BrasilAPI
    let razaoSocialEmitente = '';
    let enderecoEmitente = '';
    let municipioEmitente = '';
    let ufEmitente = '';

    try {
      console.log('Buscando dados do emitente CNPJ:', cnpjEmitente);
      const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjEmitente}`);
      if (brasilApiResponse.ok) {
        const brasilApiData = await brasilApiResponse.json();
        razaoSocialEmitente = brasilApiData.razao_social || '';
        enderecoEmitente = `${brasilApiData.logradouro || ''}, ${brasilApiData.numero || 'S/N'}`.trim();
        municipioEmitente = brasilApiData.municipio || '';
        ufEmitente = brasilApiData.uf || ufSigla;
        console.log('Dados do emitente encontrados:', razaoSocialEmitente);
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ do emitente na BrasilAPI:', error);
    }

    const response = {
      chaveAcesso: cleanedKey,
      uf: ufSigla,
      dataEmissao,
      cnpjEmitente,
      razaoSocialEmitente,
      enderecoEmitente,
      municipioEmitente,
      ufEmitente,
      modelo,
      serie: serieFormatada,
      numeroCte,
      tipoEmissao,
      codigoNumerico,
      digitoVerificador,
      // Modal baseado no modelo (57 = CT-e, pode ser rodoviário por padrão)
      modalTransporte: modelo === '57' ? 'Rodoviário' : modalMap[modelo] || 'Rodoviário',
      // Origem será a UF do emitente
      origem: municipioEmitente ? `${municipioEmitente}/${ufEmitente}` : ufSigla,
    };

    console.log('Dados extraídos da chave de acesso:', JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
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
