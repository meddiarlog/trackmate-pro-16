import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CollectionOrderPrintProps {
  order: any;
  onClose: () => void;
}

export default function CollectionOrderPrint({ order, onClose }: CollectionOrderPrintProps) {
  const handlePrint = () => {
    window.print();
  };

  const standardText = `"Fica estabelecido entre as partes que o prazo para carga é de até 48 horas úteis e para descarga é de até 24 horas úteis. Considerando que o horário para carga e descarga é das 08:00 às 18:00 horas, de segunda a sexta-feira, exceto feriados. Com base nos termos do §6º, artigo 11 da Lei nº 11.442/2007. Será pago o valor de até R$ 0,35 / t / h para carga a partir da 49ª hora e descarga a partir da 25ª hora."`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with buttons - hidden on print */}
      <div className="print:hidden p-4 border-b flex justify-between items-center">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir
        </Button>
      </div>

      {/* Print Content */}
      <div className="p-8 max-w-4xl mx-auto print:p-4 print:max-w-none">
        <div className="border-2 border-foreground">
          {/* Header */}
          <div className="grid grid-cols-3 border-b-2 border-foreground">
            <div className="p-4 border-r-2 border-foreground">
              {/* Company Logo Area */}
              <div className="text-center text-xs text-muted-foreground">
                [Logo da Empresa]
              </div>
            </div>
            <div className="col-span-2">
              <div className="bg-foreground text-background text-center py-2 font-bold text-lg">
                ORDEM DE COLETA DE CARGAS
              </div>
              <div className="grid grid-cols-3 text-sm">
                <div className="p-2 border-r border-foreground border-b">
                  <span className="font-semibold">COLETA:</span> {format(new Date(order.order_date), "dd-MMM-yy", { locale: ptBR }).toUpperCase()}
                </div>
                <div className="p-2 border-r border-foreground border-b">
                  <span className="font-semibold">No.</span>
                </div>
                <div className="p-2 border-b font-bold text-xl text-center">
                  {order.order_number}
                </div>
              </div>
              <div className="grid grid-cols-2 text-sm">
                <div className="p-2 border-r border-foreground">
                  <span className="font-semibold">REMETENTE:</span> {order.sender_name || "-"}
                </div>
                <div className="p-2">
                  <span className="font-semibold">PLACA:</span> {order.vehicle_plate || "-"}
                </div>
              </div>
              <div className="p-2 text-sm border-t border-foreground">
                <span className="font-semibold">LOCAL COLETA:</span> {order.loading_city ? `${order.loading_city}-${order.loading_state}` : "-"}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-2">
            {/* Left Side */}
            <div className="border-r-2 border-foreground">
              <div className="bg-foreground text-background text-center py-1 text-sm font-semibold">
                DESCRIÇÃO DA ORDEM COLETADA
              </div>
              
              <div className="text-sm">
                <div className="grid grid-cols-2 border-b border-foreground">
                  <div className="p-2 border-r border-foreground">
                    <span className="font-semibold">PESO (TON):</span> {order.weight_tons}T
                  </div>
                  <div className="p-2">
                    <span className="font-semibold">Cód.:</span> {order.code || "-"}
                  </div>
                </div>
                
                <div className="p-2 border-b border-foreground">
                  <span className="font-semibold">DESTINATÁRIO:</span> {order.recipient_name}
                </div>
                
                <div className="p-2 border-b border-foreground">
                  <span className="font-semibold">DESCARREGAMENTO:</span> {order.unloading_city} - {order.unloading_state}
                </div>
                
                <div className="grid grid-cols-2 border-b border-foreground">
                  <div className="p-2 border-r border-foreground">
                    <span className="font-semibold">PRODUTO:</span> {order.products?.name || "-"}
                  </div>
                  <div className="p-2">
                    <span className="font-semibold">TIPO:</span> {order.freight_types?.name || "-"}
                  </div>
                </div>
                
                <div className="p-2 border-b border-foreground">
                  <span className="font-semibold">Nº PEDIDO:</span> {order.order_request_number || "-"}
                </div>
                
                <div className="p-2 border-b border-foreground min-h-[60px]">
                  <span className="font-semibold">Obs:</span> {order.observations || "-"}
                </div>
                
                <div className="p-2 border-b border-foreground">
                  <span className="font-semibold">FUNCIONÁRIO:</span> {order.employee_name || "-"}
                </div>
                
                <div className="p-2">
                  <span className="font-semibold">FORMA DE PAGTO:</span> {order.payment_method}
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div>
              {/* Driver Data */}
              <div className="bg-foreground text-background text-center py-1 text-sm font-semibold">
                DADOS DO MOTORISTA
              </div>
              <div className="text-sm">
                <div className="p-2 border-b border-foreground">
                  <span className="font-semibold">MOTORISTA:</span> {order.driver_name || "-"}
                </div>
                <div className="grid grid-cols-2 border-b border-foreground">
                  <div className="p-2 border-r border-foreground">
                    <span className="font-semibold">CPF:</span> {order.driver_cpf || "-"}
                  </div>
                  <div className="p-2">
                    <span className="font-semibold">CNH:</span> {order.driver_cnh || "-"}
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-foreground">
                  <div className="p-2 border-r border-foreground">
                    <span className="font-semibold">CELULAR:</span> {order.driver_phone || "-"}
                  </div>
                  <div className="p-2">
                    <span className="font-semibold">VAL.:</span> {order.driver_cnh_expiry ? format(new Date(order.driver_cnh_expiry), "dd/MM/yy") : "-"}
                  </div>
                </div>
              </div>

              {/* Owner Data */}
              <div className="bg-foreground text-background text-center py-1 text-sm font-semibold">
                DADOS DO PATRÃO
              </div>
              <div className="text-sm">
                <div className="grid grid-cols-2 border-b border-foreground">
                  <div className="p-2 border-r border-foreground">
                    <span className="font-semibold">NOME:</span> {order.owner_name || "-"}
                  </div>
                  <div className="p-2">
                    <span className="font-semibold">TELEFONE:</span> {order.owner_phone || "-"}
                  </div>
                </div>
              </div>

              {/* Vehicle Data */}
              <div className="bg-foreground text-background text-center py-1 text-sm font-semibold">
                DADOS DO VEÍCULO
              </div>
              <div className="text-sm">
                <div className="p-2 border-b border-foreground">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold mb-1">
                    <span>CAVALO</span>
                    <span>CARRETA</span>
                    <span>CARRETA 2</span>
                    <span>DOLLY</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <span>{order.vehicle_plate || "-"}</span>
                    <span>{order.trailer_plates?.[0] || "-"}</span>
                    <span>{order.trailer_plates?.[1] || "-"}</span>
                    <span>{order.trailer_plates?.[2] || "-"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-foreground">
                  <div className="p-2 border-r border-foreground">
                    <span className="font-semibold">TIPO:</span> {order.vehicle_types?.name || "-"}
                  </div>
                  <div className="p-2">
                    <span className="font-semibold">CARROCERIA:</span> {order.body_types?.name || "-"}
                  </div>
                </div>
              </div>

              {/* Standard Text */}
              <div className="p-2 text-[8px] leading-tight">
                {standardText}
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 border-t-2 border-foreground">
            <div className="p-4 border-r border-foreground text-center">
              <div className="border-t border-foreground mt-12 pt-2 mx-8">
                <span className="text-sm font-semibold">ASSINATURA DO FUNCIONÁRIO</span>
              </div>
            </div>
            <div className="p-4 text-center">
              <div className="border-t border-foreground mt-12 pt-2 mx-8">
                <span className="text-sm font-semibold">ASSINATURA DO MOTORISTA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .min-h-screen {
            min-height: auto;
          }
          .p-8 {
            padding: 0;
          }
          .max-w-4xl {
            max-width: 100%;
          }
          .p-8, .p-8 * {
            visibility: visible;
          }
          .p-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
