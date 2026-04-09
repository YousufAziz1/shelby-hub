"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

export interface Tab {
  id: string
  label: string
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, tabs, activeTab, onTabChange, ...props }, ref) => {
    const defaultIndex = activeTab ? Math.max(0, tabs.findIndex(t => t.id === activeTab)) : 0
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [activeIndex, setActiveIndex] = useState(defaultIndex)
    const [hoverStyle, setHoverStyle] = useState({})
    const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" })
    const tabRefs = useRef<(HTMLDivElement | null)[]>([])

    // Sync with external activeTab
    useEffect(() => {
        if (activeTab) {
            const index = tabs.findIndex(t => t.id === activeTab)
            if (index !== -1 && index !== activeIndex) {
                setActiveIndex(index)
            }
        }
    }, [activeTab, tabs])

    useEffect(() => {
      if (hoveredIndex !== null) {
        const hoveredElement = tabRefs.current[hoveredIndex]
        if (hoveredElement) {
          const { offsetLeft, offsetWidth } = hoveredElement
          setHoverStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          })
        }
      }
    }, [hoveredIndex])

    useEffect(() => {
      const activeElement = tabRefs.current[activeIndex]
      if (activeElement) {
        const { offsetLeft, offsetWidth } = activeElement
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    }, [activeIndex])

    useEffect(() => {
      requestAnimationFrame(() => {
        const firstElement = tabRefs.current[defaultIndex]
        if (firstElement) {
          const { offsetLeft, offsetWidth } = firstElement
          setActiveStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          })
        }
      })
    }, [defaultIndex])

    return (
      <div 
        ref={ref} 
        className={cn("relative p-1 bg-surface/50 backdrop-blur-md border border-divider rounded-xl overflow-x-auto no-scrollbar", className)} 
        {...props}
      >
        <div className="relative min-w-max">
          {/* Hover Highlight */}
          <div
            className="absolute h-[34px] transition-all duration-300 ease-out bg-primary/10 rounded-lg flex items-center"
            style={{
              ...hoverStyle,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          />

          {/* Active Indicator */}
          <div
            className="absolute bottom-[-4px] h-[2px] bg-primary transition-all duration-300 ease-out z-10"
            style={activeStyle}
          />

          {/* Tabs */}
          <div className="relative flex space-x-[6px] items-center">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                ref={(el) => { tabRefs.current[index] = el }}
                className={cn(
                  "px-4 py-1.5 cursor-pointer transition-colors duration-300 h-[34px] z-20",
                  index === activeIndex 
                    ? "text-primary font-bold" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  setActiveIndex(index)
                  onTabChange?.(tab.id)
                }}
              >
                <div className="text-[11px] font-mono leading-5 whitespace-nowrap flex items-center justify-center h-full uppercase tracking-widest font-black">
                  {tab.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)
Tabs.displayName = "Tabs"

export { Tabs }
