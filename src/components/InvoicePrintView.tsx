import { format } from "date-fns";

interface InvoiceAccount {
  id: string;
  invoice_number: string | null;
  customer_id: string;
  document_number: string | null;
  installments: number;
  installment_number: number;
  due_date: string;
  amount: number;
  discount: number;
  penalty_interest: number;
  total: number;
  payment_method: string;
  observations: string | null;
  created_at: string;
}

interface InvoiceCustomer {
  name: string;
  nome_fantasia?: string | null;
  cpf_cnpj?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  phone?: string | null;
  email?: string | null;
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
  vendedor: string | null;
  contato: string | null;
  email: string | null;
}

interface Props {
  account: InvoiceAccount;
  customer: InvoiceCustomer | null | undefined;
  companySettings: CompanySettings | null | undefined;
}

const formatCurrency = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDoc = (value: string | null | undefined) => {
  if (!value) return "";
  const d = value.replace(/\D/g, "");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return value;
};

const formatPhone = (value: string | null | undefined) => {
  if (!value) return "";
  const d = value.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
};

const formatDate = (iso: string) => {
  try {
    return format(new Date(iso + (iso.length === 10 ? "T12:00:00" : "")), "dd/MM/yyyy");
  } catch {
    return iso;
  }
};

export function InvoicePrintView({ account, customer, companySettings }: Props) {
  const composedAddress = (parts: {
    address?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    cep?: string | null;
  }) => {
    const segs: string[] = [];
    if (parts.address) segs.push(parts.address);
    if (parts.neighborhood) segs.push(parts.neighborhood);
    if (parts.city || parts.state) segs.push(`${parts.city || ""}${parts.state ? "/" + parts.state : ""}`);
    if (parts.cep) segs.push(`CEP: ${parts.cep}`);
    return segs.filter(Boolean).join(" - ");
  };

  const issueDate = account.invoice_number
    ? formatDate(account.created_at)
    : format(new Date(), "dd/MM/yyyy");

  return (
    <div className="print-container p-6 bg-white text-black">
      {/* Header */}
      <div className="header flex items-center gap-6 mb-6 pb-4 border-b-2 border-black">
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
            {companySettings?.razao_social && companySettings?.nome_fantasia && (
              <div>{companySettings.razao_social}</div>
            )}
            {companySettings?.cnpj && <div>CNPJ: {formatDoc(companySettings.cnpj)}</div>}
            {companySettings?.inscricao_estadual && <div>IE: {companySettings.inscricao_estadual}</div>}
            {composedAddress(companySettings || {}) && <div>{composedAddress(companySettings || {})}</div>}
            {(companySettings?.contato || companySettings?.email) && (
              <div>
                {companySettings?.contato && <span>Tel: {formatPhone(companySettings.contato)}</span>}
                {companySettings?.email && (
                  <span>{companySettings?.contato ? " | " : ""}{companySettings.email}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title + Invoice number */}
      <div className="flex items-center justify-between my-6">
        <h1 className="title text-2xl font-bold">FATURA</h1>
        <div className="text-right text-sm">
          <div>
            Nº Fatura: <strong>{account.invoice_number || "—"}</strong>
          </div>
          <div>Data de emissão: <strong>{issueDate}</strong></div>
          <div>Data de vencimento: <strong>{formatDate(account.due_date)}</strong></div>
        </div>
      </div>

      {/* Pagador */}
      <div className="section mb-6">
        <div className="section-title font-bold text-sm mb-3 border-b pb-2">DADOS DO PAGADOR</div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Nome/Razão Social:</span>
          <span className="field-value flex-1 text-sm">{customer?.name || "-"}</span>
        </div>
        {customer?.nome_fantasia && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Nome Fantasia:</span>
            <span className="field-value flex-1 text-sm">{customer.nome_fantasia}</span>
          </div>
        )}
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">CPF/CNPJ:</span>
          <span className="field-value flex-1 text-sm">{formatDoc(customer?.cpf_cnpj) || "-"}</span>
        </div>
        {composedAddress(customer || {}) && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Endereço:</span>
            <span className="field-value flex-1 text-sm">{composedAddress(customer || {})}</span>
          </div>
        )}
        {customer?.phone && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Telefone:</span>
            <span className="field-value flex-1 text-sm">{formatPhone(customer.phone)}</span>
          </div>
        )}
        {customer?.email && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">E-mail:</span>
            <span className="field-value flex-1 text-sm">{customer.email}</span>
          </div>
        )}
      </div>

      {/* Financeiro */}
      <div className="section mb-6">
        <div className="section-title font-bold text-sm mb-3 border-b pb-2">DADOS DA COBRANÇA</div>
        {account.document_number && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Nº Documento:</span>
            <span className="field-value flex-1 text-sm">{account.document_number}</span>
          </div>
        )}
        {account.installments > 1 && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Parcela:</span>
            <span className="field-value flex-1 text-sm">
              {account.installment_number}/{account.installments}
            </span>
          </div>
        )}
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Forma de Pagamento:</span>
          <span className="field-value flex-1 text-sm capitalize">{account.payment_method}</span>
        </div>
        <div className="field flex mb-2">
          <span className="field-label font-bold w-48 text-sm">Valor:</span>
          <span className="field-value flex-1 text-sm">{formatCurrency(account.amount)}</span>
        </div>
        {Number(account.discount) > 0 && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Desconto:</span>
            <span className="field-value flex-1 text-sm">- {formatCurrency(account.discount)}</span>
          </div>
        )}
        {Number(account.penalty_interest) > 0 && (
          <div className="field flex mb-2">
            <span className="field-label font-bold w-48 text-sm">Multa/Juros:</span>
            <span className="field-value flex-1 text-sm">+ {formatCurrency(account.penalty_interest)}</span>
          </div>
        )}
        <div className="field flex mb-2 pt-2 border-t">
          <span className="field-label font-bold w-48 text-sm">VALOR TOTAL:</span>
          <span className="field-value flex-1 text-sm font-bold">{formatCurrency(account.total)}</span>
        </div>
      </div>

      {/* Observações */}
      {account.observations && (
        <div className="section mb-6">
          <div className="section-title font-bold text-sm mb-3 border-b pb-2">OBSERVAÇÕES</div>
          <p className="text-sm whitespace-pre-wrap">{account.observations}</p>
        </div>
      )}

      {/* Signature */}
      <div className="signature mt-16 text-center">
        <div className="signature-line border-t border-black w-72 mx-auto mb-2"></div>
        <div className="signature-text text-sm">
          {companySettings?.nome_fantasia || companySettings?.razao_social || ""}
        </div>
      </div>

      <div className="footer mt-10 text-center text-xs text-gray-500">
        Documento gerado em {format(new Date(), "dd/MM/yyyy HH:mm")}
      </div>
    </div>
  );
}
