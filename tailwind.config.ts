import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core colors
        black: '#0a0a0a',
        white: '#fafafa',
        
        // Path colors
        accent: {
          DEFAULT: '#00ff88',
          dim: '#00cc6a',
          light: 'rgba(0, 255, 136, 0.1)',
        },
        orange: {
          DEFAULT: '#ff6b35',
          light: '#ff8555',
          dim: 'rgba(255, 107, 53, 0.1)',
        },
        purple: {
          DEFAULT: '#a855f7',
          light: '#c084fc',
          dim: 'rgba(168, 85, 247, 0.1)',
        },
        
        // Grays
        gray: {
          dark: '#1a1a1a',
          mid: '#2a2a2a',
          light: '#888888',
          border: 'rgba(255, 255, 255, 0.05)',
          'border-hover': 'rgba(255, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-inter)', 'Inter', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'voice-pulse': 'voicePulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        voicePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
        'gradient-orange': 'linear-gradient(135deg, #ff6b35 0%, #ff9500 100%)',
        'gradient-purple': 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        'grid-pattern': `
          linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
    },
  },
  plugins: [],
}

export default config
