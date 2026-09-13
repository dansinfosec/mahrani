import { classNames } from '../../lib/format.js'
import Icon from './Icon.jsx'

export default function QuantityStepper({ value, onChange, min = 1, max = 10, size, label = 'Quantity', disabled }) {
  const decrease = () => onChange(Math.max(min, value - 1))
  const increase = () => onChange(Math.min(max, value + 1))
  return (
    <div className={classNames('stepper', size === 'sm' && 'stepper--sm')} role="group" aria-label={label}>
      <button
        type="button"
        className="stepper__btn"
        onClick={decrease}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Icon name="minus" />
      </button>
      <output className="stepper__value" aria-live="polite" aria-label={label}>
        {value}
      </output>
      <button
        type="button"
        className="stepper__btn"
        onClick={increase}
        disabled={disabled || value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Icon name="plus" />
      </button>
    </div>
  )
}
