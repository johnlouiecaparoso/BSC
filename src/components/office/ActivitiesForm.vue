<template>
  <div class="space-y-4">
    <MOVInput
      v-model="localData.keyActivities"
      label="Key Activities / Output Link"
      placeholder="Enter key activities output URL"
      @input="handleInput"
    />

    <MOVInput
      v-model="localData.mov"
      @input="handleInput"
    />

    <AppSelect
      v-model="localData.status"
      label="Status"
      placeholder="Select status"
      :options="statusOptions"
      @change="handleInput"
    />

    <AppTextarea
      v-model="localData.issues"
      label="Issues / Challenges"
      placeholder="Describe any issues or challenges (optional)"
      :rows="3"
      @input="handleInput"
    />

    <AppTextarea
      v-model="localData.assistance"
      label="Assistance Needed / Recommendations"
      placeholder="Describe needed assistance or recommendations (optional)"
      :rows="3"
      @input="handleInput"
    />
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import MOVInput from './MOVInput.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      keyActivities: '',
      mov: '',
      status: '',
      issues: '',
      assistance: ''
    })
  }
})

const emit = defineEmits(['update'])

const statusOptions = [
  'Not Started',
  'Ongoing',
  'Completed',
  'Delayed',
  'For Validation'
]

const localData = reactive({
  keyActivities: '',
  mov: '',
  status: '',
  issues: '',
  assistance: ''
})

watch(() => props.data, (newData) => {
  if (newData) {
    localData.keyActivities = newData.keyActivities || ''
    localData.mov = newData.mov || ''
    localData.status = newData.status || ''
    localData.issues = newData.issues || ''
    localData.assistance = newData.assistance || ''
  }
}, { immediate: true, deep: true })

const handleInput = () => {
  emit('update', { ...localData })
}
</script>
