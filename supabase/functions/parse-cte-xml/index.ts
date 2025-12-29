import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { parse } from "https://deno.land/x/xml@5.4.13/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to safely get nested value
function getNestedValue(obj: any, ...keys: string[]): any {
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

// Helper function to get text from XML element
function getText(element: any): string {
  if (element === null || element === undefined) return '';
  if (typeof element === 'string') return element.trim();
  if (typeof element === 'number') return String(element);
  if (element['#text'] !== undefined) return String(element['#text']).trim();
  return '';
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
  const doc = parse(xmlContent);

  if (!doc) {
    throw new Error('XML inválido ou malformado');
  }

  // Navigate to the CT-e data - handle both cteProc and CTe root elements
  let cte = getNestedValue(doc, 'cteProc', 'CTe') || getNestedValue(doc, 'CTe') || doc['cteProc']?.['CTe'] || doc['CTe'];
  
  if (!cte) {
    // Try alternative structure
    const root = Object.keys(doc)[0];
    if (root) {
      cte = getNestedValue(doc, root, 'CTe') || doc[root];
    }
  }

  if (!cte) {
    throw new Error('Elemento CTe não encontrado no XML');
  }

  const infCte = getNestedValue(cte, 'infCte') || cte['infCte'];
  if (!infCte) {
    throw new Error('Elemento infCte não encontrado no XML');
  }

  // Get chave de acesso from @Id attribute
  const chaveAcesso = (infCte['@Id'] || '').replace('CTe', '');
  
  // IDE - Identificação do CT-e
  const ide = infCte['ide'] || {};
  const nCT = getText(ide['nCT']);
  const serie = getText(ide['serie']);
  const dhEmi = getText(ide['dhEmi']);
  const CFOP = getText(ide['CFOP']);
  const xMunIni = getText(ide['xMunIni']);
  const UFIni = getText(ide['UFIni']);
  const xMunFim = getText(ide['xMunFim']);
  const UFFim = getText(ide['UFFim']);
  const modal = getText(ide['modal']);

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
  const vPrest = infCte['vPrest'] || {};
  const vTPrest = parseFloat(getText(vPrest['vTPrest'])) || 0;
  const vRec = parseFloat(getText(vPrest['vRec'])) || 0;

  // infCarga - Informações da Carga
  const infCarga = infCte['infCarga'] || {};
  const vCarga = parseFloat(getText(infCarga['vCarga'])) || 0;
  const proPred = getText(infCarga['proPred']);
  
  // Get weight from infQ
  let peso = 0;
  const infQs = infCarga['infQ'];
  if (infQs) {
    const infQArray = Array.isArray(infQs) ? infQs : [infQs];
    for (const infQ of infQArray) {
      const cUnid = getText(infQ['cUnid']);
      const qCarga = parseFloat(getText(infQ['qCarga'])) || 0;
      // cUnid: 00 = M3, 01 = KG, 02 = TON, 03 = UNIDADE, 04 = LITROS, 05 = MMBTU
      if (cUnid === '01') {
        peso = qCarga;
      } else if (cUnid === '02') {
        peso = qCarga * 1000; // Convert tons to kg
      }
    }
  }

  // emit - Emitente (Transportadora)
  const emit = infCte['emit'] || {};
  const emitCNPJ = getText(emit['CNPJ']);
  const emitxNome = getText(emit['xNome']);
  const emitIE = getText(emit['IE']);
  const enderEmit = emit['enderEmit'] || {};
  const emitxLgr = getText(enderEmit['xLgr']);
  const emitnro = getText(enderEmit['nro']);
  const emitxBairro = getText(enderEmit['xBairro']);
  const emitxMun = getText(enderEmit['xMun']);
  const emitUF = getText(enderEmit['UF']);
  const emitEndereco = [emitxLgr, emitnro, emitxBairro, emitxMun, emitUF].filter(Boolean).join(', ');

  // rem - Remetente
  const rem = infCte['rem'] || {};
  const remCNPJ = getText(rem['CNPJ']) || getText(rem['CPF']);
  const remxNome = getText(rem['xNome']);
  const remIE = getText(rem['IE']);
  const enderRem = rem['enderReme'] || {};
  const remxLgr = getText(enderRem['xLgr']);
  const remnro = getText(enderRem['nro']);
  const remxBairro = getText(enderRem['xBairro']);
  const remxMun = getText(enderRem['xMun']);
  const remUF = getText(enderRem['UF']);
  const remEndereco = [remxLgr, remnro, remxBairro, remxMun, remUF].filter(Boolean).join(', ');

  // dest - Destinatário
  const dest = infCte['dest'] || {};
  const destCNPJ = getText(dest['CNPJ']) || getText(dest['CPF']);
  const destxNome = getText(dest['xNome']);
  const destIE = getText(dest['IE']);
  const enderDest = dest['enderDest'] || {};
  const destxLgr = getText(enderDest['xLgr']);
  const destnro = getText(enderDest['nro']);
  const destxBairro = getText(enderDest['xBairro']);
  const destxMun = getText(enderDest['xMun']);
  const destUF = getText(enderDest['UF']);
  const destEndereco = [destxLgr, destnro, destxBairro, destxMun, destUF].filter(Boolean).join(', ');

  // infModal - modal specific info (for rodoviário)
  const infModal = infCte['infModal'] || {};
  const rodo = infModal['rodo'] || {};
  
  // veic - Veículo
  let veicPlaca = '';
  const veic = rodo['veic'];
  if (veic) {
    const veicArray = Array.isArray(veic) ? veic : [veic];
    if (veicArray.length > 0) {
      veicPlaca = getText(veicArray[0]['placa']);
    }
  }

  // motorista info
  let motNome = '';
  let motCPF = '';
  const moto = rodo['moto'];
  if (moto) {
    const motoArray = Array.isArray(moto) ? moto : [moto];
    if (motoArray.length > 0) {
      motNome = getText(motoArray[0]['xNome']);
      motCPF = getText(motoArray[0]['CPF']);
    }
  }

  // infDoc - Documentos de carga (Notas Fiscais)
  const infDoc = infCte['infDoc'] || {};
  const infNFes = infDoc['infNFe'];
  const notasFiscais: string[] = [];
  if (infNFes) {
    const nfArray = Array.isArray(infNFes) ? infNFes : [infNFes];
    for (const nf of nfArray) {
      const chave = getText(nf['chave']);
      if (chave) {
        notasFiscais.push(chave);
      }
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
