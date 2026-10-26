async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // Test 1: Register staff without officeId
  console.log('\n[TEST 1] Registering STAFF without officeId:');
  const res1 = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Staff Without Office',
      email: `staff.test.${Date.now()}@unidesk.edu`,
      password: 'Password123!',
      userRole: 'STAFF'
    })
  });
  const data1 = await res1.json();
  console.log('Status:', res1.status, '| Success:', data1.success, '| Message:', data1.message);

  // Test 2: Register staff WITH existing officeId (e.g. office 1)
  console.log('\n[TEST 2] Registering STAFF with officeId: 1:');
  const res2 = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Staff With Office',
      email: `staff.valid.${Date.now()}@unidesk.edu`,
      password: 'Password123!',
      userRole: 'STAFF',
      officeId: 1
    })
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status, '| Success:', data2.success, '| User Office:', data2.data?.user?.officeName, '(ID:', data2.data?.user?.officeId, ')');

  // Test 3: Staff updating another office (Office 2 while assigned to Office 1)
  console.log('\n[TEST 3] Staff (Office 1) attempting to update Office 2:');
  const res3 = await fetch('http://localhost:5000/api/admin/offices/2', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Hacked Office Name',
      requesterRole: 'STAFF',
      requesterOfficeId: 1
    })
  });
  const data3 = await res3.json();
  console.log('Status:', res3.status, '| Message:', data3.message);

  // Test 4: Staff updating their OWN office (Office 1)
  console.log('\n[TEST 4] Staff (Office 1) updating their OWN Office 1:');
  const res4 = await fetch('http://localhost:5000/api/admin/offices/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Office of the University Registrar',
      phone: '+63 (2) 8981-8500 loc. 4501',
      requesterRole: 'STAFF',
      requesterOfficeId: 1
    })
  });
  const data4 = await res4.json();
  console.log('Status:', res4.status, '| Message:', data4.message);

  // Test 5: Staff attempting to create a new office
  console.log('\n[TEST 5] Staff attempting to create an office (Forbidden):');
  const res5 = await fetch('http://localhost:5000/api/admin/offices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      facilityId: 1,
      officeCode: 'TEST-FORBID',
      name: 'Staff Unauthorized Office',
      requesterRole: 'STAFF'
    })
  });
  const data5 = await res5.json();
  console.log('Status:', res5.status, '| Message:', data5.message);

  // Test 6: Reservation CRUD - Staff updating reservation belonging to their office vs another office
  // First fetch a reservation for office 1
  const resList = await fetch('http://localhost:5000/api/reservations?officeId=1').then(r => r.json());
  const sampleRes = resList.data[0];
  console.log('\n[TEST 6] Found sample reservation for Office 1:', sampleRes?.reservation_id);

  if (sampleRes) {
    // Staff from Office 2 trying to edit Office 1's reservation:
    console.log('Attempting update with requesterOfficeId = 2 (mismatch):');
    const res6a = await fetch(`http://localhost:5000/api/reservations/${sampleRes.reservation_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONFIRMED',
        requesterRole: 'STAFF',
        requesterOfficeId: 2
      })
    });
    const data6a = await res6a.json();
    console.log('Status:', res6a.status, '| Message:', data6a.message);

    // Staff from Office 1 updating their own office's reservation:
    console.log('Attempting update with requesterOfficeId = 1 (match):');
    const res6b = await fetch(`http://localhost:5000/api/reservations/${sampleRes.reservation_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONFIRMED',
        notes: 'Verified and confirmed by Registrar Staff',
        requesterRole: 'STAFF',
        requesterOfficeId: 1
      })
    });
    const data6b = await res6b.json();
    console.log('Status:', res6b.status, '| Message:', data6b.message);
  }

  console.log('\n--- ALL VERIFICATION TESTS COMPLETED ---');
}

runTests();
