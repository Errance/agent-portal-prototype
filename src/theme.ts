import {
  createSystem,
  defaultConfig,
  defineConfig,
} from '@chakra-ui/react'

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        theme: { value: '#0ABAB5' },
        red: {
          100: { value: '#FF4949' },
          200: { value: 'rgba(255, 73, 73, 0.1)' },
        },
        bg: {
          100: { value: '#F4F5F7' },
          200: { value: '#FFFFFF' },
          300: { value: '#F4F5F7' },
          400: { value: '#EAEAED' },
        },
        gray: {
          100: { value: '#8E8E92' },
          200: { value: '#57585C' },
        },
        border: {
          100: { value: '#EAEAED' },
          200: { value: '#DEDFE0' },
        },
        text: {
          100: { value: '#151517' },
          200: { value: '#23262F' },
        },
        green: {
          100: { value: 'rgba(10, 186, 181, 0.15)' },
          200: { value: 'rgba(10, 186, 181, 0.08)' },
        },
        yellow: {
          100: { value: '#FFE81A' },
        },
        nav: {
          active: { value: '#151517' },
          inactive: { value: '#8E8E92' },
          bg: { value: '#1F1F1F' },
        },
      },
    },
    breakpoints: {
      xs: '480px',
      sm: '768px',
      md: '1024px',
      lg: '1280px',
      xl: '1536px',
    },
  },
  globalCss: {
    'html, body': {
      margin: 0,
      padding: 0,
      fontFamily: 'IBMPlexSans-Medium, Arial, sans-serif',
      fontSize: 'sm',
      fontWeight: 'normal',
      bgColor: 'bg.100',
      color: 'text.100',
      overscrollBehavior: 'none',
    },
  },
})

export const system = createSystem(defaultConfig, customConfig)
