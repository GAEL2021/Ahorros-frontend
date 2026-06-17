import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import MetasPage from '@/pages/MetasPage'
import CalendarPage from '@/pages/CalendarPage'
import CarterasPage from '@/pages/CarterasPage'
import ProgramacionesPage from '@/pages/ProgramacionesPage'
import CatalogoBancosPage from '@/pages/CatalogoBancosPage'
import PresupuestosPage from '@/pages/PresupuestosPage'
import LogrosPage from '@/pages/LogrosPage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import ShowcasePage from '@/pages/ShowcasePage'

export default function App() {
  return (
    <Routes>
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="metas" element={<MetasPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="bancos" element={<CarterasPage />} />
          <Route path="carteras" element={<Navigate to="/bancos" replace />} />
        <Route path="programaciones" element={<ProgramacionesPage />} />
        <Route path="presupuestos" element={<PresupuestosPage />} />
        <Route path="logros" element={<LogrosPage />} />
        <Route path="showcase" element={<ShowcasePage />} />
        <Route path="admin/bancos" element={<CatalogoBancosPage />} />
      </Route>
    </Routes>
  )
}
