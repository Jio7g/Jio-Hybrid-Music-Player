import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: 'es', // Default locale
  fallbackLocale: 'en',
  messages: {
    en,
    es
  }
})

export default i18n
