export default function AuthBrandHeader({ eyebrow = 'farmacias vivas' }) {
  return (
    <div className="text-center">
      <div className="flex justify-center">
        <img
          src="/brand/logo-full-color.svg"
          alt="Viteka"
          className="h-14 w-auto max-w-[190px] object-contain"
        />
      </div>
      {eyebrow ? (
        <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-white/75">
          {eyebrow}
        </p>
      ) : null}
    </div>
  )
}
