'use client'

type Option = { value: string; label: string }

type SingleProps = {
  options: Option[]
  value: string
  onChange: (v: string) => void
  multiple?: false
}

type MultiProps = {
  options: Option[]
  value: string[]
  onChange: (v: string[]) => void
  multiple: true
}

export function ChipSelector(props: SingleProps | MultiProps) {
  const isMulti = props.multiple === true

  const isActive = (v: string) =>
    isMulti
      ? (props as MultiProps).value.includes(v)
      : (props as SingleProps).value === v

  const toggle = (v: string) => {
    if (isMulti) {
      const cur = (props as MultiProps).value
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
      ;(props as MultiProps).onChange(next)
    } else {
      ;(props as SingleProps).onChange(v)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {props.options.map((opt) => {
        const active = isActive(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-3 min-h-[44px] inline-flex items-center rounded-full border text-sm transition-colors ${
              active
                ? 'bg-[#1E5AA8] text-white border-[#1E5AA8]'
                : 'bg-white text-[#1A2332] border-gray-300 hover:border-[#1E5AA8]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
