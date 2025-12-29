import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get text content from XML element
function getElementText(doc: Document, tagName: string, parentElement?: Element): string {
  const parent = parentElement || doc;
  const element = parent.getElementsByTagName(tagName)[0];
  return element?.textContent?.trim() || '';
}

// Helper function to format date from XML
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // XML date format: 2024-01-15T10:30:00-03:00
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return dateStr;
}

// Parse CT-e XML and extract relevant data
function parseCteXml(xmlContent: string): Record<string, any> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parseError = doc.getElementsByTagName('parsererror')[0];
  if (parseError) {
    throw new Error('XML inválido ou malformado');
  }

  // Get the root CT-e element (can be CTe or cteProc)
  let infCte = doc.getElementsByTagName('infCte')[0];
  if (!infCte) {
    throw new Error('Elemento infCte não encontrado no XML');
  }

  // Get chave de acesso from Id attribute
  const chaveAcesso = infCte.getAttribute('Id')?.replace('CTe', '') || '';
  
  // IDE - Identificação do CT-e
  const ide = doc.getElementsByTagName('ide')[0];
  const nCT = getElementText(doc, 'nCT', ide);
  const serie = getElementText(doc, 'serie', ide);
  const dhEmi = getElementText(doc, 'dhEmi', ide);
  const CFOP = getElementText(doc, 'CFOP', ide);
  const xMunIni = getElementText(doc, 'xMunIni', ide);
  const UFIni = getElementText(doc, 'UFIni', ide);
  const xMunFim = getElementText(doc, 'xMunFim', ide);
  const UFFim = getElementText(doc, 'UFFim', ide);
  const modal = getElementText(doc, 'modal', ide);

  // Modal descriptions
  const modalDescriptions: Record<string, string> = {
    '01': 'Rodoviário',
    '02': 'Aéreo',
    '03': 'Aquaviário',
    '04': 'Ferroviário',
    '05': 'Dutoviário',
    '06': 'Multimodal',
  };

  // vPrest - Valores da Prestação
  const vPrest = doc.getElementsByTagName('vPrest')[0];
  const vTPrest = parseFloat(getElementText(doc, 'vTPrest', vPrest)) || 0;
  const vRec = parseFloat(getElementText(doc, 'vRec', vPrest)) || 0;

  // infCarga - Informações da Carga
  const infCarga = doc.getElementsByTagName('infCarga')[0];
  const vCarga = parseFloat(getElementText(doc, 'vCarga', infCarga)) || 0;
  const proPred = getElementText(doc, 'proPred', infCarga);
  
  // Get weight from infQ
  let peso = 0;
  const infQs = infCarga?.getElementsByTagName('infQ') || [];
  for (let i = 0; i < infQs.length; i++) {
    const cUnid = getElementText(doc, 'cUnid', infQs[i]);
    const qCarga = parseFloat(getElementText(doc, 'qCarga', infQs[i])) || 0;
    // cUnid: 00 = M3, 01 = KG, 02 = TON, 03 = UNIDADE, 04 = LITROS, 05 = MMBTU
    if (cUnid === '01') {
      peso = qCarga;
    } else if (cUnid === '02') {
      peso = qCarga * 1000; // Convert tons to kg
    }
  }

  // emit - Emitente (Transportadora)
  const emit = doc.getElementsByTagName('emit')[0];
  const emitCNPJ = getElementText(doc, 'CNPJ', emit);
  const emitxNome = getElementText(doc, 'xNome', emit);
  const emitIE = getElementText(doc, 'IE', emit);
  const enderEmit = emit?.getElementsByTagName('enderEmit')[0];
  const emitxLgr = getElementText(doc, 'xLgr', enderEmit);
  const emitnro = getElementText(doc, 'nro', enderEmit);
  const emitxBairro = getElementText(doc, 'xBairro', enderEmit);
  const emitxMun = getElementText(doc, 'xMun', enderEmit);
  const emitUF = getElementText(doc, 'UF', enderEmit);
  const emitEndereco = [emitxLgr, emitnro, emitxBairro, emitxMun, emitUF].filter(Boolean).join(', ');

  // rem - Remetente
  const rem = doc.getElementsByTagName('rem')[0];
  const remCNPJ = getElementText(doc, 'CNPJ', rem) || getElementText(doc, 'CPF', rem);
  const remxNome = getElementText(doc, 'xNome', rem);
  const remIE = getElementText(doc, 'IE', rem);
  const enderRem = rem?.getElementsByTagName('enderReme')[0];
  const remxLgr = getElementText(doc, 'xLgr', enderRem);
  const remnro = getElementText(doc, 'nro', enderRem);
  const remxBairro = getElementText(doc, 'xBairro', enderRem);
  const remxMun = getElementText(doc, 'xMun', enderRem);
  const remUF = getElementText(doc, 'UF', enderRem);
  const remEndereco = [remxLgr, remnro, remxBairro, remxMun, remUF].filter(Boolean).join(', ');

  // dest - Destinatário
  const dest = doc.getElementsByTagName('dest')[0];
  const destCNPJ = getElementText(doc, 'CNPJ', dest) || getElementText(doc, 'CPF', dest);
  const destxNome = getElementText(doc, 'xNome', dest);
  const destIE = getElementText(doc, 'IE', dest);
  const enderDest = dest?.getElementsByTagName('enderDest')[0];
  const destxLgr = getElementText(doc, 'xLgr', enderDest);
  const destnro = getElementText(doc, 'nro', enderDest);
  const destxBairro = getElementText(doc, 'xBairro', enderDest);
  const destxMun = getElementText(doc, 'xMun', enderDest);
  const destUF = getElementText(doc, 'UF', enderDest);
  const destEndereco = [destxLgr, destnro, destxBairro, destxMun, destUF].filter(Boolean).join(', ');

  // infModal - modal specific info (for rodoviário)
  const infModal = doc.getElementsByTagName('infModal')[0];
  const rodo = infModal?.getElementsByTagName('rodo')[0];
  
  // veic - Veículo
  let veicPlaca = '';
  const veicProp = rodo?.getElementsByTagName('veic')[0];
  if (veicProp) {
    veicPlaca = getElementText(doc, 'placa', veicProp);
  }

  // motorista info
  let motNome = '';
  let motCPF = '';
  const moto = rodo?.getElementsByTagName('moto')[0];
  if (moto) {
    motNome = getElementText(doc, 'xNome', moto);
    motCPF = getElementText(doc, 'CPF', moto);
  }

  // infDoc - Documentos de carga (Notas Fiscais)
  const infDoc = doc.getElementsByTagName('infDoc')[0];
  const infNFes = infDoc?.getElementsByTagName('infNFe') || [];
  const notasFiscais: string[] = [];
  for (let i = 0; i < infNFes.length; i++) {
    const chave = getElementText(doc, 'chave', infNFes[i]);
    if (chave) {
      notasFiscais.push(chave);
    }
  }

  return {
    chaveAcesso,
    numeroCte: nCT,
    serie,
    dataEmissao: formatDate(dhEmi),
    cfop: CFOP,
    origem: `${xMunIni}/${UFIni}`,
    destino: `${xMunFim}/${UFFim}`,
    modal: modalDescriptions[modal] || modal,
    valorTotal: vTPrest,
    valorRecebido: vRec,
    valorCarga: vCarga,
    peso,
    produtoDescricao: proPred,
    emitente: {
      cnpj: emitCNPJ,
      nome: emitxNome,
      ie: emitIE,
      endereco: emitEndereco,
    },
    remetente: {
      cnpj: remCNPJ,
      nome: remxNome,
      ie: remIE,
      endereco: remEndereco,
    },
    destinatario: {
      cnpj: destCNPJ,
      nome: destxNome,
      ie: destIE,
      endereco: destEndereco,
    },
    motorista: {
      nome: motNome,
      cpf: motCPF,
    },
    veiculo: {
      placa: veicPlaca,
    },
    notasFiscais,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let xmlContent = '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: 'Nenhum arquivo enviado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!file.name.toLowerCase().endsWith('.xml')) {
        return new Response(
          JSON.stringify({ error: 'O arquivo deve ser um XML de CT-e' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      xmlContent = await file.text();
    } else {
      // Handle raw XML body
      const body = await req.json();
      xmlContent = body.xml;
    }

    if (!xmlContent) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo XML não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing CT-e XML...');
    const parsedData = parseCteXml(xmlContent);
    console.log('CT-e parsed successfully:', parsedData.numeroCte);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: parsedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing CT-e XML:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao processar XML do CT-e' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
