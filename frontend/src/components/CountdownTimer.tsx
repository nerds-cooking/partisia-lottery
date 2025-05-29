"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface CountdownTimerProps {
  endTime: Date
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = endTime.getTime() - now

      if (distance > 0) {
        // Trigger flip animation when seconds change
        setIsFlipping(true)
        setTimeout(() => setIsFlipping(false), 500)

        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  return (
    <div className="flex space-x-4">
      {Object.entries(timeLeft).map(([unit, value], index) => (
        <div key={unit} className="text-center">
          <div
            className={`bg-white/20 rounded-lg p-2 min-w-[50px] transition-all duration-300 ${
              unit === "seconds" && isFlipping ? "transform scale-110" : ""
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="text-white font-bold text-lg">{value.toString().padStart(2, "0")}</div>
          </div>
          <div className="text-white/60 text-xs mt-1 capitalize">{unit}</div>
        </div>
      ))}
    </div>
  )
}

export default CountdownTimer
