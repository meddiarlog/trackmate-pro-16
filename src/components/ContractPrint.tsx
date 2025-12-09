import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CTE {
  cte_number: string;
  issue_date: string;
  cfop?: string;
  cfop_description?: string;
  sender_name?: string;
  sender_cnpj?: string;
  sender_ie?: string;
  sender_address?: string;
  recipient_name?: string;
  recipient_cnpj?: string;
  recipient_ie?: string;
  recipient_address?: string;
  insurance_company?: string;
  insurance_policy?: string;
  driver_name?: string;
  driver_cpf?: string;
  driver_rg?: string;
  driver_rg_issuer?: string;
  driver_license?: string;
  driver_phone?: string;
  driver_cellphone?: string;
  driver_pis?: string;
  driver_city?: string;
  driver_state?: string;
  driver_bank?: string;
  driver_account?: string;
  driver_agency?: string;
  owner_name?: string;
  owner_cpf?: string;
  owner_rg?: string;
  owner_antt?: string;
  owner_pis?: string;
  owner_address?: string;
  vehicle_plate?: string;
  vehicle_rntrc?: string;
  vehicle_renavam?: string;
  vehicle_city?: string;
  vehicle_state?: string;
  vehicle_brand?: string;
  cargo_species?: string;
  cargo_quantity?: number;
  cargo_invoice?: string;
  weight?: number;
  observations?: string;
}

interface FreightComposition {
  freightValue: number;
  stayValue: number;
  tollValue: number;
  advanceValue: number;
  irrfValue: number;
  inssValue: number;
  sestSenatValue: number;
  insuranceValue: number;
  breakageValue: number;
  otherDiscountValue: number;
}

interface CompanySettings {
  razao_social: string;
  cnpj?: string;
  inscricao_estadual?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  logo_url?: string;
}

interface ContractPrintProps {
  contract: {
    contract_number: string;
    created_at: string;
    companies: {
      name: string;
      cnpj?: string;
      address?: string;
      email?: string;
      phone?: string;
    };
  };
  ctes: CTE[];
  freightComposition: FreightComposition;
  companySettings?: CompanySettings;
}

export function ContractPrint({ contract, ctes, freightComposition, companySettings }: ContractPrintProps) {
  // Use first CTE for main data
  const primaryCte: CTE = ctes[0] || {} as CTE;
  
  // Generate N. Doc. from all CTE numbers
  const nDoc = ctes.map(cte => cte.cte_number).join(' / ') || contract.contract_number;
  
  // Calculate freight values
  const totalDeductions = 
    freightComposition.tollValue + 
    freightComposition.advanceValue + 
    freightComposition.irrfValue + 
    freightComposition.inssValue + 
    freightComposition.sestSenatValue + 
    freightComposition.insuranceValue + 
    freightComposition.breakageValue + 
    freightComposition.otherDiscountValue;
  
  const netValue = freightComposition.freightValue + freightComposition.stayValue - totalDeductions;

  // Build full address from company settings
  const companyFullAddress = companySettings ? 
    [companySettings.address, companySettings.neighborhood, companySettings.city, companySettings.state, companySettings.cep]
      .filter(Boolean).join(', ') : 
    contract.companies.address;

  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto print:p-4">
      {/* Header */}
      <div className="border-2 border-black mb-2">
        <div className="grid grid-cols-3 border-b-2 border-black">
          <div className="border-r-2 border-black p-2 flex items-center justify-center">
            {companySettings?.logo_url ? (
              <img 
                src={companySettings.logo_url} 
                alt="Logo" 
                className="max-w-20 max-h-20 object-contain"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-500">LOGO</span>
              </div>
            )}
          </div>
          <div className="border-r-2 border-black p-2 text-xs">
            <div className="font-bold">{companySettings?.razao_social || contract.companies.name}</div>
            <div>CNPJ: {companySettings?.cnpj || contract.companies.cnpj}</div>
            <div>IE: {companySettings?.inscricao_estadual || '-'}</div>
            <div>ENDEREÇO: {companyFullAddress || '-'}</div>
            <div>E-MAIL: {contract.companies.email || '-'}</div>
            <div>FONE: {contract.companies.phone || '-'}</div>
          </div>
          <div className="p-2 text-xs">
            <div className="font-bold">CONTRATO DE SERVIÇO</div>
            <div>N. Doc.: {nDoc}</div>
            <div>Data: {format(new Date(contract.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            <div className="mt-2">
              <svg className="w-full h-8">
                <rect width="100%" height="100%" fill="white" />
                <text x="50%" y="50%" textAnchor="middle" fontSize="6">
                  {nDoc}
                </text>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="p-2 text-center font-bold text-sm border-b-2 border-black">
          CONTRATO DE SERVIÇO DE TRANSPORTE DE CARGAS AUTÔNOMO
        </div>

        {/* CFOP */}
        <div className="p-2 text-xs border-b-2 border-black">
          <div className="font-bold">CFOP - Natureza da Operação:</div>
          <div>
            {primaryCte.cfop && primaryCte.cfop_description 
              ? `${primaryCte.cfop} - ${primaryCte.cfop_description}` 
              : primaryCte.cfop || 'Não informado'}
          </div>
        </div>

        {/* Remetente e Destinatário */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="border-r-2 border-black p-2 text-xs">
            <div><span className="font-bold">Remetente:</span> {primaryCte.sender_name || '-'}</div>
            <div><span className="font-bold">CNPJ:</span> {primaryCte.sender_cnpj || '-'}</div>
            <div><span className="font-bold">Origem:</span> {primaryCte.sender_address || '-'}</div>
          </div>
          <div className="p-2 text-xs">
            <div><span className="font-bold">Destinatário:</span> {primaryCte.recipient_name || '-'}</div>
            <div><span className="font-bold">CNPJ:</span> {primaryCte.recipient_cnpj || '-'}</div>
            <div><span className="font-bold">Destino:</span> {primaryCte.recipient_address || '-'}</div>
          </div>
        </div>

        {/* Seguradora */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="border-r-2 border-black p-2 text-xs">
            <span className="font-bold">Seguradora:</span> {primaryCte.insurance_company || '-'}
          </div>
          <div className="p-2 text-xs">
            <span className="font-bold">Apólice:</span> {primaryCte.insurance_policy || '-'}
          </div>
        </div>

        {/* Motorista e Proprietário */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="border-r-2 border-black p-2 text-xs">
            <div><span className="font-bold">Motorista:</span> {primaryCte.driver_name || '-'}</div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div>CPF: {primaryCte.driver_cpf || '-'}</div>
              <div>RG: {primaryCte.driver_rg || '-'}</div>
              <div>Val. CNH: {primaryCte.driver_license || '-'}</div>
              <div>Pis: {primaryCte.driver_pis || '-'}</div>
              <div>Fone: {primaryCte.driver_phone || '-'}</div>
              <div>Celular: {primaryCte.driver_cellphone || '-'}</div>
              <div className="col-span-2">Cidade/UF: {primaryCte.driver_city || '-'}/{primaryCte.driver_state || '-'}</div>
              <div>Banco: {primaryCte.driver_bank || '-'}</div>
              <div>Agência: {primaryCte.driver_agency || '-'}</div>
              <div className="col-span-2">Conta: {primaryCte.driver_account || '-'}</div>
            </div>
          </div>
          <div className="p-2 text-xs">
            <div><span className="font-bold">Proprietário:</span> {primaryCte.owner_name || '-'}</div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div>CPF: {primaryCte.owner_cpf || '-'}</div>
              <div>RG: {primaryCte.owner_rg || '-'}</div>
              <div>ANTT: {primaryCte.owner_antt || '-'}</div>
              <div>Pis: {primaryCte.owner_pis || '-'}</div>
              <div className="col-span-2">Endereço: {primaryCte.owner_address || '-'}</div>
              <div>Placa: {primaryCte.vehicle_plate || '-'}</div>
              <div>Renavam: {primaryCte.vehicle_renavam || '-'}</div>
              <div>Cidade/UF: {primaryCte.vehicle_city || '-'}/{primaryCte.vehicle_state || '-'}</div>
              <div>Marca: {primaryCte.vehicle_brand || '-'}</div>
            </div>
          </div>
        </div>

        {/* Mercadoria */}
        <div className="p-2 text-xs border-b-2 border-black">
          <div className="grid grid-cols-3 gap-2">
            <div><span className="font-bold">Mercadoria:</span></div>
            <div><span className="font-bold">Espécie:</span> {primaryCte.cargo_species || '-'}</div>
            <div><span className="font-bold">Quantidade:</span> {primaryCte.cargo_quantity || '-'}</div>
            <div><span className="font-bold">Nota Fiscal:</span> {primaryCte.cargo_invoice || '-'}</div>
          </div>
          <div className="mt-1">{primaryCte.cargo_species} {primaryCte.cargo_quantity ? `${primaryCte.cargo_quantity} KG` : ''}</div>
        </div>

        {/* Composição do Frete */}
        <div className="p-2 text-xs">
          <div className="text-center font-bold mb-2">COMPOSIÇÃO DO FRETE MOTORISTA</div>
          <div className="grid grid-cols-2">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Frete Motorista:</span>
                <span>R$ {freightComposition.freightValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Estadia:</span>
                <span>R$ {freightComposition.stayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Pedágio:</span>
                <span>R$ {freightComposition.tollValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Adiantamento:</span>
                <span>R$ {freightComposition.advanceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) I.R.R.F.:</span>
                <span>R$ {freightComposition.irrfValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>(-) INSS:</span>
                <span>R$ {freightComposition.inssValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) SEST/SENAT:</span>
                <span>R$ {freightComposition.sestSenatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Seguro:</span>
                <span>R$ {freightComposition.insuranceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Quebra:</span>
                <span>R$ {freightComposition.breakageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Outros Desconto</span>
                <span>R$ {freightComposition.otherDiscountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black pt-1 mt-1">
                <span>SALDO A RECEBER:</span>
                <span>R$ {netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Importância */}
        <div className="p-2 text-xs border-t-2 border-black">
          <span className="font-bold">Importância:</span> {primaryCte.observations || '-'}
        </div>
      </div>

      {/* Footer */}
      <div className="border-2 border-black p-4 text-center text-xs">
        <div className="font-bold mb-2">
          RECEBI A IMPORTÂNCIA ACIMA CORRESPONDENTE AO TRANSPORTE DAS MERCADORIAS ACIMA DESCRITAS
        </div>
        <div className="font-bold mb-4">
          NO CONTRATO DE TRANSPORTE RODOVIÁRIO DE CARGAS
        </div>
        <div className="flex justify-between mt-8">
          <div className="border-t border-black w-[45%] pt-2">
            {companySettings?.razao_social || contract.companies.name}
          </div>
          <div className="border-t border-black w-[45%] pt-2">
            {primaryCte.driver_name || '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
