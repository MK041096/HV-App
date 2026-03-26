'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import OnboardingModal from './OnboardingModal'

export default function OnboardingTrigger({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <span onClick={() => setIsOpen(true)} style={{ cursor: 'pointer', display: 'contents' }}>
        {children}
      </span>

      <AnimatePresence>
        {isOpen && (
          <OnboardingModal onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
