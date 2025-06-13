'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  velocityX: number;
  velocityY: number;
  color: string;
  shape: 'square' | 'circle' | 'triangle';
  size: number;
  opacity: number;
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

const colors = [
  '#FFD700', // Gold
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE' // Light Purple
];

function createParticle(id: number, containerWidth: number): ConfettiPiece {
  return {
    id,
    x: Math.random() * containerWidth,
    y: -10,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    velocityX: (Math.random() - 0.5) * 8,
    velocityY: Math.random() * 3 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as
      | 'square'
      | 'circle'
      | 'triangle',
    size: Math.random() * 8 + 4,
    opacity: 1
  };
}

const Confetti: React.FC<ConfettiProps> = ({
  active,
  duration = 2000,
  particleCount = 150,
  onComplete
}) => {
  const [particles, setParticles] = useState<ConfettiPiece[]>([]);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateParticles = (particles: ConfettiPiece[]): ConfettiPiece[] => {
    const containerHeight =
      containerRef.current?.offsetHeight || window.innerHeight;

    return particles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.velocityX,
        y: particle.y + particle.velocityY,
        rotation: particle.rotation + particle.rotationSpeed,
        velocityY: particle.velocityY + 0.3, // gravity
        velocityX: particle.velocityX * 0.99, // air resistance
        opacity:
          particle.y > containerHeight * 0.7
            ? particle.opacity - 0.02
            : particle.opacity
      }))
      .filter(
        (particle) => particle.y < containerHeight + 50 && particle.opacity > 0
      );
  };

  useEffect(() => {
    if (!active) {
      setParticles([]);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const containerWidth =
      containerRef.current?.offsetWidth || window.innerWidth;
    // Create initial burst of particles
    const initialParticles = Array.from({ length: particleCount }, (_, i) =>
      createParticle(i, containerWidth)
    );
    setParticles(initialParticles);

    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed > duration) {
        setParticles([]);
        if (onComplete) onComplete();
        return;
      }

      setParticles((prevParticles) => {
        let updatedParticles = updateParticles(prevParticles);

        // Add new particles occasionally for continuous effect
        if (elapsed < duration * 0.6 && Math.random() < 0.1) {
          const newParticles = Array.from({ length: 5 }, (_, i) =>
            createParticle(prevParticles.length + i, containerWidth)
          );
          updatedParticles = [...updatedParticles, ...newParticles];
        }

        return updatedParticles;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, duration, particleCount, onComplete]);

  if (!active && particles.length === 0) return null;

  const renderParticle = (particle: ConfettiPiece) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${particle.x}px`,
      top: `${particle.y}px`,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      backgroundColor: particle.color,
      opacity: particle.opacity,
      transform: `rotate(${particle.rotation}deg)`,
      pointerEvents: 'none',
      zIndex: 1000
    };

    switch (particle.shape) {
      case 'circle':
        style.borderRadius = '50%';
        break;
      case 'triangle':
        style.backgroundColor = 'transparent';
        style.borderLeft = `${particle.size / 2}px solid transparent`;
        style.borderRight = `${particle.size / 2}px solid transparent`;
        style.borderBottom = `${particle.size}px solid ${particle.color}`;
        style.width = '0';
        style.height = '0';
        break;
      default: // square
        break;
    }

    return <div key={particle.id} style={style} />;
  };

  return (
    <div
      ref={containerRef}
      className='fixed inset-0 pointer-events-none overflow-hidden'
      style={{ zIndex: 1000 }}
    >
      {particles.map(renderParticle)}
    </div>
  );
};

export default Confetti;
