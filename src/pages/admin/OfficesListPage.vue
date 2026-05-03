<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Offices</h1>
      <p class="text-gray-600 mt-1">Manage and view all registered offices</p>
    </div>

    <div class="space-y-4">
      <SearchBar
        v-model="searchQuery"
        placeholder="Search offices by name..."
        @search="handleSearch"
      />

      <FilterPanel
        :filters="adminStore.filters"
        :offices="adminStore.offices"
        @update:filters="handleFilterChange"
        @clear="handleClearFilters"
      />
    </div>

    <AppLoader v-if="adminStore.isLoading" size="lg" text="Loading offices..." />

    <div v-else-if="filteredOffices.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No Offices Found</h3>
      <p class="text-gray-600">{{ searchQuery ? 'Try adjusting your search or filters' : 'No offices have been registered yet' }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <OfficeCard
        v-for="office in filteredOffices"
        :key="office.id"
        :office="office"
        @view="handleViewOffice"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLoader from '@/components/common/AppLoader.vue'
import SearchBar from '@/components/admin/SearchBar.vue'
import FilterPanel from '@/components/admin/FilterPanel.vue'
import OfficeCard from '@/components/admin/OfficeCard.vue'
import { useAdminStore } from '@/stores/adminStore'

const router = useRouter()
const adminStore = useAdminStore()

const searchQuery = ref('')

// Client-side search filter on top of the already-loaded offices
const filteredOffices = computed(() => {
  if (!searchQuery.value) {
    return adminStore.offices
  }
  const query = searchQuery.value.toLowerCase()
  return adminStore.offices.filter(office =>
    office.officeName?.toLowerCase().includes(query) ||
    office.pillar?.toLowerCase().includes(query) ||
    office.registeredBy?.toLowerCase().includes(query) ||
    office.email?.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await adminStore.fetchAllOffices()
})

const handleSearch = (query) => {
  searchQuery.value = query
}

const handleFilterChange = async (filters) => {
  adminStore.applyFilters(filters)
  await adminStore.fetchAllOffices()
}

const handleClearFilters = async () => {
  adminStore.clearFilters()
  searchQuery.value = ''
  await adminStore.fetchAllOffices()
}

const handleViewOffice = (office) => {
  router.push(`/admin/offices/${office.id}`)
}
</script>
