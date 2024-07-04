import en from '@/locales/en.json'
import fr from '@/locales/fr.json'

import frFlag from '@/static/images/lang/fr.png';
import enFlag from '@/static/images/lang/en.png';

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'fr',
  messages: {
    en, 
    fr
  }
}))

export const langs = [
  {
    locale: 'fr',
    pathImage: frFlag,
    language: 'Français',
  },
  {
    locale: 'en',
    pathImage: enFlag,
    language: 'English',
  },
]