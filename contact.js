function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!name || !email || !message) {
    alert('Please fill in all fields.');
    return;
  }

  const originalText = button.textContent;
  button.textContent = 'Sending...';
  button.disabled = true;

  setTimeout(() => {
    alert(`Thank you ${name}! Your inquiry has been received. We will contact you shortly at ${email}.`);
    form.reset();
    button.textContent = originalText;
    button.disabled = false;
  }, 700);
}
