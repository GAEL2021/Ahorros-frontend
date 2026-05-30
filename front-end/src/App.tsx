import { Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import CalendarPage from '@/pages/CalendarPage'
import CarterasPage from '@/pages/CarterasPage'
import ProgramacionesPage from '@/pages/ProgramacionesPage'
import CatalogoBancosPage from '@/pages/CatalogoBancosPage'
import AdminLoginPage from '@/pages/AdminLoginPage'

export default function App() {
  return (
    <Routes>
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="carteras" element={<CarterasPage />} />
        <Route path="programaciones" element={<ProgramacionesPage />} />
        <Route path="admin/bancos" element={<CatalogoBancosPage />} />
      </Route>
    </Routes>
  )
}
