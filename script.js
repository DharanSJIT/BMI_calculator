// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const unitTabs = document.querySelectorAll('.unit-tab');
  const weightInput = document.getElementById('weight');
  const heightInput = document.getElementById('height');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const ageInput = document.getElementById('age');
  const ageImperialInput = document.getElementById('age-imperial');
  const weightImperialInput = document.getElementById('weight-imperial');
  const calculateBtn = document.getElementById('calculate-btn');
  const resetBtn = document.getElementById('reset-btn');
  const bmiResult = document.getElementById('bmi-result');
  const bmiCategory = document.getElementById('bmi-category');
  const bmiCircle = document.getElementById('bmi-circle');
  const progressValue = document.getElementById('progress-value');
  const healthTip = document.getElementById('health-tip');
  const idealWeight = document.getElementById('ideal-weight');
  const dailyCalories = document.getElementById('daily-calories');
  const historyBody = document.getElementById('history-body');
  const currentYearSpan = document.getElementById('current-year');
  const saveResultBtn = document.getElementById('save-result');
  const shareResultBtn = document.getElementById('share-result');
  const shareModal = document.getElementById('share-modal');
  const closeModal = document.querySelector('.close-modal');
  const shareUrl = document.getElementById('share-url');
  const copyLinkBtn = document.getElementById('copy-link');
  const navLinks = document.querySelectorAll('.nav-link');
  
  let currentUnit = 'metric';
  let bmiHistory = JSON.parse(localStorage.getItem('bmiHistory')) || [];
  let currentBmiResult = null;
  let historyChart = null;
  
  // Set current year in footer
  currentYearSpan.textContent = new Date().getFullYear();
  
  // Initialize and display history
  displayHistory();
  
  // Set up event listeners for tabs
  unitTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      unitTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Update current unit
      currentUnit = this.getAttribute('data-unit');
      
      // Toggle input visibility based on unit
      if (currentUnit === 'metric') {
        document.getElementById('metric-inputs').style.display = 'block';
        document.getElementById('imperial-inputs').style.display = 'none';
      } else {
        document.getElementById('metric-inputs').style.display = 'none';
        document.getElementById('imperial-inputs').style.display = 'block';
      }
      
      // Reset inputs
      resetInputs();
    });
  });
  
  // Navigation link active state
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // Calculate BMI function
  calculateBtn.addEventListener('click', function() {
    let calculatedBMI;
    let weight, height, age, gender;
    let isValid = true;
    
    // Get gender
    if (currentUnit === 'metric') {
      gender = document.querySelector('input[name="gender"]:checked').value;
    } else {
      gender = document.querySelector('input[name="gender-imperial"]:checked').value;
    }
    
    if (currentUnit === 'metric') {
      weight = parseFloat(weightInput.value);
      height = parseFloat(heightInput.value);
      age = parseFloat(ageInput.value);
      
      if (!weight || !height || !age) {
        alert('Please enter all required fields');
        isValid = false;
      } else {
        // Metric calculation: weight(kg) / height(m)^2
        const heightInMeters = height / 100;
        calculatedBMI = weight / (heightInMeters * heightInMeters);
      }
    } else {
      weight = parseFloat(weightImperialInput.value);
      const heightFt = parseFloat(heightFtInput.value);
      const heightIn = parseFloat(heightInInput.value) || 0;
      age = parseFloat(ageImperialInput.value);
      
      if (!weight || !heightFt || !age) {
        alert('Please enter all required fields');
        isValid = false;
      } else {
        // Imperial calculation: weight(lb) / height(in)^2 * 703
        const heightInInches = (heightFt * 12) + heightIn;
        height = heightInInches;
        calculatedBMI = (weight / (heightInInches * heightInInches)) * 703;
      }
    }
    
    if (!isValid) return;
    
    calculatedBMI = parseFloat(calculatedBMI.toFixed(2));
    
    // Determine BMI category and color
    let category, color;
    
    if (calculatedBMI < 18.5) {
      category = 'Underweight';
      color = '#3B82F6'; // Blue
    } else if (calculatedBMI >= 18.5 && calculatedBMI < 25) {
      category = 'Normal';
      color = '#10B981'; // Green
    } else if (calculatedBMI >= 25 && calculatedBMI < 30) {
      category = 'Overweight';
      color = '#F59E0B'; // Yellow
    } else {
      category = 'Obese';
      color = '#EF4444'; // Red
    }
    
    // Update result display
    bmiResult.textContent = calculatedBMI;
    bmiCategory.textContent = category;
    bmiCategory.style.color = color;
    
    // Update circle
    const percentage = Math.min(100, (calculatedBMI / 40) * 100);
    bmiCircle.style.background = `conic-gradient(from 0deg, ${color} ${percentage}%, transparent ${percentage}%)`;
    
    // Update progress bar
    progressValue.style.width = `${percentage}%`;
    progressValue.style.backgroundColor = color;
    
    // Calculate ideal weight range
    let idealWeightMin, idealWeightMax;
    if (currentUnit === 'metric') {
      const heightInM = height / 100;
      idealWeightMin = (18.5 * heightInM * heightInM).toFixed(1);
      idealWeightMax = (24.9 * heightInM * heightInM).toFixed(1);
      idealWeight.textContent = `${idealWeightMin} - ${idealWeightMax} kg`;
    } else {
      const heightInInches = height;
      idealWeightMin = ((18.5 * heightInInches * heightInInches) / 703).toFixed(1);
      idealWeightMax = ((24.9 * heightInInches * heightInInches) / 703).toFixed(1);
      idealWeight.textContent = `${idealWeightMin} - ${idealWeightMax} lbs`;
    }
    
    // Calculate daily calories (basic BMR using Mifflin-St Jeor Equation)
    let bmr;
    if (gender === 'male') {
      if (currentUnit === 'metric') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
      } else {
        // Convert imperial to metric for the formula
        const weightInKg = weight * 0.453592;
        const heightInCm = height * 2.54;
        bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) + 5;
      }
    } else {
      if (currentUnit === 'metric') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
      } else {
        // Convert imperial to metric for the formula
        const weightInKg = weight * 0.453592;
        const heightInCm = height * 2.54;
        bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) - 161;
      }
    }
    
    // Multiply BMR by activity factor (using moderate activity as default)
    const dailyCaloriesValue = Math.round(bmr * 1.55);
    dailyCalories.textContent = `${dailyCaloriesValue} calories`;
    
    // Update health tip
    switch(category) {
      case 'Underweight':
        healthTip.textContent = 'Consider increasing your caloric intake with nutrient-dense foods. Aim for about 300-500 calories above your maintenance level. Focus on protein-rich foods and strength training.';
        break;
      case 'Normal':
        healthTip.textContent = 'Maintain your healthy lifestyle with regular exercise and balanced nutrition. Aim for 150 minutes of moderate activity per week and include strength training twice weekly.';
        break;
      case 'Overweight':
        healthTip.textContent = 'Focus on incorporating more physical activity and moderating portion sizes. Aim for a modest calorie deficit of 300-500 calories per day through diet and exercise for sustainable weight loss.';
        break;
      case 'Obese':
        healthTip.textContent = 'Consider consulting with healthcare professionals for a personalized plan. Focus on gradual, sustainable lifestyle changes. Even a 5-10% reduction in weight can significantly improve health markers.';
        break;
    }
    
    // Save current result for sharing
    currentBmiResult = {
      bmi: calculatedBMI,
      category: category,
      weight: currentUnit === 'metric' ? weight : weight,
      height: height,
      unit: currentUnit,
      age: age,
      gender: gender,
      date: new Date()
    };
    
    // Save to history in localStorage
    bmiHistory.unshift(currentBmiResult);
    
    // Keep only the last 10 records
    if (bmiHistory.length > 10) {
      bmiHistory = bmiHistory.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('bmiHistory', JSON.stringify(bmiHistory));
    
    // Update history display
    displayHistory();
    
    // Show results section
    document.getElementById('results-section').style.display = 'block';
    document.querySelector('.result-container').classList.add('fade-in');
  });
  
  // Save result to Firestore
  if (saveResultBtn) {
    saveResultBtn.addEventListener('click', async function() {
      if (!currentBmiResult) return;
      
      // Check if user is logged in
      const auth = window.firebaseAuth;
      if (!auth.currentUser) {
        alert('Please sign in to save your results');
        return;
      }
      
      try {
        const db = window.firebaseDb;
        const historyCollection = window.firebaseCollection(db, "bmiHistory");
        
        // Add the document to Firestore
        await window.firebaseAddDoc(historyCollection, {
          ...currentBmiResult,
          userId: auth.currentUser.uid,
          date: new Date()
        });
        
        alert('Result saved successfully!');
        
        // Reload user history
        window.loadUserHistory(auth.currentUser.uid);
      } catch (error) {
        console.error("Error saving result:", error);
        alert('Failed to save result. Please try again.');
      }
    });
  }
  
  // Share result
  if (shareResultBtn) {
    shareResultBtn.addEventListener('click', function() {
      if (!currentBmiResult) return;
      
      // Generate share URL
      const shareData = {
        bmi: currentBmiResult.bmi,
        category: currentBmiResult.category,
        date: new Date().toISOString()
      };
      
      const shareDataEncoded = encodeURIComponent(JSON.stringify(shareData));
      const shareLink = `${window.location.origin}${window.location.pathname}?share=${shareDataEncoded}`;
      
      // Set share URL in input
      shareUrl.value = shareLink;
      
      // Show modal
      shareModal.style.display = 'block';
      
      // Set up share buttons
      document.querySelector('.share-button.facebook').addEventListener('click', function() {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank');
      });
      
      document.querySelector('.share-button.twitter').addEventListener('click', function() {
        window.open(`https://twitter.com/intent/tweet?text=My BMI is ${currentBmiResult.bmi} (${currentBmiResult.category})&url=${encodeURIComponent(shareLink)}`, '_blank');
      });
      
      document.querySelector('.share-button.whatsapp').addEventListener('click', function() {
        window.open(`https://wa.me/?text=My BMI is ${currentBmiResult.bmi} (${currentBmiResult.category}). Check yours at ${encodeURIComponent(shareLink)}`, '_blank');
      });
      
      document.querySelector('.share-button.email').addEventListener('click', function() {
        window.location.href = `mailto:?subject=My BMI Results&body=My BMI is ${currentBmiResult.bmi} (${currentBmiResult.category}). Check yours at ${shareLink}`;
      });
    });
  }
  
  // Copy share link
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', function() {
      shareUrl.select();
      document.execCommand('copy');
      this.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        this.innerHTML = '<i class="fas fa-copy"></i> Copy';
      }, 2000);
    });
  }
  
  // Close modal
  if (closeModal) {
    closeModal.addEventListener('click', function() {
      shareModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
      if (event.target === shareModal) {
        shareModal.style.display = 'none';
      }
    });
  }
  
  // Reset inputs
  resetBtn.addEventListener('click', resetInputs);
  
  function resetInputs() {
    weightInput.value = '';
    heightInput.value = '';
    heightFtInput.value = '';
    heightInInput.value = '';
    ageInput.value = '';
    ageImperialInput.value = '';
    weightImperialInput.value = '';
    document.getElementById('results-section').style.display = 'none';
    currentBmiResult = null;
  }
  
  // Check for shared BMI result in URL
  function checkForSharedResult() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('share');
    
    if (sharedData) {
      try {
        const data = JSON.parse(decodeURIComponent(sharedData));
    
        // Display shared result
        bmiResult.textContent = data.bmi;
        bmiCategory.textContent = data.category;
        
        // Determine color based on category
        let color;
        switch(data.category) {
          case 'Underweight':
            color = '#3B82F6';
            break;
          case 'Normal':
            color = '#10B981';
            break;
          case 'Overweight':
            color = '#F59E0B';
            break;
          case 'Obese':
            color = '#EF4444';
            break;
        }
        
        bmiCategory.style.color = color;
        
        // Update circle
        const percentage = Math.min(100, (data.bmi / 40) * 100);
        bmiCircle.style.background = `conic-gradient(from 0deg, ${color} ${percentage}%, transparent ${percentage}%)`;
        
        // Update progress bar
        progressValue.style.width = `${percentage}%`;
        progressValue.style.backgroundColor = color;
        
        // Show results section
        document.getElementById('results-section').style.display = 'block';
        
        // Show shared banner
        const resultContainer = document.querySelector('.result-container');
        const sharedBanner = document.createElement('div');
        sharedBanner.className = 'shared-banner';
        sharedBanner.innerHTML = '<i class="fas fa-share-alt"></i> Shared Result';
        resultContainer.prepend(sharedBanner);
        
        // Scroll to results
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        console.error('Error parsing shared data:', error);
      }
    }
  }

  // Check for shared result on page load
  checkForSharedResult();

  function displayHistory() {
    // Clear history table
    historyBody.innerHTML = '';

    if (bmiHistory.length === 0) {
      document.getElementById('history-section').style.display = 'none';
      return;
    }
    
    // Show history section
    document.getElementById('history-section').style.display = 'block';
    
    // Add history records to table
    bmiHistory.forEach((record, index) => {
      const row = document.createElement('tr');
      
      // Format date
      const date = new Date(record.date);
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
      
      // Determine color for category
      let categoryColor;
      switch(record.category) {
        case 'Underweight':
          categoryColor = '#3B82F6';
          break;
        case 'Normal':
          categoryColor = '#10B981';
          break;
        case 'Overweight':
          categoryColor = '#F59E0B';
          break;
        case 'Obese':
          categoryColor = '#EF4444';
          break;
      }
      
      // Create table row
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${record.bmi}</td>
        <td>${record.weight} ${record.unit === 'metric' ? 'kg' : 'lbs'}</td>
        <td>${record.unit === 'metric' 
          ? `${record.height} cm` 
          : `${Math.floor(record.height / 12)}'${record.height % 12}"`}</td>
        <td><span class="category-badge" style="background-color: ${categoryColor}20; color: ${categoryColor}">${record.category}</span></td>
        <td>
          <button class="action-button delete-record" data-index="${index}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      `;
      
      historyBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-record').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        
        // Remove from history array
        bmiHistory.splice(index, 1);
        
        // Update localStorage
        localStorage.setItem('bmiHistory', JSON.stringify(bmiHistory));
        
        // Update display
        displayHistory();
        renderHistoryChart();
      });
    });
    
    // Render history chart
    renderHistoryChart();
  }
  
  // Render BMI history chart
  function renderHistoryChart() {
    const chartContainer = document.getElementById('history-chart-container');
    if (!chartContainer) return;
    
    // Show chart container
    chartContainer.style.display = 'block';
    
    // Prepare data for chart
    const chartData = [...bmiHistory].reverse();
    const labels = chartData.map(record => {
      const date = new Date(record.date);
      return date.toLocaleDateString();
    });
    const data = chartData.map(record => record.bmi);
    
    // Destroy existing chart if it exists
    if (historyChart) {
      historyChart.destroy();
    }
    
    // Create new chart
    const ctx = document.getElementById('history-chart').getContext('2d');
    historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'BMI',
          data: data,
          backgroundColor: 'rgba(32, 178, 170, 0.2)',
          borderColor: '#20B2AA',
          borderWidth: 2,
          tension: 0.3,
          pointBackgroundColor: '#20B2AA',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const index = context.dataIndex;
                const record = chartData[index];
                return [
                  `Category: ${record.category}`,
                  `Weight: ${record.weight} ${record.unit === 'metric' ? 'kg' : 'lbs'}`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: Math.max(0, Math.min(...data) - 5),
            max: Math.max(...data) + 5,
            ticks: {
              callback: function(value) {
                return value.toFixed(1);
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
  
  // Make functions available globally
  window.displayHistory = displayHistory;
  window.renderHistoryChart = renderHistoryChart;
  window.bmiHistory = bmiHistory;
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Add CSS class to navbar on scroll
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});