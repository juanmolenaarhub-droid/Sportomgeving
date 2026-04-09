'use client'

type PlacesInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  hasError?: boolean
}

export function PlacesInput({ value, onChange, placeholder = 'Amsterdam', className = '', hasError = false }: PlacesInputProps) {
  const borderColor = hasError ? '#ef4444' : 'var(--ob-border, #E5E5E5)'

  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`ob-field ${className}`}
      style={{ borderColor }}
      autoComplete="off"
    />
  )
}
