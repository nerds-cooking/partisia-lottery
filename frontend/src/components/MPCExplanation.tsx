"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, Lock, Zap } from "lucide-react"

const MPCExplanation: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Use Intersection Observer to detect when the component is in view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }, // Trigger when 20% of the element is visible
    )

    // Get the current element
    const currentElement = document.getElementById("mpc-explanation")
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [])

  return (
    <Card
      id="mpc-explanation"
      className={`bg-white/10 backdrop-blur-md border-white/20 transition-all duration-700 ${
        isVisible ? "opacity-100 transform-none" : "opacity-0 transform translate-y-10"
      }`}
    >
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>How MPC Protects Your Privacy</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div
              className={`flex items-start space-x-3 transition-all duration-500 ${
                isVisible ? "opacity-100 transform-none" : "opacity-0 transform translate-x-10"
              }`}
            >
              <Lock className="h-5 w-5 text-purple-400 mt-1" />
              <div>
                <h4 className="text-white font-medium">Private Participation</h4>
                <p className="text-white/70 text-sm">
                  Your ticket purchases are encrypted and hidden from other participants and even lottery operators
                  until the draw concludes.
                </p>
              </div>
            </div>

            <div
              className={`flex items-start space-x-3 transition-all duration-500 delay-100 ${
                isVisible ? "opacity-100 transform-none" : "opacity-0 transform translate-x-10"
              }`}
            >
              <Zap className="h-5 w-5 text-blue-400 mt-1" />
              <div>
                <h4 className="text-white font-medium">Secure Random Draw</h4>
                <p className="text-white/70 text-sm">
                  The winning number is generated through Multi-Party Computation, ensuring no single party can predict
                  or manipulate the outcome.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div
              className={`flex items-start space-x-3 transition-all duration-500 delay-200 ${
                isVisible ? "opacity-100 transform-none" : "opacity-0 transform translate-x-10"
              }`}
            >
              <Eye className="h-5 w-5 text-green-400 mt-1" />
              <div>
                <h4 className="text-white font-medium">Transparent Results</h4>
                <p className="text-white/70 text-sm">
                  Once the draw is complete, the winner and proof of fairness are publicly verifiable on the blockchain.
                </p>
              </div>
            </div>

            <div
              className={`flex items-start space-x-3 transition-all duration-500 delay-300 ${
                isVisible ? "opacity-100 transform-none" : "opacity-0 transform translate-x-10"
              }`}
            >
              <Shield className="h-5 w-5 text-yellow-400 mt-1" />
              <div>
                <h4 className="text-white font-medium">Anti-Manipulation</h4>
                <p className="text-white/70 text-sm">
                  MPC prevents front-running, insider manipulation, and other attacks that plague traditional lottery
                  systems.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 border border-purple-500/30 transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 transform-none" : "opacity-0 transform translate-y-10"
          }`}
        >
          <h4 className="text-white font-medium mb-2">Why This Matters</h4>
          <p className="text-white/80 text-sm">
            Traditional lotteries often suffer from trust issues, manipulation concerns, and lack of privacy. Our
            MPC-based system ensures mathematical fairness while protecting participant privacy throughout the entire
            process.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default MPCExplanation
