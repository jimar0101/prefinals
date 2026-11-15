export default defineNuxtPlugin(() => {
  useHead({
    script: [
      {
        src: 'https://google.com',
        async: true,
        defer: true,
      },
    ],
  })
})
