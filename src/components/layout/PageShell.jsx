import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'

export default function PageShell() {
  return (
    <div className="min-h-screen bg-app-surfaceAlt text-app-textPrimary">
      <NavBar />
      <main className="mx-auto max-w-7xl px-5 py-5">
        <Outlet />
      </main>
    </div>
  )
}
