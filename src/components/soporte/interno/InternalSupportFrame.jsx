import InternalSupportNav from './InternalSupportNav'

export default function InternalSupportFrame({ children }) {
  return (
    <div className="page-wrapper space-y-4">
      <InternalSupportNav />
      {children}
    </div>
  )
}
