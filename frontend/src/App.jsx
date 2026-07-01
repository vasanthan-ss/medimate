import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Medicines from "./pages/Medicines";
import AddMedicine from "./pages/AddMedicine";
import Settings from "./pages/Settings";
import EditMedicine from "./pages/EditMedicine";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />


        <Route 
          path="/edit-medicine/:id" 
          element={
            <ProtectedPage>
              <EditMedicine />
            </ProtectedPage>
          } 
        />
        
        <Route
          path="/home"
          element={
            <ProtectedPage>
              <Home />
            </ProtectedPage>
          }
        />

        <Route
          path="/medicines"
          element={
            <ProtectedPage>
              <Medicines />
            </ProtectedPage>
          }
        />

        <Route
          path="/add-medicine"
          element={
            <ProtectedPage>
              <AddMedicine />
            </ProtectedPage>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedPage>
              <Settings />
            </ProtectedPage>
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;