import { useAuth } from '../../context/AuthContext'

function getSubLabel(profile) {
  if (!profile) {
    return 'Sign in to continue'
  }

  if (profile.role === 'ngo_admin') {
    return 'NGO Admin - All Schools'
  }

  return `${profile.school_name ?? 'Assigned School'} - School View`
}

export default function NavBar() {
  const { profile } = useAuth()

  return (
    <header className="h-[52px] border-b border-app-greenDark bg-app-greenDark px-5 text-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-xs font-semibold text-app-greenDark"
          >
            IN
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">India NGO Grocery Tracker</div>
            <div className="mt-1 text-[11px] text-white/80">{getSubLabel(profile)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            aria-label="User avatar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold"
          >
            {(profile?.name ?? 'U').slice(0, 1).toUpperCase()}
          </div>
          <div className="text-sm font-medium">{profile?.name ?? 'Guest'}</div>
        </div>
      </div>
    </header>
  )
}
