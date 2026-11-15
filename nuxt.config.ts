export default defineNuxtConfig({
  compatibilityDate: '2026-11-15',
  modules: ['vuetify-nuxt-module'],
  runtimeConfig: {
    public: {
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      weatherApiKey: process.env.NUXT_PUBLIC_WEATHER_API_KEY || ''
    }
  }
})
