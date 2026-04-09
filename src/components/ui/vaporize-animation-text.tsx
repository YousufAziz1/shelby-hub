'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

// Type definition
type Particle = {
    x: number
    y: number
    originalX: number
    originalY: number
    previousX: number
    previousY: number
    color: string
    opacity: number
    originalAlpha: number
    velocityX: number
    velocityY: number
    angle: number
    speed: number
    shouldFadeQuickly?: boolean
    scale: number
    rotation: number
    rotationSpeed: number
    hue: number
    saturation: number
    lightness: number
    turbulence: number
}

type VaporizeProps = {
    texts?: string[]
    className?: string
}

export function VaporizeAnimationText({ texts = ["Cool"], className }: VaporizeProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const animationFrameRef = useRef<number | null>(null)
    const [currentTextIndex, setCurrentTextIndex] = useState(0)
    const [animationState, setAnimationState] = useState<"static" | "vaporizing" | "fadingIn" | "waiting">("static")

    const vaporizeProgressRef = useRef(0)
    const fadeOpacityRef = useRef(0)

    // Configuration parameters
    const config = useMemo(() => ({
        color: "rgb(255, 255, 255)",
        font: {
            fontFamily: "Inter, sans-serif",
            fontSize: "80px", // adjust for visibility 
            fontWeight: 900
        },
        animation: {
            vaporizeDuration: 2000,
            fadeInDuration: 1000,
            waitDuration: 800
        },
        direction: "left-to-right" as const,
        spread: 5,
        density: 5,
        effects: {
            turbulence: 0.3,
            colorShift: true,
            rotation: true,
            scale: true,
            glow: true,
            trail: true,
            gravity: 0.1,
            bounce: 0.8
        }
    }), [])

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const updateCanvasSize = () => {
            const { width, height } = containerRef.current!.getBoundingClientRect()
            canvas.width = width
            canvas.height = height
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
        }
        updateCanvasSize()

        // Create particles
        const createParticles = (text: string) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Dynamic font sizing based on container width
            let fontSizeStr = config.font.fontSize;
            if (canvas.width < 768) fontSizeStr = "40px"; // Mobile
            else if (canvas.width < 1024) fontSizeStr = "60px"; // Tablet
            else fontSizeStr = "120px"; // Desktop

            // Set text style
            ctx.fillStyle = config.color
            ctx.font = `${config.font.fontWeight} ${fontSizeStr} ${config.font.fontFamily}`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            // Draw text
            const x = canvas.width / 2
            const y = canvas.height / 2
            ctx.fillText(text, x, y)

            // Get pixel data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data
            const particles: Particle[] = []

            // Sample and create particles
            const sampleRate = 4 // Sample rate
            for (let y = 0; y < canvas.height; y += sampleRate) {
                for (let x = 0; x < canvas.width; x += sampleRate) {
                    const index = (y * canvas.width + x) * 4
                    const alpha = data[index + 3]

                    if (alpha > 0) {
                        const particle: Particle = {
                            x,
                            y,
                            originalX: x,
                            originalY: y,
                            previousX: x,
                            previousY: y,
                            color: `rgba(${data[index]}, ${data[index + 1]}, ${data[index + 2]}, ${alpha / 255})`,
                            opacity: alpha / 255,
                            originalAlpha: alpha / 255,
                            velocityX: 0,
                            velocityY: 0,
                            angle: Math.random() * Math.PI * 2,
                            speed: 0,
                            scale: 1,
                            rotation: Math.random() * Math.PI * 2,
                            rotationSpeed: (Math.random() - 0.5) * 0.2,
                            hue: 0,
                            saturation: 0,
                            lightness: 100,
                            turbulence: Math.random() * config.effects.turbulence
                        }
                        particles.push(particle)
                    }
                }
            }

            particlesRef.current = particles
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        // Add shader-style glow effect
        const drawGlow = (x: number, y: number, radius: number, color: string) => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
            gradient.addColorStop(0, color)
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fill()
        }

        // Add trail effect
        const drawTrail = (particle: Particle) => {
            ctx.beginPath()
            ctx.moveTo(particle.previousX, particle.previousY)
            ctx.lineTo(particle.x, particle.y)
            ctx.strokeStyle = particle.color.replace(/[\d.]+\)$/, `${particle.opacity * 0.3})`)
            ctx.lineWidth = 1
            ctx.stroke()
        }

        // Animation loop
        let lastTime = performance.now()
        const animate = (currentTime: number) => {
            const deltaTime = (currentTime - lastTime) / 1000
            lastTime = currentTime

            // Use complete clear instead of semi-transparent overlay
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            switch (animationState) {
                case "vaporizing": {
                    vaporizeProgressRef.current += deltaTime * 100
                    const progress = Math.min(100, vaporizeProgressRef.current)

                    let allVaporized = true
                    particlesRef.current.forEach(particle => {
                        const shouldVaporize = config.direction === "left-to-right"
                            ? particle.originalX <= canvas.width * progress / 100
                            : particle.originalX >= canvas.width * (1 - progress / 100)

                        if (shouldVaporize) {
                            if (particle.speed === 0) {
                                // Initialize particle motion
                                particle.speed = Math.random() * config.spread + 2
                                particle.angle = Math.random() * Math.PI * 2
                                particle.velocityX = Math.cos(particle.angle) * particle.speed
                                particle.velocityY = Math.sin(particle.angle) * particle.speed
                                particle.shouldFadeQuickly = Math.random() > config.density / 10
                            }

                            // Apply physics effects
                            particle.velocityY += config.effects.gravity
                            particle.velocityX *= 0.98
                            particle.velocityY *= 0.98

                            // Add milder turbulence effect
                            particle.velocityX += (Math.random() - 0.5) * particle.turbulence * 0.5
                            particle.velocityY += (Math.random() - 0.5) * particle.turbulence * 0.5

                            particle.previousX = particle.x
                            particle.previousY = particle.y
                            particle.x += particle.velocityX
                            particle.y += particle.velocityY

                            // Boundary check - remove particle if it's completely off screen
                            if (
                                particle.x < -50 ||
                                particle.x > canvas.width + 50 ||
                                particle.y < -50 ||
                                particle.y > canvas.height + 50
                            ) {
                                particle.opacity = 0
                            }

                            // Smoother opacity transition
                            if (particle.shouldFadeQuickly) {
                                particle.opacity *= 0.95
                            } else {
                                particle.opacity *= 0.98
                            }

                            if (particle.opacity > 0.01) allVaporized = false

                            // Only draw visible particles
                            if (particle.opacity > 0.01) {
                                if (config.effects.trail) {
                                    drawTrail(particle)
                                }

                                ctx.save()
                                ctx.translate(particle.x, particle.y)
                                ctx.rotate(particle.rotation)
                                ctx.scale(particle.scale, particle.scale)

                                const particleColor = particle.color.replace(/[\d.]+\)$/, `${particle.opacity})`)
                                ctx.fillStyle = particleColor
                                ctx.fillRect(-1, -1, 2, 2)

                                if (config.effects.glow) {
                                    drawGlow(0, 0, 4, particleColor)
                                }

                                ctx.restore()
                            }
                        } else {
                            allVaporized = false
                            // Draw static particles
                            ctx.fillStyle = particle.color
                            ctx.fillRect(particle.x, particle.y, 2, 2)
                        }
                    })

                    if (progress >= 100 && allVaporized) {
                        // Clean up all particles before switching
                        particlesRef.current = []
                        ctx.clearRect(0, 0, canvas.width, canvas.height)

                        // Prepare next text
                        const nextIndex = (currentTextIndex + 1) % texts.length
                        setCurrentTextIndex(nextIndex)
                        createParticles(texts[nextIndex])

                        // Directly enter fadingIn state
                        setAnimationState("fadingIn")
                        fadeOpacityRef.current = 0
                    }
                    break
                }

                case "fadingIn": {
                    // Smoother fade-in effect
                    fadeOpacityRef.current += deltaTime * 2
                    const opacity = Math.min(1, fadeOpacityRef.current)

                    particlesRef.current.forEach(particle => {
                        particle.x = particle.originalX
                        particle.y = particle.originalY
                        particle.opacity = opacity * particle.originalAlpha

                        ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${particle.opacity})`)
                        ctx.fillRect(particle.x, particle.y, 2, 2)

                        if (config.effects.glow) {
                            drawGlow(particle.x, particle.y, 2, particle.color.replace(/[\d.]+\)$/, `${particle.opacity * 0.5})`))
                        }
                    })

                    if (opacity >= 1) {
                        setAnimationState("waiting")
                        setTimeout(() => {
                            setAnimationState("vaporizing")
                            vaporizeProgressRef.current = 0
                        }, config.animation.waitDuration)
                    }
                    break
                }

                case "waiting": {
                    // Keep stable during static display
                    particlesRef.current.forEach(particle => {
                        ctx.fillStyle = particle.color
                        ctx.fillRect(particle.x, particle.y, 2, 2)

                        if (config.effects.glow) {
                            drawGlow(particle.x, particle.y, 2, particle.color)
                        }
                    })
                    break
                }

                default: {
                    // Static state
                    particlesRef.current.forEach(particle => {
                        ctx.fillStyle = particle.color
                        ctx.fillRect(particle.x, particle.y, 2, 2)
                    })
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        // Initialize
        createParticles(texts[currentTextIndex])
        setTimeout(() => setAnimationState("vaporizing"), 1000)
        animationFrameRef.current = requestAnimationFrame(animate)

        // Handle window resize
        window.addEventListener('resize', updateCanvasSize)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            window.removeEventListener('resize', updateCanvasSize)
        }
    }, [config, texts, currentTextIndex, animationState])

    return (
        <div className={cn("relative w-full", className)}>
            <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
                <canvas ref={canvasRef} className="w-full h-full" />
            </div>
        </div>
    )
}
