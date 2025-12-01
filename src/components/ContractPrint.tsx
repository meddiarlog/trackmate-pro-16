import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  cte: {
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
    freight_value?: number;
    toll_value?: number;
    advance_value?: number;
    insurance_value?: number;
    inss_value?: number;
    sest_senat_value?: number;
    other_discount_value?: number;
    breakage_value?: number;
    net_value?: number;
    observations?: string;
  };
}

export function ContractPrint({ contract, cte }: ContractPrintProps) {
  const totalFreight = (cte.freight_value || 0);
  const totalDeductions = 
    (cte.toll_value || 0) + 
    (cte.advance_value || 0) + 
    (cte.insurance_value || 0) + 
    (cte.inss_value || 0) + 
    (cte.sest_senat_value || 0) + 
    (cte.other_discount_value || 0) + 
    (cte.breakage_value || 0);
  const netValue = totalFreight - totalDeductions;

  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto print:p-4">
      {/* Header */}
      <div className="border-2 border-black mb-2">
        <div className="grid grid-cols-3 border-b-2 border-black">
          <div className="border-r-2 border-black p-2 flex items-center justify-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <span className="text-xs">LOGO</span>
            </div>
          </div>
          <div className="border-r-2 border-black p-2 text-xs">
            <div className="font-bold">{contract.companies.name}</div>
            <div>CNPJ: {contract.companies.cnpj}</div>
            <div>IE: {contract.companies.cnpj ? '22191314' : '-'}</div>
            <div>ENDEREÇO: {contract.companies.address || '-'}</div>
            <div>E-MAIL: {contract.companies.email || '-'}</div>
            <div>FONE: {contract.companies.phone || '-'}</div>
          </div>
          <div className="p-2 text-xs">
            <div className="font-bold">CONTRATO DE SERVIÇO</div>
            <div>N. Doc.: {contract.contract_number}</div>
            <div>Data: {format(new Date(contract.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            <div className="mt-2">
              <svg className="w-full h-8">
                <rect width="100%" height="100%" fill="white" />
                <text x="50%" y="50%" textAnchor="middle" fontSize="6">
                  {contract.contract_number}
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
          <div>{cte.cfop} - {cte.cfop_description}</div>
        </div>

        {/* Remetente e Destinatário */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="border-r-2 border-black p-2 text-xs">
            <div><span className="font-bold">Remetente:</span> {cte.sender_name}</div>
            <div><span className="font-bold">CNPJ:</span> {cte.sender_cnpj}</div>
            <div><span className="font-bold">Origem:</span> {cte.sender_address}</div>
          </div>
          <div className="p-2 text-xs">
            <div><span className="font-bold">Destinatário:</span> {cte.recipient_name}</div>
            <div><span className="font-bold">CNPJ:</span> {cte.recipient_cnpj}</div>
            <div><span className="font-bold">Destino:</span> {cte.recipient_address}</div>
          </div>
        </div>

        {/* Seguradora */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="border-r-2 border-black p-2 text-xs">
            <span className="font-bold">Seguradora:</span> {cte.insurance_company}
          </div>
          <div className="p-2 text-xs">
            <span className="font-bold">Apólice:</span> {cte.insurance_policy}
          </div>
        </div>

        {/* Motorista e Proprietário */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="border-r-2 border-black p-2 text-xs">
            <div><span className="font-bold">Motorista:</span> {cte.driver_name}</div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div>CPF: {cte.driver_cpf}</div>
              <div>RG: {cte.driver_rg}</div>
              <div>Val. CNH: {cte.driver_license}</div>
              <div>Pis: {cte.driver_pis}</div>
              <div>Fone: {cte.driver_phone}</div>
              <div>Celular: {cte.driver_cellphone}</div>
              <div className="col-span-2">Cidade/UF: {cte.driver_city}/{cte.driver_state}</div>
              <div>Banco: {cte.driver_bank}</div>
              <div>Agência: {cte.driver_agency}</div>
              <div className="col-span-2">Conta: {cte.driver_account}</div>
            </div>
          </div>
          <div className="p-2 text-xs">
            <div><span className="font-bold">Proprietário:</span> {cte.owner_name}</div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div>CPF: {cte.owner_cpf}</div>
              <div>RG: {cte.owner_rg}</div>
              <div>ANTT: {cte.owner_antt}</div>
              <div>Pis: {cte.owner_pis}</div>
              <div className="col-span-2">Endereço: {cte.owner_address}</div>
              <div>Placa: {cte.vehicle_plate}</div>
              <div>Renavam: {cte.vehicle_renavam}</div>
              <div>Cidade/UF: {cte.vehicle_city}/{cte.vehicle_state}</div>
              <div>Marca: {cte.vehicle_brand}</div>
            </div>
          </div>
        </div>

        {/* Mercadoria */}
        <div className="p-2 text-xs border-b-2 border-black">
          <div className="grid grid-cols-3 gap-2">
            <div><span className="font-bold">Mercadoria:</span></div>
            <div><span className="font-bold">Espécie:</span> {cte.cargo_species}</div>
            <div><span className="font-bold">Quantidade:</span> {cte.cargo_quantity}</div>
            <div><span className="font-bold">Nota Fiscal:</span> {cte.cargo_invoice}</div>
          </div>
          <div className="mt-1">{cte.cargo_species} {cte.cargo_quantity ? `${cte.cargo_quantity} KG` : ''}</div>
        </div>

        {/* Composição do Frete */}
        <div className="p-2 text-xs">
          <div className="text-center font-bold mb-2">COMPOSIÇÃO DO FRETE MOTORISTA</div>
          <div className="grid grid-cols-2">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Frete Motorista:</span>
                <span>R$ {(cte.freight_value || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estadia:</span>
                <span>R$ 0,00</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Pedágio:</span>
                <span>R$ {(cte.toll_value || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Adiantamento:</span>
                <span>R$ {(cte.advance_value || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) I.R.R.F.:</span>
                <span>R$ {(cte.insurance_value || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>(-) INSS:</span>
                <span>R$ {(cte.inss_value || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) SEST/SENAT:</span>
                <span>R$ {(cte.sest_senat_value || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Seguro:</span>
                <span>R$ 0,00</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Quebra:</span>
                <span>R$ {(cte.breakage_value || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Outros Desconto</span>
                <span>R$ {(cte.other_discount_value || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black pt-1 mt-1">
                <span>SALDO A RECEBER:</span>
                <span>R$ {netValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Importância */}
        <div className="p-2 text-xs border-t-2 border-black">
          <span className="font-bold">Importância:</span> {cte.observations || 'Um mil e vinte e seis reais.'}
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
            {contract.companies.name}
          </div>
          <div className="border-t border-black w-[45%] pt-2">
            {cte.driver_name}
          </div>
        </div>
      </div>
    </div>
  );
}