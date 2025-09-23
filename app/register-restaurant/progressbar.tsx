import React, { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from '@react-hook/window-size'

interface ProgressBarProps {
  step: number
  steps: string[]
}

function ProgressBar({ step, steps }: ProgressBarProps) {
  const [width, height] = useWindowSize()
  const [showConfetti, setShowConfetti] = useState(false)

  const allDone = step === steps.length

  useEffect(() => {
    if (step === steps.length) {
      setShowConfetti(true)
      const t = window.setTimeout(() => setShowConfetti(false), 4000)
      return () => window.clearTimeout(t)
    }
  }, [step, steps.length])

  return (
    <div className="mb-8 flex flex-col items-center gap-3">
      {/* Stepper numbers */}
      <div className="flex justify-between w-full max-w-lg">
        {steps.map((label, i) => {
          const completed = step > i + 1
          const active = step === i + 1
          const content = completed || (active && i + 1 === steps.length) ? '✓' : i + 1

          const bgColor = allDone
            ? 'bg-green-600 text-white'
            : completed || active
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-600'

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${bgColor}`}
              >
                {content}
              </div>
              <span className="text-center text-sm text-gray-700">{label}</span>
            </div>
          )
        })}
      </div>

      {/* Confetti from bottom */}
      {showConfetti && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 9999,
          }}
        >
          <Confetti
            width={width}
            height={height}
            numberOfPieces={200}
            recycle={false}
            gravity={0.3}
            initialVelocityY={-15}
            confettiSource={{ x: 0, y: height, w: width, h: 0 }}
          />
        </div>
      )}
    </div>
  )
}

export default ProgressBar
