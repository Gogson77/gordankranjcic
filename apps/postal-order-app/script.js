document.getElementById('uplatnicaForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const data = {};

  formData.forEach((value, key) => {
    data[key] = value;
  });

  
    console.log("Starting fetch");
try {
  await fetch('http://localhost:3000/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(async response => {
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error);
    }
    return response.body;
  })
  .then(response => {
    console.log('Success:', response.statusText);
    window.location.href = '/confirmation.html'; // Redirect to confirmation page
  });

} catch (error) {
  console.error('Error:', error);
  alert(error.message);
}

});
