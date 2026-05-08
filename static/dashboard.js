// static/dashboard.js

// 1. MODAL UTILITIES
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden-modal');
        modal.classList.add('visible-modal');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('visible-modal');
        modal.classList.add('hidden-modal');
    }
}

// Handle File Name Display in Form
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('c_file');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const fileName = e.target.files[0]?.name || "Click to upload evidence";
            document.getElementById('fileNameDisplay').innerText = fileName;
        });
    }

    // Load initial data
    loadData();
    
    // Attach Search Listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = window.allComplaints.filter(c => 
                c.title.toLowerCase().includes(term) || 
                c.category.toLowerCase().includes(term)
            );
            renderTable(filtered);
        });
    }
});

// 2. FETCH DATA & RENDER
window.allComplaints = []; // Global variable for search filtering

async function loadData() {
    try {
        const response = await fetch('/api/student/data');
        const data = await response.json();
        
        // Update Stats
        updateStat('statTotal', data.stats.total);
        updateStat('statPending', data.stats.pending);
        updateStat('statResolved', data.stats.resolved);

        // Render Table
        window.allComplaints = data.complaints;
        renderTable(window.allComplaints);
    } catch (err) {
        console.error("Error loading data", err);
    }
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function renderTable(data) {
    const tbody = document.getElementById('complaintsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">No records found.</td></tr>`;
        return;
    }

    data.forEach(item => {
        // Styling logic based on Status
        let statusClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        let icon = '';
        
        if (item.status === 'Resolved') {
            statusClass = 'bg-green-500/10 text-green-400 border-green-500/20';
        } else if (item.status === 'Submitted' || item.status === 'In Progress') {
            statusClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            icon = '<span class="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>';
        }

        const row = `
        <tr class="hover:bg-slate-700/50 transition-colors group border-l-2 border-l-transparent hover:border-l-yellow-500">
            <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span class="font-medium text-white group-hover:text-yellow-400 transition-colors">${item.title}</span>
                    <span class="text-xs text-slate-500">${item.date}</span>
                </div>
            </td>
            <td class="px-6 py-4"><span class="text-xs font-medium text-slate-300 bg-slate-700 px-2 py-1 rounded border border-slate-600">${item.category}</span></td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass} border">
                    ${icon} ${item.status}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-400 italic">${item.remarks}</td>
            <td class="px-6 py-4 text-right">
                ${item.status === 'Submitted' ? `<button onclick="deleteComplaint(${item.id})" class="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-slate-700 rounded-lg"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>` : ''}
            </td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// 3. SUBMIT COMPLAINT
async function submitComplaint() {
    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerText;
    btn.innerText = 'Sending...';
    btn.disabled = true;

    const formData = new FormData();
    const title = document.getElementById('c_title').value;
    const category = document.getElementById('c_category').value;
    const description = document.getElementById('c_description').value;

    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    
    const file = document.getElementById('c_file').files[0];
    if (file) formData.append('file', file);

    try {
        const res = await fetch('/api/student/submit', { method: 'POST', body: formData });
        const result = await res.json();
        
        if (result.success) {
            closeModal('newComplaintModal');
            document.getElementById('complaintForm').reset();
            document.getElementById('fileNameDisplay').innerText = "Click to upload evidence";
            loadData(); // Refresh table
        } else {
            alert('Error: ' + result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Submission failed.');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// 4. DELETE ACTION
async function deleteComplaint(id) {
    if(!confirm("Are you sure you want to cancel this complaint?")) return;
    try {
        await fetch(`/api/student/delete/${id}`, { method: 'DELETE' });
        loadData();
    } catch(err) {
        console.error(err);
    }
}