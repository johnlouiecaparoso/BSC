<template>
  <aside class="w-64 bg-emerald border-r border-primary-800 flex flex-col h-screen fixed left-0 top-0">
    <div class="p-5 border-b border-primary-800">
      <div class="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" class="w-10 h-10 rounded-full bg-white p-0.5 object-contain" />
        <h1 class="text-base font-bold text-white leading-tight">Balanced Scorecard</h1>
      </div>
    </div>

    <nav class="flex-1 p-4">
      <slot />
    </nav>

    <div class="p-4">
      <slot name="footer">
        <button
          class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white border border-primary-700 hover:bg-primary-800 transition-colors"
          @click="$emit('logout')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </slot>
    </div>
  </aside>
</template>

<script setup>
defineEmits(['logout'])
</script>
