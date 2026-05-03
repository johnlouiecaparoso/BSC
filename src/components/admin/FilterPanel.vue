<template>
  <AppCard title="Filters">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AppSelect
        v-model="localFilters.office"
        label="Office"
        placeholder="All Offices"
        :options="officeOptions"
        @change="handleFilterChange"
      />

      <AppSelect
        v-model="localFilters.pillar"
        label="Pillar"
        placeholder="All Pillars"
        :options="pillarOptions"
        @change="handleFilterChange"
      />

      <AppSelect
        v-model="localFilters.assignmentType"
        label="Assignment Type"
        placeholder="All Types"
        :options="assignmentTypeOptions"
        @change="handleFilterChange"
      />

      <AppSelect
        v-model="localFilters.quarter"
        label="Quarter"
        placeholder="All Quarters"
        :options="quarterOptions"
        @change="handleFilterChange"
      />

      <AppSelect
        v-model="localFilters.status"
        label="Status"
        placeholder="All Statuses"
        :options="statusOptions"
        @change="handleFilterChange"
      />

      <AppSelect
        v-model="localFilters.perspective"
        label="Perspective"
        placeholder="All Perspectives"
        :options="perspectiveOptions"
        @change="handleFilterChange"
      />

      <AppSelect
        v-model="localFilters.hasFocalPerson"
        label="Focal Person"
        placeholder="All"
        :options="focalPersonOptions"
        @change="handleFilterChange"
      />
    </div>

    <div class="flex justify-end mt-4">
      <AppButton variant="outline" @click="handleClearFilters">
        Clear All Filters
      </AppButton>
    </div>
  </AppCard>
</template>

<script setup>
import { reactive, watch, computed } from 'vue'
import AppCard from '@/components/common/AppCard.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({})
  },
  offices: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:filters', 'clear'])

const officeOptions = computed(() => {
  return props.offices.map(office => ({
    value: office.officeName,
    label: office.officeName
  }))
})
const pillarOptions = computed(() => {
  return [...new Set(
    props.offices
      .map(office => office.pillar)
      .filter(Boolean)
  )].map(pillar => ({
    value: pillar,
    label: pillar
  }))
})
const assignmentTypeOptions = ['Strategic', 'Core', 'Support']
const quarterOptions = ['Q1', 'Q2', 'Q3', 'Q4']
const statusOptions = ['Not Started', 'Ongoing', 'Completed', 'Delayed', 'For Validation']
const perspectiveOptions = ['Stakeholders', 'Process Excellence', 'Talents, Learning & Growth', 'Financial']
const focalPersonOptions = [
  { value: 'yes', label: 'Assigned' },
  { value: 'no', label: 'Not Assigned' }
]

const localFilters = reactive({
  office: '',
  pillar: '',
  assignmentType: '',
  quarter: '',
  status: '',
  perspective: '',
  hasFocalPerson: ''
})

watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, newFilters)
}, { immediate: true, deep: true })

const handleFilterChange = () => {
  emit('update:filters', { ...localFilters })
}

const handleClearFilters = () => {
  Object.keys(localFilters).forEach(key => {
    localFilters[key] = ''
  })
  emit('clear')
  emit('update:filters', { ...localFilters })
}
</script>
