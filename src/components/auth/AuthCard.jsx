export default function AuthCard({ title, description, footer, children }) {
  return (
    <div className="login-panel overflow-hidden rounded-2xl bg-white">
      <div className="border-b border-gray-100 bg-gray-50/80 px-8 py-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {description}
          </p>
        ) : null}
      </div>

      <div className="space-y-5 px-8 py-8">
        {children}
      </div>

      {footer ? (
        <div className="border-t border-gray-100 bg-gray-50/70 px-8 py-4 text-xs leading-5 text-gray-500">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
