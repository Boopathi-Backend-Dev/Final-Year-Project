// Quick test to verify HTML and API
fetch('/company/internship-attendance.html')
  .then(r => r.text())
  .then(html => {
    console.log('✓ HTML file fetched');
    const hasSelect = html.includes('id="internshipSelect"');
    const hasScript = html.includes('company-attendance.js');
    console.log('✓ HTML contains internshipSelect:', hasSelect);
    console.log('✓ HTML contains company-attendance.js:', hasScript);
    
    // Check if form-control class is there
    const hasFormControl = html.includes('class="form-control"');
    console.log('✓ HTML contains form-control:', hasFormControl);
    
    if (hasSelect) {
      // Extract the select element
      const selectMatch = html.match(/<select[^>]*id="internshipSelect"[^>]*>[\s\S]*?<\/select>/);
      if (selectMatch) {
        console.log('Select element found:');
        console.log(selectMatch[0].substring(0, 200));
      }
    }
  })
  .catch(err => console.error('Error:', err));
