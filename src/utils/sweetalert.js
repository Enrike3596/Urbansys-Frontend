import Swal from 'sweetalert2'

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    toast.style.fontSize = '0.9rem'
  }
})

const ConfirmDialog = Swal.mixin({
  customClass: {
    popup: 'swal-custom-popup',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn',
    title: 'swal-custom-title',
    htmlContainer: 'swal-custom-text'
  },
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: false,
  allowOutsideClick: true
})

const PromptDialog = Swal.mixin({
  customClass: {
    popup: 'swal-prompt-popup',
    title: 'swal-prompt-title',
    htmlContainer: 'swal-prompt-text',
    input: 'swal-prompt-input',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn'
  },
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: true,
  allowOutsideClick: false
})

export const swalSuccess = (message) => {
  return Toast.fire({
    icon: 'success',
    title: message
  })
}

export const swalError = (message) => {
  return Toast.fire({
    icon: 'error',
    title: message
  })
}

export const swalConfirmDelete = (entityName = 'registro') => {
  return ConfirmDialog.fire({
    title: `¿Eliminar ${entityName}?`,
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })
}

export const swalConfirmAction = ({
  title = '¿Confirmar acción?',
  text = 'Esta acción se aplicará inmediatamente.',
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
  icon = 'warning'
} = {}) => {
  return ConfirmDialog.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText
  })
}

export const swalTextareaPrompt = ({
  title,
  description,
  placeholder,
  confirmButtonText,
  cancelButtonText = 'Cancelar',
  icon = 'edit_note',
  accent = '#0f4c81',
  inputLabel = 'Detalle',
  validationMessage = 'Este campo es obligatorio',
} = {}) => {
  return PromptDialog.fire({
    title,
    html: `
      <div class="swal-prompt-content" style="--swal-accent:${accent}">
        <div class="swal-prompt-badge">
          <span class="material-symbols-outlined">${icon}</span>
        </div>
        <p class="swal-prompt-description">${description || ''}</p>
      </div>
    `,
    input: 'textarea',
    inputLabel,
    inputPlaceholder: placeholder,
    inputAttributes: {
      required: 'required',
      rows: '6',
      autocomplete: 'off'
    },
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return validationMessage
      }
      return undefined
    }
  })
}
