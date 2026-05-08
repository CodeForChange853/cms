function openModal(id, status, remarks) {
    const modal = document.getElementById('updateModal');
    const form = document.getElementById('updateForm');
    const statusSelect = document.getElementById('modalStatus');
    const remarksText = document.getElementById('modalRemarks');

    // Set the action URL dynamically for the specific complaint ID
    form.action = `/admin/update/${id}`;
    
    // Pre-fill values
    statusSelect.value = status;
    remarksText.value = remarks;

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('updateModal').classList.add('hidden');
}

// Close modal if clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('updateModal');
    if (event.target == modal) {
        closeModal();
    }
}