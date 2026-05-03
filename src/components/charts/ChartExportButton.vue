<template>
  <div class="relative inline-block" ref="dropdownRef">
    <button
      type="button"
      class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
      @click="showDropdown = !showDropdown"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-if="showDropdown"
      class="absolute right-0 z-50 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
    >
      <button
        v-for="format in formats"
        :key="format.value"
        type="button"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        @click="handleExport(format.value)"
      >
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {{ format.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  targetSelector: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    default: 'chart-export'
  }
})

const showDropdown = ref(false)
const dropdownRef = ref(null)

const formats = [
  { value: 'png', label: 'PNG Image' },
  { value: 'jpg', label: 'JPG Image' },
  { value: 'pdf', label: 'PDF Document' }
]

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleExport = async (format) => {
  showDropdown.value = false

  const targetEl = document.querySelector(props.targetSelector)
  if (!targetEl) {
    console.error('Export target not found:', props.targetSelector)
    return
  }

  // Find all canvas elements inside the target
  const canvases = targetEl.querySelectorAll('canvas')
  if (canvases.length === 0) {
    console.error('No chart canvas found in target')
    return
  }

  if (format === 'pdf') {
    await exportAsPDF(canvases)
  } else {
    await exportAsImage(canvases, format)
  }
}

const exportAsImage = async (canvases, format) => {
  // Create a combined canvas for all charts
  const padding = 20
  const gap = 30
  let totalHeight = padding * 2
  let maxWidth = 0

  const images = []
  for (const canvas of canvases) {
    const img = new Image()
    img.src = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 1.0)
    await new Promise(resolve => { img.onload = resolve })
    images.push({ img, width: canvas.width, height: canvas.height })
    totalHeight += canvas.height + gap
    maxWidth = Math.max(maxWidth, canvas.width)
  }
  totalHeight -= gap // remove last gap

  const combinedCanvas = document.createElement('canvas')
  combinedCanvas.width = maxWidth + padding * 2
  combinedCanvas.height = totalHeight
  const ctx = combinedCanvas.getContext('2d')

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)

  let yOffset = padding
  for (const { img, width, height } of images) {
    const xOffset = (combinedCanvas.width - width) / 2
    ctx.drawImage(img, xOffset, yOffset, width, height)
    yOffset += height + gap
  }

  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const dataUrl = combinedCanvas.toDataURL(mimeType, 1.0)
  downloadFile(dataUrl, `${props.filename}.${format}`)
}

const exportAsPDF = async (canvases) => {
  // Create a simple PDF using canvas-to-image approach
  // We'll use a print-friendly approach: create an iframe with the images and trigger print
  const images = []
  for (const canvas of canvases) {
    images.push(canvas.toDataURL('image/png', 1.0))
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    // Fallback: download as PNG instead
    await exportAsImage(canvases, 'png')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${props.filename}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
          }
          @media print {
            body { padding: 0; }
            img { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        ${images.map(src => `<img src="${src}" />`).join('\n')}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

const downloadFile = (dataUrl, filename) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
