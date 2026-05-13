import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  hoverScale?: number;
  glowColor?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedCard({
  children,
  delay = 0,
  hoverScale = 1.02,
  glowColor = '#b8923c',
  onClick,
  className,
  style,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        type: 'spring',
        stiffness: 120,
        damping: 15,
      }}
      whileHover={{
        scale: hoverScale,
        boxShadow: `0 0 25px ${glowColor}40`,
        borderColor: glowColor,
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={className}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
