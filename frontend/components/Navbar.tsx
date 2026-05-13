import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: '⚔️' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
  { href: '/notes', label: 'Journal', icon: '📓' },
  { href: '/activities', label: 'Activity', icon: '⚡' },
  { href: '/obsidian', label: 'Vault', icon: '🔮' },
];

export default function Navbar() {
  const [current, setCurrent] = useState('');

  useEffect(() => {
    setCurrent(window.location.pathname);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 12, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1e1e20',
        padding: '0 1.5rem',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: '0.5rem' }}>
        <a href="/" style={{ textDecoration: 'none', marginRight: '1rem' }}>
          <span style={{
            fontWeight: 800,
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #b8923c, #f4d77a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            THE FORGE
          </span>
        </a>

        <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
          {navLinks.map((link) => {
            const isActive = current === link.href || (link.href !== '/' && current.startsWith(link.href));
            return (
              <motion.a
                key={link.href}
                href={link.href}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#f4d77a' : '#888',
                  background: isActive ? '#b8923c18' : 'transparent',
                  border: isActive ? '1px solid #b8923c35' : '1px solid transparent',
                  transition: 'color 0.15s',
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{link.icon}</span>
                <span>{link.label}</span>
              </motion.a>
            );
          })}
        </div>

        <motion.a
          href="/login"
          whileHover={{ scale: 1.05 }}
          style={{
            padding: '0.375rem 0.875rem',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#666',
            border: '1px solid #2a2a2c',
          }}
        >
          Account
        </motion.a>
      </div>
    </motion.nav>
  );
}
