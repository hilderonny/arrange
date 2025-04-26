customElements.define('login-form', class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        /* Add your styles here */
      </style>
      <form id="login-form">
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
        <button type="submit">Login</button>
      </form>
    `;
  }

  connectedCallback() {
    this.shadowRoot.querySelector('#login-form').addEventListener('submit', this.handleSubmit.bind(this));
  }

  handleSubmit(event) {
    event.preventDefault();
    const username = this.shadowRoot.querySelector('#username').value;
    const password = this.shadowRoot.querySelector('#password').value;
    
    // Handle login logic here
    console.log(`Logging in with username: ${username} and password: ${password}`);
  }
})

function showLoginForm() {
  const loginForm = document.createElement('login-form')
  document.body.appendChild(loginForm)
}

export { showLoginForm }