<script setup lang="ts">
// Login simples — após entrar, volta de onde veio (ou vai ao catálogo).
const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const totp = ref('')
const message = ref('')

async function submit() {
  message.value = ''
  const payload: Record<string, string> = { email: email.value, password: password.value }
  if (totp.value) payload.totp = totp.value
  const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  if (!r.ok) {
    const b = await r.json().catch(() => ({}))
    message.value = b.statusMessage ?? 'falha no login'
    return
  }
  router.push(String(route.query.redirect ?? '/explore'))
}
</script>

<template>
  <main style="max-width: 380px; margin: 4rem auto; padding: 1rem; font-family: system-ui, sans-serif; display: grid; gap: .6rem">
    <h1 style="font-size: 1.2rem">Entrar</h1>
    <input v-model="email" type="email" placeholder="seu@email.com">
    <input v-model="password" type="password" placeholder="senha" @keyup.enter="submit">
    <input v-model="totp" inputmode="numeric" placeholder="código MFA (se ativado)">
    <button @click="submit">Entrar</button>
    <p v-if="message" style="color: #e67e22">{{ message }}</p>
  </main>
</template>
