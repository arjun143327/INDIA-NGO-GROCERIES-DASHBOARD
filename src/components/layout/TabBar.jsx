import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const tabClassName =
  'inline-flex h-full items-center border-b-2 px-5 text-[13px] font-medium transition-colors'

export default function TabBar() {
  const { profile } = useAuth()

  if (!profile) {
    return null
  }

  const tabs =
    profile.role === 'ngo_admin'
      ? [{ to: '/ngo', label: 'NGO Admin' }]
      : [{ to: '/school', label: 'School Staff' }]

  return (
    <nav className="border-b border-app-border bg-app-surface px-5">
      <div className="mx-auto flex h-[44px] max-w-7xl items-stretch gap-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              [
                tabClassName,
                isActive
                  ? 'border-app-greenMid text-app-greenMid font-semibold'
                  : 'border-transparent text-app-textSecondary hover:text-app-textPrimary',
              ].join(' ')
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
