export default function Modal({ title, open, onClose, children }) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[360px] overflow-hidden rounded-[10px] border border-app-border bg-app-surface"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-app-border px-4 py-[14px]">
          <h2 className="text-sm font-semibold text-app-textPrimary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-lg leading-none text-app-textSecondary hover:text-app-textPrimary"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
