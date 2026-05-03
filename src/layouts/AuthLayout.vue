<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Image -->
    <div class="absolute inset-0 z-0">
      <img src="/bg.jpg" alt="" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-emerald/70"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <div class="text-center mb-8">
        <img src="/logo.png" alt="Balanced Scorecard Logo" class="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg bg-white p-1 object-contain" />
        <h1 class="text-3xl font-bold text-white">Balanced Scorecard</h1>
        <p class="text-lg text-primary-200 mt-1">Performance Tracking System</p>
      </div>

      <div class="bg-white rounded-lg shadow-xl p-8">
        <router-view />
      </div>
    </div>
  </div>
</template>
