import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import VehicleTypes from "./pages/VehicleTypes";
import BodyTypes from "./pages/BodyTypes";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Freights from "./pages/Freights";
import Contracts from "./pages/Contracts";
import Financial from "./pages/Financial";
import CreditControl from "./pages/CreditControl";
import Cobrancas from "./pages/Cobrancas";
import VehicleOwners from "./pages/VehicleOwners";
import Suppliers from "./pages/Suppliers";
import CollectionOrders from "./pages/CollectionOrders";
import CTE from "./pages/CTE";
import MDFe from "./pages/MDFe";
import Quotes from "./pages/Quotes";
import AccountsPayable from "./pages/AccountsPayable";
import AccountsReceivable from "./pages/AccountsReceivable";
import CashBoxes from "./pages/CashBoxes";
import Reports from "./pages/Reports";
import RepositoryFixed from "./pages/RepositoryFixed";
import SettingsUnits from "./pages/SettingsUnits";
import CompanySettings from "./pages/CompanySettings";
import Account from "./pages/Account";
import AccessUsers from "./pages/AccessUsers";
import AccessUserGroups from "./pages/AccessUserGroups";
import AccessPermissions from "./pages/AccessPermissions";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="vehicle-types" element={<VehicleTypes />} />
            <Route path="body-types" element={<BodyTypes />} />
            <Route path="customers" element={<Customers />} />
            <Route path="products" element={<Products />} />
            <Route path="freights" element={<Freights />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="financial" element={<Financial />} />
            <Route path="credit-control" element={<CreditControl />} />
            <Route path="cobrancas" element={<Cobrancas />} />
            <Route path="vehicle-owners" element={<VehicleOwners />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="collection-orders" element={<CollectionOrders />} />
            <Route path="cte" element={<CTE />} />
            <Route path="mdfe" element={<MDFe />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="accounts-payable" element={<AccountsPayable />} />
            <Route path="accounts-receivable" element={<AccountsReceivable />} />
            <Route path="cash-boxes" element={<CashBoxes />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/customers" element={<Reports />} />
            <Route path="reports/credit-control" element={<Reports />} />
            <Route path="reports/cobrancas" element={<Reports />} />
            <Route path="reports/quotes" element={<Reports />} />
            <Route path="reports/suppliers" element={<Reports />} />
            <Route path="reports/accounts-payable" element={<Reports />} />
            <Route path="reports/accounts-receivable" element={<Reports />} />
            <Route path="reports/profit-loss" element={<Reports />} />
            <Route path="reports/collection-orders" element={<Reports />} />
            <Route path="reports/products" element={<Reports />} />
            <Route path="repository" element={<RepositoryFixed />} />
            <Route path="settings/units" element={<SettingsUnits />} />
            <Route path="settings/company" element={<CompanySettings />} />
            <Route path="account" element={<Account />} />
            <Route path="account/access/users" element={<AccessUsers />} />
            <Route path="account/access/user-groups" element={<AccessUserGroups />} />
            <Route path="account/access/permissions" element={<AccessPermissions />} />
            <Route path="help" element={<Help />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
