<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Office Approvals</h1>
      <p class="text-gray-600 mt-1">Review and approve office registrations</p>
    </div>

    <AppLoader v-if="adminStore.isLoading" size="lg" text="Loading approvals..." />

    <template v-else>
      <div v-if="adminStore.pendingApprovals.length === 0" class="text-center py-12">
        <svg class="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
        <p class="text-gray-600">No pending approvals at this time.</p>
      </div>

      <div v-else class="space-y-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-blue-900">
              <span class="font-semibold">{{ adminStore.pendingApprovals.length }}</span>
              {{ adminStore.pendingApprovals.length === 1 ? 'office' : 'offices' }} pending approval
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ApprovalCard
            v-for="approval in adminStore.pendingApprovals"
            :key="approval.id"
            :approval="approval"
            :is-approving="approvingId === approval.id"
            :is-rejecting="rejectingId === approval.id"
            @approve="handleApprove"
            @reject="handleRejectClick"
          />
        </div>
      </div>

      <AppCard
        v-if="completedApprovals.length > 0"
        title="Recently Completed"
        class="mt-8"
      >
        <details>
          <summary class="cursor-pointer text-primary-600 hover:text-primary-700 font-medium">
            View approval history ({{ completedApprovals.length }})
          </summary>

          <div class="mt-4 space-y-3">
            <div
              v-for="approval in completedApprovals"
              :key="approval.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p class="font-semibold text-gray-900">{{ approval.officeName }}</p>
                <p class="text-sm text-gray-600">{{ approval.registeredBy }} • {{ approval.email }}</p>
              </div>
              <AppBadge :variant="approval.status === 'approved' ? 'success' : 'danger'">
                {{ approval.status }}
              </AppBadge>
            </div>
          </div>
        </details>
      </AppCard>
    </template>

    <AppModal
      v-model:show="showRejectModal"
      title="Reject Office Registration"
      size="md"
    >
      <div class="space-y-4">
        <p class="text-gray-700">Are you sure you want to reject this office registration?</p>

        <AppTextarea
          v-model="rejectionReason"
          label="Rejection Reason (Optional)"
          placeholder="Provide a reason for rejection..."
          :rows="4"
        />
      </div>

      <template #footer>
        <AppButton variant="outline" @click="showRejectModal = false">
          Cancel
        </AppButton>
        <AppButton variant="danger" :loading="isRejecting" @click="confirmReject">
          Reject
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import ApprovalCard from '@/components/admin/ApprovalCard.vue'
import { useAdminStore } from '@/stores/adminStore'

const toast = useToast()
const adminStore = useAdminStore()

const approvingId = ref(null)
const rejectingId = ref(null)
const isRejecting = ref(false)
const showRejectModal = ref(false)
const selectedApproval = ref(null)
const rejectionReason = ref('')
const completedApprovals = ref([])

onMounted(async () => {
  await adminStore.fetchPendingApprovals()
})

const handleApprove = async (approval) => {
  approvingId.value = approval.id
  try {
    await adminStore.approveOffice(approval.id)
    toast.success(`${approval.officeName} has been approved successfully!`)
  } catch (error) {
    toast.error('Failed to approve office')
  } finally {
    approvingId.value = null
  }
}

const handleRejectClick = (approval) => {
  selectedApproval.value = approval
  rejectionReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (!selectedApproval.value) return

  isRejecting.value = true
  try {
    await adminStore.rejectOffice(selectedApproval.value.id, rejectionReason.value)
    toast.success(`${selectedApproval.value.officeName} registration has been rejected`)
    showRejectModal.value = false
    selectedApproval.value = null
    rejectionReason.value = ''
  } catch (error) {
    toast.error('Failed to reject office')
  } finally {
    isRejecting.value = false
  }
}
</script>
