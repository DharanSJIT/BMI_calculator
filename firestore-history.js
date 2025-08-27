// firestore-history.js - Firestore BMI History Management

// Initialize history functionality
function initFirestoreHistory() {
    // Event listeners for history actions
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-history')) {
            const historyId = e.target.dataset.id;
            showHistoryDetails(historyId);
        }
        
        if (e.target.classList.contains('delete-history')) {
            const historyId = e.target.dataset.id;
            deleteHistoryRecord(historyId);
        }
    });
    
    // Modal close button
    document.querySelector('#history-details-modal .close-modal').addEventListener('click', function() {
        document.getElementById('history-details-modal').style.display = 'none';
    });
    
    // Delete button in modal
    document.getElementById('delete-history').addEventListener('click', function() {
        if (window.currentHistoryId) {
            deleteHistoryRecord(window.currentHistoryId);
            document.getElementById('history-details-modal').style.display = 'none';
        }
    });
}

// Display Firestore history in the table
function displayFirestoreHistory() {
    const historyBody = document.getElementById('history-body');
    historyBody.innerHTML = '';
    
    if (!window.bmiHistory || window.bmiHistory.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="6" class="no-history">No history records found</td></tr>';
        return;
    }
    
    window.bmiHistory.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(record.date)}</td>
            <td>${record.bmi.toFixed(1)}</td>
            <td>${record.weight} ${record.unit === 'metric' ? 'kg' : 'lbs'}</td>
            <td>${record.unit === 'metric' ? (record.height / 100).toFixed(2) + ' m' : 
                `${Math.floor(record.height / 12)} ft ${record.height % 12} in`}</td>
            <td><span class="bmi-category-tag ${getCategoryClass(record.category)}">${record.category}</span></td>
            <td>
                <button class="button button-small view-history" data-id="${record.id}">View</button>
                <button class="button button-small button-outline delete-history" data-id="${record.id}">Delete</button>
            </td>
        `;
        historyBody.appendChild(row);
    });
}

// Render Firestore history chart
function renderFirestoreHistoryChart() {
    const ctx = document.getElementById('history-chart').getContext('2d');
    
    // Sort history by date ascending for the chart
    const sortedHistory = [...window.bmiHistory].sort((a, b) => a.date - b.date);
    
    // Destroy previous chart if it exists
    if (window.historyChart) {
        window.historyChart.destroy();
    }
    
    window.historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedHistory.map(record => formatDate(record.date, true)),
            datasets: [{
                label: 'BMI Over Time',
                data: sortedHistory.map(record => record.bmi),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: Math.min(...sortedHistory.map(record => record.bmi)) - 2,
                    suggestedMax: Math.max(...sortedHistory.map(record => record.bmi)) + 2
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const record = sortedHistory[context.dataIndex];
                            return `Weight: ${record.weight} ${record.unit === 'metric' ? 'kg' : 'lbs'}\n` +
                                   `Category: ${record.category}`;
                        }
                    }
                }
            }
        }
    });
}

// Show history details in modal
async function showHistoryDetails(historyId) {
    const record = window.bmiHistory.find(r => r.id === historyId);
    if (!record) return;
    
    window.currentHistoryId = historyId;
    
    // Format height based on unit
    const heightDisplay = record.unit === 'metric' ? 
        `${(record.height / 100).toFixed(2)} meters` : 
        `${Math.floor(record.height / 12)} ft ${record.height % 12} in`;
    
    // Populate modal
    document.getElementById('detail-date').textContent = formatDate(record.date);
    document.getElementById('detail-bmi').textContent = record.bmi.toFixed(1);
    document.getElementById('detail-weight').textContent = `${record.weight} ${record.unit === 'metric' ? 'kg' : 'lbs'}`;
    document.getElementById('detail-height').textContent = heightDisplay;
    document.getElementById('detail-category').textContent = record.category;
    document.getElementById('detail-ideal-weight').textContent = record.idealWeight || '-';
    document.getElementById('detail-calories').textContent = record.dailyCalories || '-';
    
    // Show modal
    document.getElementById('history-details-modal').style.display = 'block';
}

// Delete a history record from Firestore
async function deleteHistoryRecord(historyId) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
        await window.firebaseDeleteDoc(window.firebaseDoc(window.firebaseDb, "bmiHistory", historyId));
        
        // Remove from local array
        window.bmiHistory = window.bmiHistory.filter(r => r.id !== historyId);
        
        // Update display
        displayFirestoreHistory();
        renderFirestoreHistoryChart();
        
        showNotification('Record deleted successfully!');
    } catch (error) {
        console.error('Error deleting record:', error);
        showNotification('Failed to delete record', 'error');
    }
}

// Save BMI result to Firestore
async function saveBmiResultToFirestore(bmiData) {
    const user = window.firebaseAuth.currentUser;
    if (!user) {
        showNotification('Please sign in to save results', 'error');
        return;
    }
    
    try {
        const docRef = await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, "bmiHistory"), {
            userId: user.uid,
            date: new Date(),
            bmi: bmiData.bmi,
            weight: bmiData.weight,
            height: bmiData.height,
            unit: bmiData.unit,
            category: bmiData.category,
            idealWeight: bmiData.idealWeight,
            dailyCalories: bmiData.dailyCalories,
            gender: bmiData.gender,
            age: bmiData.age
        });
        
        // Add to local history
        const newRecord = {
            id: docRef.id,
            ...bmiData,
            date: new Date()
        };
        
        if (!window.bmiHistory) window.bmiHistory = [];
        window.bmiHistory.unshift(newRecord);
        
        // Update display
        displayFirestoreHistory();
        renderFirestoreHistoryChart();
        
        showNotification('Result saved to your history!');
    } catch (error) {
        console.error('Error saving BMI result:', error);
        showNotification('Failed to save result', 'error');
    }
}

// Helper function to format date
function formatDate(date, short = false) {
    if (!date) return '';
    
    const d = new Date(date);
    if (short) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to get category class
function getCategoryClass(category) {
    switch (category.toLowerCase()) {
        case 'underweight': return 'underweight';
        case 'normal': return 'normal';
        case 'overweight': return 'overweight';
        case 'obese': return 'obese';
        default: return '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initFirestoreHistory);

// Make functions available globally
window.displayFirestoreHistory = displayFirestoreHistory;
window.renderFirestoreHistoryChart = renderFirestoreHistoryChart;
window.saveBmiResultToFirestore = saveBmiResultToFirestore;