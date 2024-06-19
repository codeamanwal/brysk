import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from './pages/Login';
import Signup from './pages/Signup'
import SalesPerLocation from './pages/SalesPerLocation';
import { SidebarProvider } from './contexts/SidebarContext';

function App() {
  return (
    <SidebarProvider>
    <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/1' element={<SalesPerLocation />} />
        </Routes>
    </Router>
    </SidebarProvider>
  );
}

export default App;

