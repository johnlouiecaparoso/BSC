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
        v-model="localFilters.goal"
        label="Goal"
        placeholder="All Goals"
        :options="goalOptions"
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
        v-model="localFilters.strategicObjective"
        label="Strategic Objective"
        placeholder="All Strategic Objectives"
        :options="strategicObjectiveOptions"
        @change="handleFilterChange"
      />

      <AppSelect
        v-model="localFilters.kpi"
        label="KPI / Strategic Measure"
        placeholder="All KPIs"
        :options="kpiOptions"
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
import { reactive, watch, computed, onMounted, ref } from 'vue'
import AppCard from '@/components/common/AppCard.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppButton from '@/components/common/AppButton.vue'
import { supabase } from '@/lib/supabase'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:filters', 'clear'])

// Dynamic options loaded from the database
const officesList = ref([])
const bscEntries = ref([])

onMounted(async () => {
  await loadOffices()
})

const loadOffices = async () => {
  try {
    const { data, error } = await supabase
      .from('offices')
      .select(`
        id,
        office_name,
        pillar,
        assignment_type,
        profiles (
          status
        )
      `)
      .order('office_name')

    if (error) throw error

    // Only include approved offices
    officesList.value = (data || []).filter(o => o.profiles?.status === 'approved')
    await loadBscEntries()
  } catch (err) {
    console.error('Error loading offices for filter:', err)
    officesList.value = []
    bscEntries.value = []
  }
}

const loadBscEntries = async () => {
  try {
    const officeIds = officesList.value.map(office => office.id)

    if (officeIds.length === 0) {
      bscEntries.value = []
      return
    }

    const { data, error } = await supabase
      .from('bsc_entries')
      .select(`
        id,
        office_id,
        goal,
        perspective,
        strategic_objective,
        kpi
      `)
      .in('office_id', officeIds)

    if (error) throw error

    bscEntries.value = data || []
  } catch (err) {
    console.error('Error loading BSC entries for filter:', err)
    bscEntries.value = []
  }
}

const officeOptions = computed(() => {
  return officesList.value.map(office => ({
    value: office.office_name,
    label: office.office_name
  }))
})

const pillarOptions = computed(() => {
  const pillars = [...new Set(
    officesList.value
      .map(office => office.pillar)
      .filter(Boolean)
  )]
  return pillars.map(p => ({ value: p, label: p }))
})

const assignmentTypeOptions = computed(() => {
  const types = [...new Set(
    officesList.value
      .map(office => office.assignment_type)
      .filter(Boolean)
  )]
  return types.length > 0
    ? types.map(t => ({ value: t, label: t }))
    : ['Strategic', 'Core', 'Support'].map(t => ({ value: t, label: t }))
})

const perspectiveOptions = [
  { value: 'Stakeholders', label: 'Stakeholders' },
  { value: 'Process Excellence', label: 'Process Excellence' },
  { value: 'Talents, Learning & Growth', label: 'Talents, Learning & Growth' },
  { value: 'Financial', label: 'Financial' }
]

const goalOptions = computed(() => {
  const goals = [...new Set(
    bscEntries.value
      .map(entry => entry.goal)
      .filter(Boolean)
  )]

  return goals.map(goal => ({ value: goal, label: goal }))
})

const strategicObjectiveOptions = computed(() => {
  const objectives = [...new Set(
    bscEntries.value
      .map(entry => entry.strategic_objective)
      .filter(Boolean)
  )]

  return objectives.map(objective => ({ value: objective, label: objective }))
})

const kpiOptions = computed(() => {
  const kpis = [...new Set(
    bscEntries.value
      .map(entry => entry.kpi)
      .filter(Boolean)
  )]

  return kpis.map(kpi => ({ value: kpi, label: kpi }))
})

const statusOptions = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'Ongoing', label: 'Ongoing' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Delayed', label: 'Delayed' },
  { value: 'For Validation', label: 'For Validation' }
]

const focalPersonOptions = [
  { value: 'yes', label: 'Assigned' },
  { value: 'no', label: 'Not Assigned' }
]

const localFilters = reactive({
  office: '',
  pillar: '',
  assignmentType: '',
  goal: '',
  perspective: '',
  strategicObjective: '',
  kpi: '',
  status: '',
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
