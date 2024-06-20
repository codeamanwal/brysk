import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from './pages/Login';
import Signup from './pages/Signup';
import SalesPerLocation from './pages/SalesPerLocation';
import SalesPerCustomer from './pages/SalesPerCustomer';
import InventoryAtLocation from './pages/InventoryAtLocation';
import StoreStatus from './pages/StoreStatus';
import NumberOfBills from './pages/NumberOfBills';
import InventoryPreference from './pages/InventoryPreference';
import DemandForecasting from './pages/DemandForecasting';
import SellThroughRate from './pages/SellThroughRate';
import CustomerSKUPreference from './pages/CustomerSKUPreference';
import { SidebarProvider } from './contexts/SidebarContext';
import InventoryFlowAtLocation from './pages/InventoryFlowAtLocation';
import InventoryDiscrepancy from './pages/InventoryDiscrepancy';

function App() {
  return (
    <SidebarProvider>
      <Router>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/sales/location-store" element={<SalesPerLocation />} />
              <Route path="/sales/customer" element={<SalesPerCustomer />} />
              <Route path="/inventory/location-store-warehouse" element={<InventoryAtLocation />} />
              <Route path="/inventory-flow/location-store-warehouse" element={<InventoryFlowAtLocation/> } />
              <Route path="/inventory/discrepancy" element={<InventoryDiscrepancy />} /> 
              <Route path="/location-status" element={<StoreStatus />} />
              <Route path="/bills/location" element={<NumberOfBills />} />
              <Route path="/inventory/preference" element={<InventoryPreference />} />
              <Route path="/demand/forecasting" element={<DemandForecasting />} />
              <Route path="/sell-through-rate" element={<SellThroughRate />} />
              <Route path="/customer/sku-preference" element={<CustomerSKUPreference />} />
            </Routes>
      </Router>
    </SidebarProvider>
  );
}

export default App;
