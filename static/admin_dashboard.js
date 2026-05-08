// --- 1. MODAL & SEARCH LOGIC (Existing) ---
// --- VIEW MODAL LOGIC (New) ---
function openViewModal(title, description, remarks) {
    const modal = document.getElementById('viewModal');
    const modalContent = document.getElementById('viewModalContent');
    
    // Populate Data
    document.getElementById('viewTitle').innerText = title;
    document.getElementById('viewDescription').innerText = description;
    document.getElementById('viewRemarks').innerText = remarks;

    // Show Animation
    if (modal && modalContent) {
        modal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    const modalContent = document.getElementById('viewModalContent');
    
    if (modal && modalContent) {
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
        modal.classList.add('opacity-0', 'pointer-events-none');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

function openAdminModal(id, status, remarks) {
    const modal = document.getElementById('updateModal');
    const modalContent = document.getElementById('modalContent');
    const form = document.getElementById('updateForm');
    
    if(form) form.action = `/admin/update/${id}`;
    
    const statusSelect = document.getElementById('modalStatus');
    const remarksText = document.getElementById('modalRemarks');

    if(statusSelect) statusSelect.value = status;
    if(remarksText) remarksText.value = remarks;
    
    if (modal && modalContent) {
        modal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }
}

function closeAdminModal() {
    const modal = document.getElementById('updateModal');
    const modalContent = document.getElementById('modalContent');
    
    if (modal && modalContent) {
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
        modal.classList.add('opacity-0', 'pointer-events-none');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Search Listener
    const searchInput = document.getElementById('adminSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            const searchText = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#complaintsTable tbody tr');
            
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                // Check text match AND category filter (if any)
                const categoryFilter = document.getElementById('categoryFilter').value;
                const categoryMatch = categoryFilter === 'all' || row.dataset.category === categoryFilter;

                if (text.includes(searchText) && categoryMatch) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // --- 2. CHART INITIALIZATION ---
    const ctx = document.getElementById('categoryChart');
    if (ctx) {
        // Read data passed from HTML data-attributes
        const academicCount = ctx.dataset.academic;
        const facilitiesCount = ctx.dataset.facilities;
        const adminCount = ctx.dataset.administration;
        const otherCount = ctx.dataset.other;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Academic', 'Facilities', 'Admin', 'Other'],
                datasets: [{
                    data: [academicCount, facilitiesCount, adminCount, otherCount],
                    backgroundColor: ['#facc15', '#3b82f6', '#ef4444', '#94a3b8'],
                    borderColor: '#1e293b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
});

// --- 3. EXPORT CSV FUNCTION ---
function exportTableToCSV(filename) {
    let csv = [];
    let rows = document.querySelectorAll("table tr");
    
    for (let i = 0; i < rows.length; i++) {
        // Select all cells in the row, excluding the last column (Actions)
        let row = [], cols = rows[i].querySelectorAll("td, th");
        
        // Loop up to cols.length - 1 to skip 'Actions' column
        for (let j = 0; j < cols.length - 1; j++) { 
            // Clean up text: remove newlines/extra spaces and escape quotes
            let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, " ").trim();
            data = data.replace(/"/g, '""'); 
            row.push('"' + data + '"');
        }
        csv.push(row.join(","));
    }

    downloadCSV(csv.join("\n"), filename);
}

function downloadCSV(csv, filename) {
    let csvFile;
    let downloadLink;
    csvFile = new Blob([csv], {type: "text/csv"});
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// --- 4. CATEGORY FILTER (New) ---
function filterTable() {
    const category = document.getElementById('categoryFilter').value;
    const searchText = document.getElementById('adminSearch').value.toLowerCase();
    const rows = document.querySelectorAll('.complaint-row');

    rows.forEach(row => {
        const rowCategory = row.dataset.category;
        const text = row.innerText.toLowerCase();
        
        const categoryMatch = category === 'all' || rowCategory === category;
        const searchMatch = text.includes(searchText);

        if (categoryMatch && searchMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// --- 5. SIDEBAR STATUS FILTER (New) ---
function filterByStatus(status) {
    const rows = document.querySelectorAll('.complaint-row');
    
    rows.forEach(row => {
        const rowStatus = row.dataset.status;
        
        // Logic: If status is 'all', show everything.
        // Otherwise, specific mapping: 'Pending' means show Submitted OR In Progress.
        let match = false;
        
        if (status === 'all') {
            match = true;
        } else if (status === 'Submitted') {
            // "Pending Issues" button shows both Submitted and In Progress
            match = (rowStatus === 'Submitted' || rowStatus === 'In Progress' || rowStatus === 'In Review');
        } else {
            // Exact match for "Resolved"
            match = (rowStatus === status);
        }
        
        row.style.display = match ? '' : 'none';
    });
}