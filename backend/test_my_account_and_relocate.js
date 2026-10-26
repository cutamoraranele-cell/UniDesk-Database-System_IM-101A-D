async function testAccountAndRelocation() {
  console.log('--- STARTING MY ACCOUNT & RELOCATION VERIFICATION ---');

  // Test 1: Update Profile via PUT /api/auth/profile
  console.log('\n[TEST 1] Updating user profile info for user 2 (Staff Registrar):');
  const profRes = await fetch('http://localhost:5000/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 2,
      fullName: 'Elena Rostova (Lead Registrar)',
      phoneNumber: '+63 (2) 8981-8500 loc. 4501',
      departmentOrAffiliation: 'Office of the University Registrar'
    })
  });
  const profData = await profRes.json();
  console.log('Status:', profRes.status, '| Success:', profData.success, '| Updated Name:', profData.data?.fullName, '| Office:', profData.data?.officeName);

  // Test 2: Reschedule and Relocate reservation for Unforeseen Circumstances
  // Fetch reservations for Office 1
  const resList = await fetch('http://localhost:5000/api/reservations?officeId=1').then(r => r.json());
  const sample = resList.data[0];
  console.log('\n[TEST 2] Found sample reservation for Office 1:', sample?.reservation_id);

  if (sample) {
    const relocateLocation = 'Relocated to South Hall Room 204 (AC Breakdown in Main Office)';
    const emergencyNotes = 'Emergency relocation due to AC malfunction. Rescheduled to 10:00 AM window.';
    
    console.log('Updating reservation with locationOverride and new slotTime...');
    const updateRes = await fetch(`http://localhost:5000/api/reservations/${sample.reservation_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONFIRMED',
        reservationDate: '2026-10-22',
        slotTime: '10:00:00',
        locationOverride: relocateLocation,
        notes: emergencyNotes,
        requesterRole: 'STAFF',
        requesterOfficeId: 1
      })
    });
    const updateData = await updateRes.json();
    console.log('Status:', updateRes.status, '| Message:', updateData.message);

    // Verify it is returned with location_override
    const verifyList = await fetch(`http://localhost:5000/api/reservations?officeId=1`).then(r => r.json());
    const updatedRecord = verifyList.data.find(r => r.reservation_id === sample.reservation_id);
    console.log('Verified Location Override:', updatedRecord?.location_override);
    console.log('Verified Date:', updatedRecord?.reservation_date, '| Slot:', updatedRecord?.slot_time);
  }

  // Test 3: Check Audit Log for the update
  const auditRes = await fetch('http://localhost:5000/api/admin/audit-logs?limit=5').then(r => r.json());
  const lastLog = auditRes.data[0];
  console.log('\n[TEST 3] Latest Audit Log triggered:');
  console.log('Action:', lastLog?.action_type, '| Table:', lastLog?.table_name, '| Record ID:', lastLog?.record_id);
  console.log('New values logged by trigger:', lastLog?.new_values);

  console.log('\n--- MY ACCOUNT & RELOCATION VERIFICATION COMPLETE ---');
}

testAccountAndRelocation();
