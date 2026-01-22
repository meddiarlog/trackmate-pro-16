import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Quote {
  id: string;
  quote_number: number;
  customer_id: string | null;
  responsavel: string | null;
  contato: string | null;
  service_type: string;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  product_id: string | null;
  freight_value: number;
  munck_value: number;
  vehicle_type_id: string | null;
  body_type_id?: string | null;
  delivery_days: number;
  quote_validity_days?: number;
  payment_term_days?: number;
  observations: string | null;
  payment_method: string | null;
  status: string;
  created_at: string;
  customer?: { name: string; cpf_cnpj: string | null } | null;
  product?: { name: string } | null;
  vehicle_type?: { name: string } | null;
  body_type?: { name: string } | null;
}

interface CompanySettings {
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  logo_url: string | null;
}

interface QuotePrintViewProps {
  quote: Quote;
  companySettings: CompanySettings | null | undefined;
}

export function QuotePrintView({ quote, companySettings }: QuotePrintViewProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatCnpj = (value: string | null) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length === 14) {
      return digits.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }
    return value;
  };

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case "pix":
        return "PIX";
      case "boleto":
        return "Boleto";
      case "transferencia":
        return "Transferência Bancária";
      case "80_saldo":
        return "80% + SALDO";
      case "a_combinar":
        return "A Combinar";
      default:
        return method || "-";
    }
  };

  return (
    <div className="print-container p-6 bg-white text-black">
      {/* Header */}
      <div className="header flex items-center gap-6 mb-8 pb-6 border-b-2 border-black">
        {companySettings?.logo_url && (
          <img
            src={companySettings.logo_url}
            alt="Logo"
            className="logo max-w-[150px] max-h-[80px] object-contain"
          />
        )}
        <div className="company-info flex-1">
          <div className="company-name text-xl font-bold">
            {companySettings?.nome_fantasia || companySettings?.razao_social || ""}
          </div>
          <div className="company-details text-sm text-gray-600 mt-1">
            {companySettings?.cnpj && (
              <div>CNPJ: {formatCnpj(companySettings.cnpj)}</div>
            )}
            {companySettings?.inscricao_estadual && (
              <div>IE: {companySettings.inscricao_estadual}</div>
            )}
            {companySettings?.address && (
              <div>
                {companySettings.address}
                {companySettings.neighborhood && `, ${companySettings.neighborhood}`}
                {companySettings.city && ` - ${companySettings.city}`}
                {companySettings.state && `/${companySettings.state}`}
                {companySettings.cep && ` - CEP: ${companySettings.cep}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="title text-2xl font-bold text-center my-8">
        PROPOSTA COMERCIAL
      </h1>

      {/* Quote Number */}
      <div className="quote-number text-right text-sm mb-6">
        Proposta Nº: <strong>{quote.quote_number}</strong>
      </div>

      {/* Cliente Section */}
      <div className="section mb-6">
        <div className="section-title font-bold text-sm mb-3 border-b pb-2">
          DADOS DO CLIENTE
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Cliente:</span>
          <span className="field-value flex-1 text-sm">
            {quote.customer?.name || "-"}
          </span>
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">CNPJ:</span>
          <span className="field-value flex-1 text-sm">
            {formatCnpj(quote.customer?.cpf_cnpj || "") || "-"}
          </span>
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Responsável:</span>
          <span className="field-value flex-1 text-sm">
            {quote.responsavel || "-"}
          </span>
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Contato:</span>
          <span className="field-value flex-1 text-sm">
            {quote.contato || "-"}
          </span>
        </div>
      </div>

      {/* Serviço Section */}
      <div className="section mb-6">
        <div className="section-title font-bold text-sm mb-3 border-b pb-2">
          DETALHES DO SERVIÇO
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Tipo de Serviço:</span>
          <span className="field-value flex-1 text-sm capitalize">
            {quote.service_type}
          </span>
        </div>
        {quote.origin_city && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Origem:</span>
            <span className="field-value flex-1 text-sm">
              {quote.origin_city}/{quote.origin_state}
            </span>
          </div>
        )}
        {quote.destination_city && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Destino:</span>
            <span className="field-value flex-1 text-sm">
              {quote.destination_city}/{quote.destination_state}
            </span>
          </div>
        )}
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Produto:</span>
          <span className="field-value flex-1 text-sm">
            {quote.product?.name || "-"}
          </span>
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Tipo de Veículo:</span>
          <span className="field-value flex-1 text-sm">
            {quote.vehicle_type?.name || "-"}
          </span>
        </div>
        {quote.body_type?.name && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Tipo de Carroceria:</span>
            <span className="field-value flex-1 text-sm">
              {quote.body_type.name}
            </span>
          </div>
        )}
      </div>

      {/* Valores Section */}
      <div className="section mb-6">
        <div className="section-title font-bold text-sm mb-3 border-b pb-2">
          VALORES
        </div>
        {(quote.freight_value || 0) > 0 && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">
              Valor Frete Carreta:
            </span>
            <span className="field-value flex-1 text-sm">
              {formatCurrency(quote.freight_value || 0)}
            </span>
          </div>
        )}
        {(quote.munck_value || 0) > 0 && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">
              Valor Serviço Munck:
            </span>
            <span className="field-value flex-1 text-sm">
              {formatCurrency(quote.munck_value || 0)}
            </span>
          </div>
        )}
        <div className="field flex mb-2 pt-2 border-t">
          <span className="field-label font-bold w-48 text-sm">VALOR TOTAL:</span>
          <span className="field-value flex-1 text-sm font-bold">
            {formatCurrency(
              (quote.freight_value || 0) + (quote.munck_value || 0)
            )}
          </span>
        </div>
      </div>

      {/* Condições da Proposta Section */}
      <div className="section mb-6">
        <div className="section-title font-bold text-sm mb-3 border-b pb-2">
          CONDIÇÕES DA PROPOSTA
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Validade da Proposta:</span>
          <span className="field-value flex-1 text-sm">
            {quote.quote_validity_days || 15} dias
          </span>
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Prazo de Pagamento:</span>
          <span className="field-value flex-1 text-sm">
            {quote.payment_term_days || 30} dias
          </span>
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">
            Forma de Pagamento:
          </span>
          <span className="field-value flex-1 text-sm">
            {getPaymentMethodLabel(quote.payment_method)}
          </span>
        </div>
      </div>

      {/* Observações */}
      {quote.observations && (
        <div className="section mb-6">
          <div className="section-title font-bold text-sm mb-3 border-b pb-2">
            OBSERVAÇÕES
          </div>
          <p className="text-sm whitespace-pre-wrap">{quote.observations}</p>
        </div>
      )}

      {/* Signature */}
      <div className="signature mt-16 text-center">
        <div className="signature-line border-t border-black w-72 mx-auto mb-2"></div>
        <div className="signature-text text-sm">De Acordo</div>
      </div>

      {/* Footer */}
      <div className="footer mt-10 text-center text-xs text-gray-500">
        Doc. Gerado em {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
      </div>
    </div>
  );
}
